# UpLift — Roadmap

A progressive plan from **v1.0** (first public release) toward an "almost perfect" app.
Follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **PATCH** (`1.0.x`) — bug fixes & polish, no new features
- **MINOR** (`1.x.0`) — new features, backward-compatible
- **MAJOR** (`x.0.0`) — big leaps / breaking changes

> This is a multi-release vision, not a to-do list for this month. The value is
> shipping **v1.0** and iterating in small increments. Community (v3) comes only
> after the core loop and the coaching layer are proven.

---

## v1.0.0 — First public release 🚀
The core loop, deployed, with the frontend.
- Auth (register / login / JWT)
- Food search (2.2M foods) + daily macro logging by meal
- Workout tracking (exercises, routines, sessions, volume)
- Body measurements & profile goals

---

## Patches — `1.0.x` (polish the launch)
Small fixes once real people start using it.
- `1.0.1` — Bug fixes from first real-use feedback
- `1.0.2` — **Daily macro totals** (sum calories/protein/carbs/fat vs goal — the big number at the top)
- `1.0.3` — Input validation + friendly error messages + loading/empty states
- `1.0.4` — Mobile-responsive fixes; make it installable (PWA)
- `1.0.5` — Performance pass (query timings, pagination on long lists)

---

## Minor versions — `1.x` (features, backward-compatible)
Where most of your "it feels like a real app" wins live.
- `1.1` — **Recent & favorite foods** (quick-add the stuff you eat daily)
- `1.2` — **Barcode scanning** (phone camera → lookup → autofill macros)
- `1.3` — **Workout history & PRs** (volume over time, personal records per exercise)
- `1.4` — **Progress charts** (weight, measurements, macro trends)
- `1.5` — **Custom foods & recipes** (create your own, macros auto-computed)
- `1.6` — **Copy day / meal templates / quick-add** (log a repeat day in one tap)
- `1.7` — **Goals & TDEE calculator** (macro presets, weekly targets)
- `1.8` — **Water tracking + notes/journal**

---

## v2.0.0 — The Coaching Layer 🧑‍🏫 (MAJOR)
The single-coach thesis — your portfolio differentiator.
- Coach ↔ client relationship (a coach manages assigned clients)
- Coach views a client's food log, workouts, and progress
- Coach assigns **routines** and **meal plans** to clients
- Coach dashboard: client adherence & progress at a glance
- Basic coach ↔ client messaging / feedback

### Minors on the coaching layer — `2.x`
- `2.1` — Reminders & notifications (log your meals, workout day)
- `2.2` — Weekly reports (summary email / PDF for coach & client)
- `2.3` — Check-ins (client submits weekly weight/photos, coach reviews)

---

## v3.0.0 — Community 🌍 (MAJOR) — *the big dream, correctly parked here*
Only once the core + coaching are solid.
- **Public recipe library** — users share recipes; search, browse, save, clone
- **Shared workout routines** — browse and copy others' routines into your own
- Follow / activity feed / likes
- Challenges & leaderboards (streaks, volume, consistency)
- Moderation & reporting (needed the moment content is public)

---

## v4.0.0+ — "Almost perfect" / stretch
- Native mobile app (React Native)
- AI meal suggestions & photo food recognition
- Integrations: Apple Health / Google Fit / wearables
- Multi-language support

---

## How this maps to the job hunt
- **v1.0 – v1.x** is where you **apply to jobs** — a shipped, maintained, versioned app beats any half-built second project.
- This roadmap itself is a portfolio asset: it shows you can scope, prioritize, and think in releases.
- Ship small, tag each release, keep the [CHANGELOG](CHANGELOG.md) honest. Don't skip ahead to v3.
