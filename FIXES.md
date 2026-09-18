# Uplift — Fixes & Follow-ups

Bugs and changes found during the first real deploy (2026-09-09).
Priority: 🔴 blocks a feature · 🟡 quality / nice-to-have · ✅ done

---

## Backend / Database (my domain)
- 🔴 **Schema drift on the server DB** — the server's tables are behind the current code:
  - `exercise` table has the **OLD** schema (`id, name, muscle_targeted`); the code expects
    `primary_muscles, secondary_muscles, instructions, images`
  - `workout` table is **missing `user_id`** (the code needs it)
  - `routine` table is **missing `created_at`**
  - → Migrate the server DB to match the current code, then re-import exercises.
- 🔴 **`routine_repo.get_routines` orders by `created_at`**, which doesn't exist in the `routine`
  table → `GET /routines` returns **500** (breaks the Workouts screen). Fix: add the column, or
  change to `ORDER BY id`.
- 🟡 **`NewMeal.target_calories` is a required `int`** — rejects `null`, so creating a meal with no
  target returns **422**. Make it `int | None`.
- 🟡 **`GET /routines/{id}` doesn't return `exercise_id`** (only name + set count) — the frontend
  resolves ids by name as a workaround. Returning `exercise_id` would make "start routine" exact.
- 🟡 **No "last performance" endpoint** — so the Strong-style "previous" column is omitted. Add a
  query for last reps/weight per exercise to light it up.

## Data
- 🔴 **Re-import the 873 exercises** into the server DB (after the `exercise` schema is fixed).
  Script: `scripts/import_exercises.py` + `scripts/exercises.json`.
- 🟡 **`backup.sql` is stale** — don't rely on it; take a FRESH `pg_dump` from current data for any
  future restore. Keep it out of git.

## Frontend
- 🟡 **Home weekly chart uses mock data** for the past 6 days — wire real 7-day history.
- ✅ **Default meals seeded on onboarding** (Breakfast / Lunch / Dinner / Snacks) — fixed.

## Deployment / Infra
- 🟡 **Serve the frontend FROM the server** (static via Caddy/nginx in docker-compose) so the laptop
  can be off — currently running the laptop dev server as a stopgap.
- 🟡 **HTTPS / public access** (optional) — Caddy auto-HTTPS, or `tailscale funnel` for a public URL.

---

## Found while testing on my phone
 

