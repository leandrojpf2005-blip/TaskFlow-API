from app.foods import repository as food_repo
from app.foods.schemas import NewFood

def search_foods(q):
    return food_repo.search_foods(q)

def search_foods_barcode(barcode):
    return food_repo.search_foods_barcode(barcode)

def new_food(food: NewFood):
    return food_repo.create_food(
        food.name,
        food.calories,
        food.protein_g,
        food.carbs_g,
        food.fat_g,
        food.sat_fat_g,
        food.mono_fat_g,
        food.poly_fat_g,
        food.trans_fat_g,
        food.fiber_g,
        food.sugar_g,
        food.sodium_mg,
        food.potassium_mg,
        food.calcium_mg,
        food.iron_mg,
        food.cholesterol_mg,
    )