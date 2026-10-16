"""Load data/exercises.json into the exercise table. Safe to re-run.

Run from the repo root, after migrations/004:
    python -m scripts.import_exercise_library

For each exercise in the file:
  1. a row with the same slug exists           -> update it
  2. an old free-exercise-db row has its photo -> adopt it: same id, so the
     routines and workout history that point at it now show the new name
  3. otherwise                                 -> insert a new row
Then old free-exercise-db rows nobody adopted, and slugs that left the file,
are hidden from the picker (is_active = false). Nothing is deleted: workout
history still points at them.
"""
from dotenv import load_dotenv
load_dotenv()

import json
from psycopg2.extras import Json
from app.db.database import get_cursor

OLD_CATALOGUE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/%"

data = json.load(open("data/exercises.json", encoding="utf-8"))["exercises"]
counts = {"updated": 0, "adopted": 0, "inserted": 0}

with get_cursor() as cur:
    for ex in data:
        row = {
            "slug": ex["slug"],
            "name": ex["names"]["en"],
            "names": Json(ex["names"]),
            "body_part": ex["body_part"],
            "equipment": ex["equipment"],
            "type": ex["type"],
            "primary_muscles": ex["primary_muscles"],
            "secondary_muscles": ex["secondary_muscles"],
            "image": ex["image"],
        }

        cur.execute("SELECT id FROM exercise WHERE slug = %(slug)s", row)
        found = cur.fetchone()
        action = "updated"
        if not found and row["image"]:
            cur.execute("""
                SELECT id FROM exercise
                WHERE slug IS NULL AND images[1] = %(image)s
                LIMIT 1
            """, row)
            found = cur.fetchone()
            action = "adopted"

        if found:
            cur.execute("""
                UPDATE exercise SET
                    slug = %(slug)s, name = %(name)s, names = %(names)s,
                    body_part = %(body_part)s, equipment = %(equipment)s, type = %(type)s,
                    primary_muscles = %(primary_muscles)s, secondary_muscles = %(secondary_muscles)s,
                    images = CASE WHEN %(image)s::text IS NULL THEN NULL ELSE ARRAY[%(image)s::text] END,
                    is_active = TRUE
                WHERE id = %(id)s
            """, {**row, "id": found["id"]})
        else:
            action = "inserted"
            cur.execute("""
                INSERT INTO exercise (slug, name, names, body_part, equipment, type,
                                      primary_muscles, secondary_muscles, images)
                VALUES (%(slug)s, %(name)s, %(names)s, %(body_part)s, %(equipment)s, %(type)s,
                        %(primary_muscles)s, %(secondary_muscles)s,
                        CASE WHEN %(image)s::text IS NULL THEN NULL ELSE ARRAY[%(image)s::text] END)
            """, row)
        counts[action] += 1

    cur.execute("""
        UPDATE exercise SET is_active = FALSE
        WHERE is_active AND (
            (slug IS NULL AND images[1] LIKE %s)
            OR slug <> ALL(%s)
        )
    """, (OLD_CATALOGUE, [ex["slug"] for ex in data]))
    counts["hidden"] = cur.rowcount

print(", ".join(f"{k}: {v}" for k, v in counts.items()))
