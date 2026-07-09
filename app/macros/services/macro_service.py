from fastapi import HTTPException
from app.macros.schemas.macro_schemas import NewFoodEntry, UpdateFoodEntry
from app.macros.repositories import macro_repo

def get_day(entry_date):
    return macro_repo.get_macros(entry_date)

def create_food_entry(entry: NewFoodEntry):
    return macro_repo.new_food_entry(
        entry.meal_id,
        entry.food_name,
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fat,
        entry_date=entry.date,
    )

def delete_food_entry(entry_id: int):
    deleted = macro_repo.delete_food_entry(entry_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Food entry not found")
    return {"message": "Food entry deleted"}

def update_food_entry(entry_id: int, changes: UpdateFoodEntry):
    existing = macro_repo.get_food_entry(entry_id)

    if existing is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    data = changes.model_dump(exclude_unset=True)
    
    meal_id = data.get("meal_id", existing["meal_id"])
    food_name = data.get("food_name", existing["food_name"])
    calories = data.get("calories", existing["calories"])
    protein = data.get("protein", existing["protein"])
    carbs = data.get("carbs", existing["carbs"])
    fat = data.get("fat", existing["fat"])

    return macro_repo.update_food_entry(entry_id, meal_id, food_name, calories, protein, carbs, fat)