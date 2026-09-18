# Uplift 🔥

A macro + workout tracker (MyFitnessPal + Strong, in one app) — built from scratch to learn backend development properly. FastAPI + PostgreSQL backend with a React mobile PWA frontend, deployed on a self-hosted server.

> **Live demo:** _<add your Tailscale/public URL>_ · **Frontend:** React 19 + TypeScript · **Backend:** FastAPI + PostgreSQL

<!-- Add 2–3 screenshots here once deployed: Home, Diary, Workout session -->

---

## What it does

**Nutrition**
- Search a database of **2.2M foods** and log them by grams or servings
- Daily diary with per-meal macros, a full-day breakdown (macros %, top sources), and day-by-day navigation
- Recipes: build your own from ingredients, log them by serving
- Personalized calorie + macro targets computed from your profile (weight, height, activity, goal)

**Workouts**
- Routines and a Strong-style logging session (editable sets, live workout timer, rest timer)
- Exercise library, workout history, and volume tracking

**Cross-cutting**
- JWT authentication, light/dark themes, installable as a PWA (add to home screen)

---

## Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 19, TypeScript, Vite (mobile PWA) |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | PostgreSQL (raw SQL via psycopg2 — no ORM) |
| **Infra** | Docker / Docker Compose, self-hosted on Debian, Tailscale |

---

## Architecture

A **3-tier architecture** (React presentation → FastAPI application → PostgreSQL data), with a **layered backend** organized by feature:

```
app/<feature>/
  router.py        # HTTP endpoints (FastAPI)
  service.py       # business logic
  repository.py    # raw SQL / DB access
  schemas.py       # Pydantic in/out models
```

Each domain (users, profile, macros, foods, recipes, exercises, routines, workouts, measurements) is a self-contained module — a **modular monolith** that stays readable and could be split into services later if scale ever demanded it.

---

## Engineering highlights

These are the problems I found most interesting to solve:

- **ETL of 2.2M food records** — cleaned and bulk-loaded a large open food dataset into PostgreSQL, handling messy/missing fields and deduping on barcode.
- **Search latency: 12s → 3ms** — food-name search was doing full-table scans; added a **PostgreSQL trigram (GIN) index** to make fuzzy search near-instant.
- **Connection pooling** — replaced per-request connections with a pool, cutting query overhead.
- **Raw SQL over an ORM** — chose to write SQL directly to understand indexing, JOINs, and query cost first-hand (parameterized to prevent injection).
- **Aggregate queries** — per-meal macro totals (`GROUP BY`), daily top-macro sources (`ORDER BY`), and workout volume (`SUM(reps * weight)`) computed in the database.
- **Self-hosted deployment** — Dockerized the stack (FastAPI + PostgreSQL) and deployed to a personal Debian server, reachable privately over Tailscale.
- **Tested** — integration tests (register → login → CRUD) that caught real bugs before they shipped.

---

## Running it locally

**Backend**
cp .env.example .env
docker compose up -d --build


**Frontend**
cd taskflow-frontend
npm install
npm run dev                 




## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features (barcode scanning, progress charts, a coaching layer). Actively developed — versioned with [SemVer](https://semver.org/); changes tracked in [CHANGELOG.md](CHANGELOG.md).

---

## About

Built solo by **Leandro** — a self-taught backend developer — to go deep on real backend engineering: databases, APIs, ETL, and deployment. Currently completing the IBM Back-End Developer certificate.
