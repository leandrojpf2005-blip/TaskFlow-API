from dotenv import load_dotenv
load_dotenv()

import json
from app.db.database import get_cursor

BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"
data = json.load(open("scripts/exercises.json", encoding="utf-8"))

with get_cursor() as cur:
    for ex in data:
        cur.execute("""
            INSERT INTO exercise (name, primary_muscles, secondary_muscles, instructions, images)
            VALUES (%s, %s, %s, %s, %s)
        """, (ex["name"], ex["primaryMuscles"], ex["secondaryMuscles"], ex["instructions"], [BASE + i for i in ex["images"]]))