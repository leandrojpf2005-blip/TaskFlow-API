from app.db.database import conn, cursor
from datetime import date
import psycopg2.extras

cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_macros(entry_date: date):
    cursor.execute("""
        SELECT f.id, f.date, f.meal_id, m.name AS meal_name,
        f.food_name, f.calories, f.protein, f.carbs, f.fat
        FROM food_log_entry f
        JOIN meal m ON m.id = f.meal_id
        WHERE f.date = %s
        ORDER BY m.position
    """, (entry_date,))
    macros = cursor.fetchall()
    return macros



def new_food_entry(meal_id, food_name, calories, protein, carbs, fat, entry_date=None):

    if entry_date is None:
        cursor.execute("""
            INSERT INTO food_log_entry(meal_id, food_name, calories, protein, carbs, fat)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, date
        """, (meal_id, food_name, calories, protein, carbs, fat))
    else:
        cursor.execute("""
            INSERT INTO food_log_entry(meal_id, food_name, calories, protein, carbs, fat, date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, date
        """, (meal_id, food_name, calories, protein, carbs, fat, entry_date))

    row = cursor.fetchone()
    conn.commit()

    return {
        "id": row["id"],
        "date": row["date"],
        "meal_id": meal_id,
        "food_name": food_name,
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
    }

def delete_food_entry(entry_id):
    cursor.execute("""
        DELETE FROM food_log_entry
        WHERE id = %s
""", (entry_id,))
    conn.commit()
    return cursor.rowcount

def get_food_entry(entry_id):
    cursor.execute("""
        SELECT * FROM food_log_entry
        WHERE id = %s
""", (entry_id,))
    food_entry = cursor.fetchone()
    return food_entry

def update_food_entry(entry_id, meal_id, food_name, calories, protein, carbs, fat):
    cursor.execute("""
        UPDATE food_log_entry
        SET meal_id = %s,
            food_name = %s,
            calories = %s,
            protein = %s,
            carbs = %s,
            fat = %s
        WHERE id = %s
        RETURNING id, date, meal_id, food_name, calories, protein, carbs, fat
""", (meal_id, food_name, calories, protein, carbs, fat, entry_id))
    row = cursor.fetchone()
    conn.commit()
    return row