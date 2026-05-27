import { EntityManager } from '@mikro-orm/postgresql';
import crypto from 'crypto';
import { z } from 'zod';
import User, { UserRole, UserStatus } from '../entities/User.entity';
import { EmailService, emailService } from './email.service';
import { BaseService } from './base.service';
import jwt from 'jsonwebtoken';
import { ErrorUtils } from '../utils/error.utils';
import { signToken } from '../utils/auth.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { RefreshToken } from '../entities/RefreshToken';
import { createServiceResponse } from '../utils/response.util';
import { resolveUniqueNickname } from '../utils/nickname.util';

export interface TokenPair {
  token: string;
  refreshToken: string;
}

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  companyId: z.string().uuid('Invalid company ID'),
  role: z.nativeEnum(UserRole).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

const InviteUserSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  companyId: z.string().uuid(),
  role: z.nativeEnum(UserRole).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export interface AuthPayload {
  token: string;
  refreshToken?: string;
  user: User;
}

const accountConfirmStore = new Map<
  string,
  { userId: string; expiresAt: Date }
>();
const resetTokenStore = new Map<string, { userId: string; expiresAt: Date }>();


export class AuthService extends BaseService {
  private readonly emailService: EmailService;
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: jwt.SignOptions['expiresIn'] = '1d';
  private readonly refreshTokenExpiry: number = 30 * 24 * 60 * 60 * 1000;

  constructor(em: EntityManager) {
    super(em);
    this.emailService = this.emailService = EmailService.getInstance();

    this.jwtSecret = process.env.JWT_SECRET!;

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
  }

  public generateAccessToken(payload: string | Record<string, any>): string {
    const tokenPayload =
      typeof payload === 'string' ? { id: payload, userId: payload } : payload;

    return jwt.sign(tokenPayload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  public async generateRefreshToken(user: User): Promise<string> {
    const tokenString = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + this.refreshTokenExpiry);

    const refreshToken = this.em.create(RefreshToken, {
      user,
      token: tokenString,
      expiresAt,
    });

    this.em.persist(refreshToken);
    await this.em.flush();

    return tokenString;
  }

  public async createTokensPair(user: User): Promise<TokenPair> {
    // Construir payload del access token
    const tokenPayload: any = {
      id: user.id,
      userId: user.id,
      email: user.email,
    };

    // Generar ambos tokens usando los métodos reutilizables
    const token = this.generateAccessToken(tokenPayload);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      token,
      refreshToken,
    };
  }

