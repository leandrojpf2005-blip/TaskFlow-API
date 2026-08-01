from app.db.database import get_cursor
from datetime import date


def new_meal(user_id, name, position, target_calories):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO meal(user_id, name, position, target_calories)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (user_id, name, position, target_calories))
        row = cur.fetchone()
        return {
            "id": row["id"],
            "name": name,
            "position": position,
            "target_calories": target_calories,
        }


def get_meals(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM meal
            WHERE user_id = %s
            ORDER BY position
        """, (user_id,))
        return cur.fetchall()


def get_meal_id(entry_id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM meal
            WHERE id = %s AND user_id = %s
        """, (entry_id, user_id))
        return cur.fetchone()


def delete_meal(entry_id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM meal
            WHERE id = %s AND user_id = %s
        """, (entry_id, user_id))
        return cur.rowcount


def update_meal(entry_id, user_id, name, position, target_calories):
    with get_cursor() as cur:
        cur.execute("""
            UPDATE meal
            SET name = %s,
                position = %s,
                target_calories = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, name, position, target_calories
        """, (name, position, target_calories, entry_id, user_id))
        return cur.fetchone()


def get_macros(user_id, entry_date: date):
    with get_cursor() as cur:
        cur.execute("""
            SELECT f.id, f.date, f.meal_id, m.name AS meal_name,
            f.food_name, f.calories, f.protein, f.carbs, f.fat
            FROM food_log_entry f
            JOIN meal m ON m.id = f.meal_id
            WHERE f.user_id = %s AND f.date = %s
            ORDER BY m.position
        """, (user_id, entry_date))
        return cur.fetchall()


def new_food_entry(user_id, meal_id, food_name, calories, protein, carbs, fat, entry_date=None):
    with get_cursor() as cur:
        if entry_date is None:
            cur.execute("""
                INSERT INTO food_log_entry(user_id, meal_id, food_name, calories, protein, carbs, fat)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, date
            """, (user_id, meal_id, food_name, calories, protein, carbs, fat))
        else:
            cur.execute("""
                INSERT INTO food_log_entry(user_id, meal_id, food_name, calories, protein, carbs, fat, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, date
            """, (user_id, meal_id, food_name, calories, protein, carbs, fat, entry_date))

        row = cur.fetchone()
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


def delete_food_entry(entry_id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM food_log_entry
            WHERE id = %s AND user_id = %s
        """, (entry_id, user_id))
        return cur.rowcount


def get_food_entry(entry_id, user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM food_log_entry
            WHERE id = %s AND user_id = %s
        """, (entry_id, user_id))
        return cur.fetchone()


def update_food_entry(entry_id, user_id, meal_id, food_name, calories, protein, carbs, fat):
    with get_cursor() as cur:
        cur.execute("""
            UPDATE food_log_entry
            SET meal_id = %s,
                food_name = %s,
                calories = %s,
                protein = %s,
                carbs = %s,
                fat = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, date, meal_id, food_name, calories, protein, carbs, fat
        """, (meal_id, food_name, calories, protein, carbs, fat, entry_id, user_id))
        return cur.fetchone()
