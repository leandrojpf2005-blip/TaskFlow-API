from fastapi import APIRouter
from app.macros.services import macro_service
from app.macros.schemas.macro_schemas import NewFoodEntry, UpdateFoodEntry
from datetime import date

router = APIRouter()

@router.get("/")
def home():
    return {"message": "Coach API is running"}

@router.get("/macros")
def get_day(entry_date: date | None = None):
    if entry_date is None:
        entry_date = date.today()
    return macro_service.get_day(entry_date)

@router.post("/macros")
def post_food(entry: NewFoodEntry):
    return macro_service.create_food_entry(entry)

@router.patch("/macros/{entry_id}")
def patch_food(entry_id: int, changes: UpdateFoodEntry):
    return macro_service.update_food_entry(entry_id, changes)

@router.delete("/macros/{entry_id}")
def delete(entry_id: int):
    return macro_service.delete_food_entry(entry_id)