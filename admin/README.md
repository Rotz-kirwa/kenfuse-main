# Kenfuse Admin (Standalone)

This is a separate deployable admin app.

## Setup

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:5174` by default.

## Build for deployment

```bash
npm run build
```

Deploy the generated `admin/dist` folder to your hosting platform.

## Login and auth

The admin app has its own login form and stores JWT token in browser storage.
Use an account with `ADMIN` role.

## Important backend CORS

In `backend/.env`, ensure `CORS_ORIGINS` includes your admin URL, e.g.

```env
CORS_ORIGINS="http://localhost:8080,http://localhost:5174,https://admin.yourdomain.com"
```
# kenfise-new-admin
