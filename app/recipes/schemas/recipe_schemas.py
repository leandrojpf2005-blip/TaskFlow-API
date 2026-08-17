from pydantic import BaseModel
import datetime

class RecipeItemIn(BaseModel):
    food_id: int
    grams: float

class NewRecipe(BaseModel):
    name: str
    servings: int
    items: list[RecipeItemIn]

class RecipeOut(BaseModel):
    id: int
    name: str
    servings: int
    visibility: str
    created_at: datetime.datetime