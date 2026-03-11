# Full Stack Assignment – Students Table

This repo is organized for easy recruiter review.

## Frontend

- Path: `frontend/`
- Tech: React + TypeScript + Vite

Run:

```bash
cd frontend
npm install
npm run dev
```

Build:

```bash
cd frontend
npm run build
npm run preview
```

Deploy (Vercel / Netlify):

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `frontend`

## Backend (Optional Bonus)

Implemented under `backend/` (NestJS + Prisma + PostgreSQL).

Run (see full instructions in `backend/README.md`):

```bash
cd backend
npm install
npm run start:dev
```

---

### Frontend Feature Checklist

React (frontend-only) Students Table using in-memory state (no backend required).

## Features

- Student list columns: `Name`, `Email`, `Age`, `Actions (Edit/Delete)`
- Add student form with validation
  - All fields required
  - Email format validation
  - Age must be a whole number between 1 and 120
- Edit student with pre-filled values and the same validations
- Delete student with a confirmation dialog
- Simulated loading state (skeleton rows)
- Search filter (name/email/age)
- Excel download
  - Download filtered rows
  - Download full dataset

## Notes

- All CRUD operations are handled in frontend state only (no persistence across refresh).
- Excel export uses `xlsx`.
# task-assignment
