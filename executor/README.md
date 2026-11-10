# Production deployment

Deploy `user-frontend` and `admin-frontend` as separate Next.js projects on Vercel. Run PostgreSQL, Redis, both backend APIs, and the admin queue worker on the Docker host.

## Local BullMQ dashboard and demo trip

The BullMQ dashboard is included only in the local development Compose stack and is bound to the host loopback interface:

```sh
cd executor
docker compose up -d --build mandi-queue-dashboard
docker compose exec user-backend npm run db:seed:mandi
```

Open [http://localhost:3014/admin/queues](http://localhost:3014/admin/queues) to inspect the `mandi-trips` queue. The seed command idempotently creates a demo driver and a scheduled trip for tomorrow, then schedules its delayed BullMQ jobs. Do not expose this unauthenticated dashboard publicly or add it to the production Compose stack.

## Firebase Admin credentials (local development)

Keep the Firebase Admin service-account JSON at `user-backend/secrets/firebase-service-account.json`. Set `FIREBASE_SERVICE_ACCOUNT=./secrets/firebase-service-account.json` in the ignored `user-backend/.env`; the backend reads this path without putting the private key in source control. The `user-backend/.gitignore` excludes the entire `secrets/` directory and service-account JSON files. Never commit service-account credentials or paste their contents into logs.

## Configure the backend host

From the repository root, copy the example files and replace every example secret or domain:

```sh
cp executor/.env.production.example executor/.env
cp user-backend/.env.production.example user-backend/.env.production
cp admin-backend/.env.production.example admin-backend/.env.production
```

Set strong, unique values for `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_LOGIN_SECRET`, and `JWT_REFRESH_SECRET`. Set each backend's `ALLOWED_ORIGIN` to the exact HTTPS origin(s) of the frontend(s) that call it, comma-separated if there is more than one. Keep the real `.env` files private; they are ignored by Git.

The compose file binds the APIs to `127.0.0.1` only. Configure the host's HTTPS reverse proxy to forward the user API domain to `127.0.0.1:3004` and the admin API domain to `127.0.0.1:3006`. Do not expose the backend ports directly to the internet: authentication cookies are secure in production and API traffic must use HTTPS.

Start only the database and Redis first, from `executor/`:

```sh
docker compose -f docker-compose.production.yml up -d postgres redis
```

Run all migrations only from the admin backend after the database is healthy:

```sh
docker compose -f docker-compose.production.yml run --rm admin-backend npm run db:migrate
```

If you intentionally need demo data in a non-production environment, run seeders from admin only:

```sh
docker compose -f docker-compose.production.yml run --rm admin-backend npm run db:seed
```

Do not run demo seeders in production.

Before starting the user API, create its restricted runtime database role using the admin PostgreSQL connection:

```sh
docker exec -it psc-postgres psql -U postgres -d patidar-stone-crusher-website-db
```

At the `psql` prompt, run the following. Replace `patidar_app` if you changed `APP_DB_USERNAME`, and replace `postgres` in the default-privilege statements if you changed `POSTGRES_USER`:

```sql
CREATE ROLE patidar_app LOGIN;
\password patidar_app
GRANT CONNECT ON DATABASE "patidar-stone-crusher-website-db" TO patidar_app;
GRANT USAGE ON SCHEMA public TO patidar_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO patidar_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO patidar_app;
GRANT USAGE ON ALL TYPES IN SCHEMA public TO patidar_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO patidar_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO patidar_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE ON TYPES TO patidar_app;
\q
```

The `\password` command securely prompts for the same value as `APP_DB_PASSWORD` in `executor/.env`; do not type the password into the SQL statement or shell history. The user-backend role can read and write application rows but cannot create, alter, or drop schema objects.

Then build and start the APIs and worker:

```sh
docker compose -f docker-compose.production.yml up -d --build
```

Check service output with `docker compose -f docker-compose.production.yml logs -f`. PostgreSQL and Redis are available only on the private Docker network; their data is stored in named volumes. Admin owns all migrations and seeders; user-backend keeps only the Sequelize models it uses at runtime.

## Configure Vercel

Create one Vercel project per frontend and set its root directory to `user-frontend` or `admin-frontend`. No frontend Dockerfiles are needed. Set the following Vercel environment variable for the appropriate project in each environment (Production, Preview, and Development as needed):

| Vercel project | `NEXT_PUBLIC_API_URL` |
| --- | --- |
| `user-frontend` | `https://api.example.com` |
| `admin-frontend` | `https://admin-api.example.com` |

Replace these sample URLs with the HTTPS domains configured on the reverse proxy, then redeploy so the build uses the new values. Use HTTPS frontend domains on the same parent site as their API domains (for example, `www.example.com` and `api.example.com`) so browser cookie authentication works with the current `SameSite=Lax` cookie policy. Set the matching frontend origin in each backend's `ALLOWED_ORIGIN`.
