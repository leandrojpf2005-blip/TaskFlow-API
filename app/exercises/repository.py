from app.db.database import get_cursor

def get_exercises(q=None):
    with get_cursor() as cur:
        # inactive rows are the old catalogue: kept for workout history, hidden here
        if q:
            cur.execute("""
                SELECT * FROM exercise
                WHERE is_active AND (
                    name ILIKE %s
                    OR EXISTS (SELECT 1 FROM jsonb_each_text(names) n WHERE n.value ILIKE %s)
                )
                ORDER BY name
            """, (f"%{q}%", f"%{q}%"))
        else:
            cur.execute("""
                SELECT * FROM exercise
                WHERE is_active
                ORDER BY name
            """)
        return cur.fetchall()

def new_exercise(name, primary_muscles, instructions):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO exercise (name, primary_muscles, instructions)
            VALUES (%s, %s, %s)
            returning *
        """, (name, primary_muscles, instructions))
        return cur.fetchone()