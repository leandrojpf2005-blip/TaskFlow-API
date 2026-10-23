from fastapi import APIRouter, Depends, HTTPException
from app.foods import service as food_service
from app.users.dependencies import get_current_user
from app.foods.schemas import FoodOut, NewFood

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("", response_model=list[FoodOut])
def search_foods(q: str, user=Depends(get_current_user)):
    return food_service.search_foods(q)

@router.post("")
def create_food(food: NewFood):
    return food_service.new_food(food)

@router.get("/barcode/{barcode}", response_model=FoodOut)
def barcode_search(barcode:str, user=Depends(get_current_user)):
    food = food_service.search_foods_barcode(barcode)
    if food is None:
        raise HTTPException(status_code=404, detail="Barcode not found")
    return food
