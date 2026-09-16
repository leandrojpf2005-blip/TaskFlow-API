from app.db.database import get_cursor

def get_exercises(q=None):
    with get_cursor() as cur:
        if q:
            cur.execute("""
                SELECT * FROM exercise
                WHERE name ILIKE %s ORDER BY name
            """, (f"%{q}%", ))
        else:
            cur.execute("""
                SELECT * FROM exercise
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