import { Request } from 'express';
import { EntityManager } from '@mikro-orm/postgresql';
import { getEM } from '../database/orm';
import { verifyToken, extractBearerToken, JwtPayload } from '../utils/auth.utils';
import { LoggerUtils } from '../utils/logger.utils';

export interface GraphQLContext {
  em: EntityManager;
  user: JwtPayload | null;
  req: Request;
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const em = getEM();
  let user: JwtPayload | null = null;

  const token = extractBearerToken(req.headers.authorization);

  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      LoggerUtils.debug('Invalid or expired token in request');
    }
  }

  return { em, user, req };
}