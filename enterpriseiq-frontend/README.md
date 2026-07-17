# EnterpriseIQ — Frontend

A React (Vite) frontend for the EnterpriseIQ backend: a marketing homepage plus
the authenticated app (documents, RAG chat with citations, profile, and
role-based people management).

## Setup

```bash
npm install
cp .env.example .env   # then set VITE_API_URL to your backend, e.g. http://localhost:8000
npm run dev
```

The dev server runs on `http://localhost:5173` by default — this already matches
the backend's default CORS allow-list (`CORS_ORIGINS` in the backend `.env`).

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## What's included

- **Home** — marketing landing page (hero, platform overview, how the RAG
  pipeline works, feature grid, security section, CTA)
- **Auth** — register, login, forgot/reset password, JWT access + refresh
  token handling with automatic silent refresh on 401
- **Dashboard** — document and question stats at a glance
- **Documents** — drag-and-drop upload, search, rename, delete, download
- **Ask (Chat)** — query the document library, with citations, a verified/
  unverified badge, and recent question history
- **Profile** — update name/organization
- **People** — admin/manager view of the org roster; admins can change roles

## Configuration

All backend calls go through `src/lib/api.js`, which reads the API base URL
from `VITE_API_URL`. Update this to point at your deployed backend.
