import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import dotenv from 'dotenv';
import User from '../entities/User.entity';
import { Company } from '../entities/Company.entity';
import { Note } from '../entities/Note.entity';
import { PhotoEntity } from '../entities/Photo.entity';
import { Project } from '../entities/Project.entity';
import { TimelineEvent } from '../entities/TimelineEvent.entity';
import { RefreshToken } from '../entities/RefreshToken';

dotenv.config();
const isLocal = process.env.NODE_ENV === 'production';

console.log(isLocal);
export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: isLocal ? undefined : process.env.DATABASE_URL,
  /*host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT ?? '5432') ,
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA,*/

  // Entities
  entities: [
    User,
    Company,
    Note,
    PhotoEntity,
    Project,
    TimelineEvent,
    RefreshToken,
  ],
  entitiesTs: ['src/entities/**/*.entity.ts'],
  allowGlobalContext: true,
  // Migrations
  migrations: {
    path: 'dist/database/migrations',
    pathTs: 'src/database/migrations',
    glob: '!(*.d).{js,ts}',
    dropTables: false,
  },

  schemaGenerator: {
    disableForeignKeys: false,
  },
  extensions: [Migrator, SeedManager],
  driverOptions: {
    connection: {
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    },
    family: 4,
  },
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    propagateCreateError: false,
  },
  seeder: {
    path: 'dist/database/seeders',
    pathTs: 'src/database/seeders',
    glob: '!(*.d).{js,ts}',
    defaultSeeder: 'DatabaseSeeder',
  },

  // Debug in development
  debug: false,
});