  async register(input: RegisterInput): Promise<{ message: string }> {
    const data = RegisterSchema.parse(input);

    const nickname = await resolveUniqueNickname(
      this.em,
      data.name,
      data.lastName
    );


    // Create user as INACTIVE until email is confirmed
    const user = this.em.create(User, {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      nickname,
      role: data.role ?? UserRole.USER,
      status: UserStatus.INACTIVE,
      company: this.em.getReference(
        'Company' as never,
        data.companyId
      ) as never,
    });

    this.em.persist(user);
    await this.em.flush();

    LoggerUtils.info(`User registered (pending confirmation): ${user.email}`);

    // Generate confirmation token — 24h expiry
    const { token, refreshToken } = await this.createTokensPair(user);

    const emailToken = crypto.randomBytes(32).toString('hex');
    accountConfirmStore.set(emailToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    // Send confirmation email (non-blocking)
    emailService
      .sendAccountConfirmationEmail(user, emailToken)
      .catch(err =>
        LoggerUtils.error('Account confirmation email failed', { err })
      );

    const registerData = {
      user,
      token,
      refreshToken,
    };
    return createServiceResponse(200, 'Registration successful', true, {
      ...registerData,
    });
  }

  async confirmAccount(token: string): Promise<AuthPayload> {
    const entry = accountConfirmStore.get(token);

    if (!entry)
      throw ErrorUtils.badRequest('Invalid or expired confirmation token');

    if (entry.expiresAt < new Date()) {
      accountConfirmStore.delete(token);
      throw ErrorUtils.badRequest(
        'Confirmation token has expired. Please register again.'
      );
    }

    const user = await this.em.findOne(User, { id: entry.userId });
    if (!user) throw ErrorUtils.notFound('User');

    if (user.status === UserStatus.ACTIVE) {
      throw ErrorUtils.conflict('Account is already active');
    }

    user.status = UserStatus.ACTIVE;
    await this.em.flush();

    accountConfirmStore.delete(token);
    LoggerUtils.info(`Account confirmed: ${user.email}`);

    const authToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { token: authToken, user };
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const data = LoginSchema.parse(input);

    const user = await this.em.findOne(
      User,
      { email: data.email },
      { populate: ['company', 'projects'] }
    );

    if (!user) throw ErrorUtils.unauthorized('Invalid credentials');
    await user.company.users.init();

    const isValid = await user.comparePassword(data.password);
    if (!isValid) throw ErrorUtils.unauthorized('Invalid credentials');

    if (user.status === UserStatus.INACTIVE) {
      throw ErrorUtils.forbidden('Please confirm your email before logging in');
    }

    if (user.status === UserStatus.BANNED) {
      throw ErrorUtils.forbidden('Your account has been banned');
    }

    user.lastLoginAt = new Date();
    await this.em.flush();

    LoggerUtils.info(`User logged in: ${user.email}`);

    const tokens = await this.createTokensPair(user);
    return { ...tokens, user };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<boolean> {
    const { email } = ForgotPasswordSchema.parse(input);
    const user = await this.em.findOne(User, { email });

    if (!user) return true; // Prevent user enumeration

    const token = crypto.randomBytes(32).toString('hex');
    resetTokenStore.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
    });

    emailService
      .sendPasswordResetEmail(
        { name: user.name, lastName: user.lastName ?? '', email: user.email },
        token
      )
      .catch(err => LoggerUtils.error('Password reset email failed', { err }));

    return true;
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthPayload> {
    const { token, newPassword } = ResetPasswordSchema.parse(input);
    const entry = resetTokenStore.get(token);

    if (!entry) throw ErrorUtils.badRequest('Invalid or expired reset token');

    if (entry.expiresAt < new Date()) {
      resetTokenStore.delete(token);
      throw ErrorUtils.badRequest('Reset token has expired');
    }

    const user = await this.em.findOne(User, { id: entry.userId });
    if (!user) throw ErrorUtils.notFound('User');

    user.password = newPassword;
    await this.em.flush();

    resetTokenStore.delete(token);
    LoggerUtils.info(`Password reset for: ${user.email}`);

    const authToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { token: authToken, user };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<boolean> {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(input);
    const user = await this.em.findOne(User, { id: userId });
    if (!user) throw ErrorUtils.notFound('User');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid)
      throw ErrorUtils.unauthorized('Current password is incorrect');

    user.password = newPassword;
    await this.em.flush();

    LoggerUtils.info(`Password changed for: ${user.email}`);
    return true;
  }

  async refreshTokens(refreshTokenStr: string): Promise<AuthPayload> {
    const rt = await this.em.findOne(
      RefreshToken,
      { token: refreshTokenStr },
      { populate: ['user', 'user.company'] }
    );

    if (!rt) {
      throw ErrorUtils.unauthorized('Refresh token inválido');
    }

    if (rt.expiresAt < new Date()) {
      this.em.remove(rt);
      await this.em.flush();
      throw ErrorUtils.unauthorized(
        'Refresh token expirado. Por favor, inicia sesión nuevamente.'
      );
    }

    const user = rt.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw ErrorUtils.forbidden('El usuario no está activo');
    }
    this.em.remove(rt);

    const tokens = await this.createTokensPair(user);

    await this.em.flush();

    LoggerUtils.info(`Tokens refrescados para: ${user.email}`);

    return { ...tokens, user };
  }

  public createPasswordResetToken(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    resetTokenStore.set(token, {
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    });
    return token;
  }
}
