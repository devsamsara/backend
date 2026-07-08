# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build TypeScript to dist/
pnpm build

# Start dev server (requires a prior build; watches dist/)
pnpm dev

# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format
pnpm format:check

# Tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Database migrations (via MikroORM CLI)
pnpm mikro-orm migration:create   # generate a new migration
pnpm mikro-orm migration:up       # apply pending migrations
pnpm mikro-orm migration:down     # revert last migration

# Local database (Docker)
docker-compose up -d    # starts Postgres on :5432, pgAdmin on :5050
```

> **Development workflow**: Edit TypeScript in `src/`, run `pnpm build` (or keep `pnpm watch` running in a separate terminal), then `pnpm dev` to serve from `dist/`.

## Architecture

### Stack
- **Runtime**: Node.js + Express 4
- **API**: Apollo Server 5 (GraphQL) mounted at `${API_PREFIX}/graphql`
- **ORM**: MikroORM 6 with PostgreSQL driver
- **Auth**: JWT (access token) + refresh token stored in DB (`RefreshToken` entity)
- **Push notifications**: Expo push notification service via `sendPushNotification` (`src/utils/notification.util.ts`)
- **File storage**: AWS S3 with presigned URLs (upload happens from the mobile client directly)
- **Email**: Nodemailer (`src/services/email.service.ts`)
- **Validation**: Zod schemas defined at the top of each service file

### Request lifecycle
1. `server.ts` → initializes DB (`initORM`) then calls `createApp()`
2. `app.ts` → applies middleware (Helmet, CORS, JSON), mounts REST routes (`/auth/*`, `/admin/*`), then mounts Apollo at `API_PREFIX/graphql`
3. Apollo context (`src/middlewares/context.ts`) → forks a fresh `EntityManager` per request and decodes the JWT from `Authorization: Bearer <token>`. Context shape: `{ em, user: JwtPayload | null, req }`
4. Resolvers delegate to service classes, which receive `em` from context
5. Errors thrown as `ErrorUtils` instances are caught by `formatError` and serialized as structured GraphQL errors

### Key patterns

**Services** receive `em: EntityManager` in their constructor; never use the singleton ORM directly inside service logic. Each request gets its own forked EM via `getEM()` in the context builder.

**Error handling**: throw `ErrorUtils.notFound(...)`, `ErrorUtils.forbidden(...)`, etc. — these serialize automatically to `{ code, statusCode }` GraphQL extensions.

**Migrations**: TypeScript source goes in `src/database/migrations/`, compiled output goes in `dist/database/migrations/`. Production auto-runs `migrator.up()` on startup.

**Push tokens**: Stored in the `PushToken` entity linked to `User`. `NotificationService.notifyProjectMembers()` loads project members, filters by `enabled` tokens, and fires-and-forgets — notification failures are logged but never propagate to the caller.

### Domain model

```
Company
  └── users: User[]          (one company has many users)

User
  ├── company: Company
  ├── projects: Project[]    (many-to-many, via Project.members)
  ├── pushTokens: PushToken[]
  └── refreshTokens: RefreshTokenEntity[]

Project
  ├── members: User[]        (many-to-many owner side)
  ├── photos: PhotoEntity[]
  ├── notes: Note[]
  └── timeline: TimelineEvent[]
```

`BaseEntity` (`src/entities/Base.entity.ts`) provides `id` (UUID), `createdAt`, and `updatedAt` for all entities.

### REST routes (non-GraphQL)
All other operations go through GraphQL. The small REST surface in `src/routes/auth.routes.ts` handles email-link flows:
- `GET /auth/confirm-account`
- `ALL /auth/reset-password`
- `GET /auth/confirm-invitation`
- `GET /admin/confirm-company` / `GET /admin/reject-company`

### Environment variables
Copy `aws.env.example` for S3 config. Required `.env` keys include:
`PORT`, `NODE_ENV`, `API_PREFIX`, `CORS_ORIGIN`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA`, `DATABASE_URL` (production), `JWT_SECRET`, AWS S3 vars.

`NODE_ENV=dev` → uses individual `DB_*` vars (local Docker); anything else → uses `DATABASE_URL`.