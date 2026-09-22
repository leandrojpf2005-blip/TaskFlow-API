from app.db.database import get_cursor

def create_recipe(user_id, name, servings, items):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO recipe (user_id, name, servings)
            VALUES (%s, %s, %s)
            returning id
        """, (user_id, name, servings,))
        recipe_id = cur.fetchone()["id"]

        for item in items:
            cur.execute("""
                INSERT INTO recipe_item (recipe_id, food_id, grams)
                VALUES (%s, %s, %s)
            """,(recipe_id, item.food_id, item.grams ))

    return recipe_id

def get_recipes(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM recipe
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        return cur.fetchall()

def get_recipe(user_id, id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM  recipe
            WHERE user_id = %s AND id = %s
        """, (user_id, id))
        return cur.fetchone()

def get_recipe_macros(recipe_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT
                ROUND(SUM(food.calories  * recipe_item.grams / 100))      AS calories,
                ROUND(SUM(food.protein_g * recipe_item.grams / 100), 1)   AS protein_g,
                ROUND(SUM(food.carbs_g   * recipe_item.grams / 100), 1)   AS carbs_g,
                ROUND(SUM(food.fat_g     * recipe_item.grams / 100), 1)   AS fat_g
            FROM recipe_item
            JOIN food ON food.id = recipe_item.food_id
            WHERE recipe_item.recipe_id = %s
        """, (recipe_id, ))
        return cur.fetchone()

def delete_recipe(user_id, id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM recipe
            WHERE id = %s AND user_id = %s
        """, (id, user_id))
        return cur.rowcount