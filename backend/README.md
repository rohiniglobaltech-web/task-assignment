# Backend (Optional Bonus)

NestJS + PostgreSQL backend for Students CRUD.

## API

Base URL: `http://localhost:3000`

Endpoints:

- `GET /health`
- `GET /students`
- `GET /students/:id`
- `POST /students`
- `PATCH /students/:id`
- `DELETE /students/:id`

## Database (PostgreSQL via Docker)

Prereq: Docker Desktop must be running.

If you have Docker Compose available (recommended):

```bash
cd ..
docker compose up -d
```

If you do not have Docker Compose, run Postgres with `docker run`:

```bash
docker rm -f students_db 2>/dev/null || true
docker volume create students_pgdata
docker run -d --name students_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=students_db \
  -p 5432:5432 \
  -v students_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Backend uses `DATABASE_URL` from `.env`.

## Migrations

```bash
npm install
npm run prisma:migrate:dev -- --name init
```

## Run the API

```bash
npm run start:dev
```

The API enables CORS for the Vite frontend default: `http://localhost:5173`.

