import { MikroORM } from '@mikro-orm/postgresql';
import config from '../config/mikro-orm.config';
import { LoggerUtils } from '../utils/logger.utils';

let orm: MikroORM;

export async function initORM(): Promise<MikroORM> {
  if (orm) return orm;

  try {
    orm = await MikroORM.init(config);
    LoggerUtils.info('✅  Database connected successfully');

    // Run pending migrations automatically in production
    if (process.env.NODE_ENV === 'production') {
      const migrator = orm.getMigrator();
      await migrator.up();
      LoggerUtils.info('✅  Migrations applied');
    }

    return orm;
  } catch (error) {
    LoggerUtils.error('❌  Database connection failed', error);
    throw error;
  }
}

export function getORM(): MikroORM {
  if (!orm) throw new Error('ORM not initialized. Call initORM() first.');
  return orm;
}

export function getEM() {
  return getORM().em.fork();
}
