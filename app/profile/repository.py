from app.db.database import get_cursor
import psycopg2.extras


def get_profile(user_id):
    with get_cursor() as cur:    
        cur.execute("""
            SELECT * FROM profile
            WHERE user_id = %s
        """, (user_id, ))
        profile = cur.fetchone()
        return profile

def save_profile(user_id, weight_kg, height_cm, age, sex, activity, weekly_change_kg):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO profile (user_id, weight_kg, height_cm, age, sex, activity, weekly_change_kg)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (user_id) DO UPDATE SET
        weight_kg = EXCLUDED.weight_kg,
        height_cm = EXCLUDED.height_cm,
        age = EXCLUDED.age,
        sex = EXCLUDED.sex,
     activity = EXCLUDED.activity,
        weekly_change_kg = EXCLUDED.weekly_change_kg
    RETURNING *
    """, (user_id, weight_kg, height_cm, age, sex, activity, weekly_change_kg))
        row = cur.fetchone()
        return row

def save_targets(user_id, target_calories, target_protein_g, target_carbs_g, target_fat_g):
    with get_cursor() as cur:
        cur.execute("""
            UPDATE profile
            SET target_calories = %s,
                target_protein_g = %s,
                target_carbs_g = %s,
                target_fat_g = %s
            WHERE user_id = %s
            RETURNING * 
    """, (target_calories, target_protein_g, target_carbs_g, target_fat_g, user_id))
        row = cur.fetchone()
        return row