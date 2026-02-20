# Kenfuse

Kenfuse is a React frontend with a new Express + PostgreSQL backend for:

- user registration and login
- legacy planning
- fundraising and contributions
- memorial pages and tributes
- marketplace listings
- activity logs

## Project structure

- `src/`: frontend (Vite + React + Tailwind)
- `backend/`: API service (Express + Prisma)
- `docker-compose.yml`: local PostgreSQL

## Quick start

### 1) Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:8080`.

### 2) Database

```bash
npm run db:up
```

PostgreSQL runs on `localhost:5432`.

### 3) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:4000`.

## Core API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/legacy-plan/me`
- `PUT /api/legacy-plan/me`
- `GET /api/fundraisers`
- `POST /api/fundraisers`
- `POST /api/fundraisers/:id/contributions`
- `GET /api/memorials`
- `POST /api/memorials`
- `POST /api/memorials/:id/tributes`
- `GET /api/marketplace/categories`
- `GET /api/marketplace/listings`
- `POST /api/marketplace/listings`
- `GET /api/activities/me`
- `GET /api/activities/feed`

For detailed backend instructions, see `backend/README.md`.
# kenfuse-main
