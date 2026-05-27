import jwt from 'jsonwebtoken';
import { ErrorUtils } from './error.utils';
import { UserRole } from '../entities/User.entity';
import dotenv from 'dotenv';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

dotenv.config();

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN!,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as unknown as JwtPayload;
  } catch {
    throw ErrorUtils.unauthorized('Invalid or expired token');
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}