import 'reflect-metadata';
import { initORM } from './database/orm';
import { createApp } from './app';
import dotenv from 'dotenv';
import { LoggerUtils } from './utils/logger.utils';

dotenv.config();
async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to database first
    await initORM();

    // 2. Create Express + Apollo app
    const app = await createApp();
    // 3. Start listening
    const server = app.listen(process.env.PORT, () => {
      LoggerUtils.info(
        `🚀  Server running on http://localhost:${process.env.PORT}`
      );
      LoggerUtils.info(
        `🔗  GraphQL endpoint: http://localhost:${process.env.PORT}${process.env.API_PREFIX}/graphql`
      );
      LoggerUtils.info(
        `🩺  Health check:     http://localhost:${process.env.PORT}/health`
      );
      LoggerUtils.info(`🌍  Environment:      ${process.env.NODE_ENV}`);
    });

    // ─── Graceful Shutdown ─────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      LoggerUtils.info(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        LoggerUtils.info('✅  HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        LoggerUtils.error('❌  Forced exit after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ─── Unhandled Rejections ──────────────────────────────────────────────
    process.on('unhandledRejection', reason => {
      LoggerUtils.error('Unhandled rejection', { reason });
    });

    process.on('uncaughtException', error => {
      LoggerUtils.error('Uncaught exception', { error });
      process.exit(1);
    });
  } catch (error) {
    LoggerUtils.error('❌  Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
