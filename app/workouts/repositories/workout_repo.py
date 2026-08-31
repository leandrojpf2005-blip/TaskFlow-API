from app.db.database import get_cursor

def new_workout(user_id, routine_id, duration, sets):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO workout (user_id, routine_id, duration)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (user_id, routine_id, duration))
        workout_id = cur.fetchone()["id"]

        for item in sets:
            cur.execute("""
                INSERT INTO workout_set (workout_id, exercise_id, set_number, weight, reps)
                VALUES (%s, %s, %s, %s, %s)
            """, (workout_id, item.exercise_id, item.set_number, item.weight, item.reps))

        return workout_id

def get_workouts(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM workout
            WHERE user_id = %s
            ORDER BY date DESC
        """, (user_id, ))
        return cur.fetchall()

def get_workout(id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM workout
            WHERE id = %s AND user_id = %s
        """, (id, user_id))
        workout = cur.fetchone()
        return workout

def get_workout_volume(id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT SUM(reps*weight) FROM workout_set
            WHERE workout_id = %s
        """, (id, ))
        volume = cur.fetchone()["volume"]
        return {"volume": volume}

def get_workout_sets(id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT workout_set.id, workout_set.exercise_id, exercise.name, workout_set.reps, workout_set.weight, workout_set.set_number FROM workout_set
            JOIN exercise ON exercise.id = workout_set.exercise_id
            JOIN workout ON workout.id = workout_set.workout_id
            WHERE workout_set.workout_id = %s and workout.user_id = %s
        """, (id, user_id))
        return cur.fetchall()