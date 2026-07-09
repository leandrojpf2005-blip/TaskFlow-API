from pydantic import BaseModel
import datetime


class NewMeal(BaseModel):
    name: str
    position: int

class MealOut(BaseModel):
    id: int
    name: str
    position: int



class NewFoodEntry(BaseModel):
    meal_id: int
    food_name: str
    calories: int | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    date: datetime.date | None = None

class UpdateFoodEntry(BaseModel):
    meal_id: int | None = None
    food_name: str | None = None
    calories: int | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None

class FoodEntryOut(BaseModel):
    id: int
    date: datetime.date
    meal_id: int
    food_name: str
    calories: int | None
    protein: float | None
    carbs: float | None
    fat: float | None