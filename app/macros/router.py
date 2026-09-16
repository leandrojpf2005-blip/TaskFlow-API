from fastapi import APIRouter, Depends
from app.macros import service as macro_service
from app.macros.schemas import NewFoodEntry, UpdateFoodEntry, NewMeal, UpdateMeal
from app.users.dependencies import get_current_user
from datetime import date

router = APIRouter()


@router.get("/")
def home():
    return {"message": "Coach API is running"}


@router.get("/meals")
def get_meals(user=Depends(get_current_user)):
    return macro_service.get_meals(user["id"])

@router.post("/meals")
def post_meals(entry: NewMeal, user=Depends(get_current_user)):
    return macro_service.create_meal(entry, user["id"])

@router.delete("/meals/{entry_id}")
def delete_meal(entry_id: int, user=Depends(get_current_user)):
    return macro_service.delete_meal(entry_id, user["id"])

@router.patch("/meals/{entry_id}")
def patch_meal(entry_id: int, changes: UpdateMeal, user=Depends(get_current_user)):
    return macro_service.update_meal(entry_id, changes, user["id"])


@router.get("/macros")
def get_day(entry_date: date | None = None, user=Depends(get_current_user)):
    if entry_date is None:
        entry_date = date.today()
    return macro_service.get_day(entry_date, user["id"])

@router.post("/macros")
def post_food(entry: NewFoodEntry, user=Depends(get_current_user)):
    return macro_service.create_food_entry(entry, user["id"])

@router.patch("/macros/{entry_id}")
def patch_food(entry_id: int, changes: UpdateFoodEntry, user=Depends(get_current_user)):
    return macro_service.update_food_entry(entry_id, changes, user["id"])

@router.delete("/macros/{entry_id}")
def delete(entry_id: int, user=Depends(get_current_user)):
    return macro_service.delete_food_entry(entry_id, user["id"])
