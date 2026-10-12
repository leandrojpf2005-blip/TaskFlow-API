from app.db.database import get_cursor

def new_workout(user_id, routine_id, duration, date,  sets):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO workout (user_id, routine_id, duration, date)
            VALUES (%s, %s, %s, COALESCE(%s, now()))
            RETURNING id
        """, (user_id, routine_id, duration, date))
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
            SELECT w.id, w.date, w.duration, w.routine_id, r.name,
                COUNT(DISTINCT ws.exercise_id) AS exercise_count,
                COUNT(ws.id)                   AS set_count,
                ROUND(COALESCE(SUM(ws.reps * ws.weight), 0)) AS volume
            FROM workout w
            LEFT JOIN routine r ON r.id = w.routine_id
            LEFT JOIN workout_set ws ON ws.workout_id = w.id
            WHERE w.user_id = %s
            GROUP BY w.id, r.name
            ORDER BY w.date DESC
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
            SELECT SUM(reps*weight) AS volume FROM workout_set
            WHERE workout_id = %s
        """, (id, ))
        volume = cur.fetchone()["volume"]
        return volume

def get_workout_sets(id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT workout_set.id, workout_set.exercise_id, exercise.name, workout_set.reps, workout_set.weight, workout_set.set_number FROM workout_set
            JOIN exercise ON exercise.id = workout_set.exercise_id
            JOIN workout ON workout.id = workout_set.workout_id
            WHERE workout_set.workout_id = %s and workout.user_id = %s
        """, (id, user_id))
        return cur.fetchall()

def get_last_performance(user_id, exercise_ids):
    with get_cursor() as cur:
        cur.execute("""
            WITH last_session AS (
                SELECT DISTINCT ON (workout_set.exercise_id)
                    workout_set.exercise_id, workout.id AS workout_id, workout.date
                FROM workout_set
                JOIN workout ON workout.id = workout_set.workout_id
                WHERE workout.user_id = %s AND workout_set.exercise_id = ANY(%s)
                ORDER BY workout_set.exercise_id, workout.date DESC
            )
            SELECT last_session.exercise_id, last_session.date,
                   workout_set.set_number, workout_set.reps, workout_set.weight
            FROM last_session
            JOIN workout_set ON workout_set.workout_id = last_session.workout_id
                            AND workout_set.exercise_id = last_session.exercise_id
            ORDER BY last_session.exercise_id, workout_set.set_number
        """, (user_id, exercise_ids))
        return cur.fetchall()

def delete_workout(user_id, id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM workout
            WHERE user_id = %s and id = %s
        """, (user_id, id))
        return cur.rowcount