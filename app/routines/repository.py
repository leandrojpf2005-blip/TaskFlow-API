from app.db.database import get_cursor

def create_routine(user_id, name, items):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO routine (user_id, name)
            VALUES (%s, %s)
            RETURNING id
        """, (user_id, name))
        routine_id = cur.fetchone()["id"]

        for item in items:
            cur.execute("""
                INSERT INTO routine_exercise (routine_id, exercise_id, sets)
                VALUES (%s, %s, %s)
            """, (routine_id, item.exercise_id, item.sets))

        return routine_id

def get_routines(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM routine
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id, ))
        return cur.fetchall()

def get_routine(id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT routine_exercise.exercise_id, exercise.name, routine_exercise.sets FROM routine_exercise
            JOIN exercise ON exercise.id = routine_exercise.exercise_id
            JOIN routine ON routine.id = routine_exercise.routine_id
            WHERE routine_exercise.routine_id = %s and routine.user_id = %s
            ORDER BY routine_exercise.id
        """, (id, user_id))
        return cur.fetchall()

def delete_routine(user_id, id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM routine
            WHERE user_id = %s AND id = %s
        """, (user_id, id))
        return cur.rowcount

def update_routine(user_id, id, name, items):
    with get_cursor() as cur:
        cur.execute("""
            UPDATE routine
            SET name = %s
            WHERE id = %s AND user_id = %s  
        """, (name, id, user_id))
        user = cur.rowcount
        
        if user == 0:
            return None
        
        cur.execute("""
            DELETE FROM routine_exercise
            WHERE routine_id = %s
        """, (id, ))

        for item in items:
            cur.execute("""
                INSERT INTO routine_exercise (routine_id, exercise_id, sets)
                VALUES (%s, %s, %s)
            """, (id, item.exercise_id, item.sets))
        return id