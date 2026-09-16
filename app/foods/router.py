from fastapi import APIRouter, Depends
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
    
