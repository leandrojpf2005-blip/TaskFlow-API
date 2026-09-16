from app.db.database import get_cursor


def get_measurements(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM measurement
            WHERE user_id = %s
        """, (user_id,))
        return cur.fetchall()


def new_measurements(user_id, weight_kg, chest_cm, waist_cm, arm_cm, thigh_cm):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO measurement (user_id, weight_kg, chest_cm, waist_cm, arm_cm, thigh_cm)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (user_id, weight_kg, chest_cm, waist_cm, arm_cm, thigh_cm))
        return cur.fetchone()
