import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { buildContext } from './middlewares/context';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import dotenv from 'dotenv';
import { expressMiddleware } from '@as-integrations/express4';
import { LoggerUtils } from './utils/logger.utils';
import authRoutes from './routes/auth.routes';

dotenv.config();
export async function createApp(): Promise<Express> {
  const app = express();

  // ─── Security & Parsing ───────────────────────────────────────────────────
  app.use(
    helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' })
  );
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(authRoutes);

  // ─── Apollo GraphQL ───────────────────────────────────────────────────────
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (formattedError, error) => {
      LoggerUtils.error('GraphQL error', { error: formattedError });
      return formattedError;
    },
  });

  await apollo.start();
  LoggerUtils.info('✅  Apollo Server started');

  app.use(
    `${process.env.API_PREFIX}/graphql`,
    express.json(),
    expressMiddleware(apollo, {
      context: buildContext,
    })
  );

  // ─── 404 & Error Handling ─────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
