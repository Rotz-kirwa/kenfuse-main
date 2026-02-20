# Kenfuse Backend API

Express + Prisma + PostgreSQL backend for authentication and core Kenfuse activities.

## Fast setup (recommended)

Run one command to bootstrap local PostgreSQL, apply schema, and seed data:

```bash
cd backend
npm run db:setup
```

This command will:
- start (or reuse) Docker container `kenfuse-postgres`
- configure `.env` with `DATABASE_URL` on port `5433`
- run Prisma generate + schema push + seed

Then start API:

```bash
npm run dev
```

API base URL: `http://localhost:4000`

## Promote admin user

After creating a user account from frontend/auth, run:

```bash
npm run admin:promote -- your-real-email@example.com
```

Useful helper:

```bash
npm run users:list
```

## Manual setup (optional)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run dev
```

## Auth header for protected endpoints

```http
Authorization: Bearer <token>
```

## API routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/legacy-plan/me`
- `PUT /api/legacy-plan/me`
- `GET /api/fundraisers`
- `GET /api/fundraisers/:id`
- `POST /api/fundraisers`
- `POST /api/fundraisers/:id/contributions`
- `GET /api/memorials`
- `GET /api/memorials/:id`
- `POST /api/memorials`
- `POST /api/memorials/:id/tributes`
- `GET /api/marketplace/categories`
- `GET /api/marketplace/listings`
- `POST /api/marketplace/listings`
- `GET /api/activities/me`
- `GET /api/activities/feed`
- `GET /api/admin/overview`
- `PATCH /api/admin/fundraisers/:id/status`
- `PATCH /api/admin/listings/:id/status`
- `PATCH /api/admin/memorials/:id/visibility`
