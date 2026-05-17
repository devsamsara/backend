 import nodemailer, { Transporter } from 'nodemailer';
import {
  accountConfirmationEmailHtml,
  companyConfirmationEmailHtml,
  passwordResetEmailHtml,
} from '../utils/email.templates.utils';
import dotenv from 'dotenv';
 import {CompanyStatus} from "../entities/Company.entity";
 import User from '../entities/User.entity';
 import { LoggerUtils } from '../utils/logger.utils';

// ─── Types ────────────────────────────────────────────────────────────────────
dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface CompanyEmailData {
  name: string;
  industry: string;
  size: number;
  status: CompanyStatus;
}

export interface UserEmailData {
  name: string;
  email: string;
}

// ─── Service (Singleton) ──────────────────────────────────────────────────────

export class EmailService {
  private static instance: EmailService;
  private readonly transporter: Transporter;
  private readonly from: string;

  private constructor() {
    this.from = process.env.EMAIL_USER!;

    this.transporter = nodemailer.createTransport({
      host: 'samsarasystems.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async send(options: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, ...options });
      LoggerUtils.info(`Email sent to ${options.to} — "${options.subject}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      LoggerUtils.error(`Failed to send email to ${options.to}: ${message}`);
      throw new Error(`Failed to send email: ${message}`);
    }
  }

  // ── Account confirmation → new user ────────────────────────────────────────
  public async sendAccountConfirmationEmail(
    user: User,
    confirmToken: string,
  ): Promise<void> {
    await this.send({
      to: user.email,
      subject: `Confirma tu cuenta en ${process.env.APP_NAME ?? 'Samsara'}`,
      html: accountConfirmationEmailHtml(user, confirmToken),
    });
  }

  // ── Company confirmation → admin ────────────────────────────────────────────
  public async sendCompanyConfirmationEmail(
    confirmToken: string,
    company: CompanyEmailData,
    createdBy: UserEmailData,
  ): Promise<void> {
    await this.send({
      to: createdBy.email,
      subject: `Nueva solicitud de empresa: ${company.name}`,
      html: companyConfirmationEmailHtml(confirmToken, company, createdBy),
    });
  }

  // ── Password reset → user ───────────────────────────────────────────────────
  public async sendPasswordResetEmail(
    user: UserEmailData,
    resetToken: string,
  ): Promise<void> {
    await this.send({
      to: user.email,
      subject: 'Restablece tu contraseña',
      html: passwordResetEmailHtml(user.name, resetToken),
    });
  }
}

export const emailService = EmailService.getInstance();
