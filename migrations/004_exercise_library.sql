-- Uplift's own exercise library (data/exercises.json) replaces the
-- free-exercise-db catalogue. Additive only: the data itself is loaded by
-- scripts/import_exercise_library.py, which also hides the old rows.
ALTER TABLE exercise
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS names JSONB,
    ADD COLUMN IF NOT EXISTS body_part TEXT,
    ADD COLUMN IF NOT EXISTS equipment TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'weight_reps',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
