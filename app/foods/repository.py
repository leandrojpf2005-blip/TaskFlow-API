from app.db.database import get_cursor


def search_foods(q):
    with get_cursor() as cur:
      cur.execute("""
        SELECT * FROM food
        WHERE name ILIKE %s LIMIT 30
      """, (f"%{q}%",))
      return cur.fetchall()

def search_foods_barcode(barcode):
    with get_cursor() as cur:
        cur.execute("""
          SELECT * FROM food
          WHERE barcode = %s
        """, ( barcode, ))
        return cur.fetchone()

def create_food(name, calories, protein_g, carbs_g, fat_g, sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g, fiber_g, sugar_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, cholesterol_mg):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO food (name, calories, protein_g, carbs_g, fat_g, sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g, fiber_g, sugar_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, cholesterol_mg)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (name, calories, protein_g, carbs_g, fat_g, sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g, fiber_g, sugar_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, cholesterol_mg))
        return cur.fetchone()