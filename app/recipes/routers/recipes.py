from fastapi import APIRouter, Depends
from app.recipes.services import recipe_service
from app.recipes.schemas.recipe_schemas import NewRecipe
from app.users.dependencies import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("")
def list_recipes(user=Depends(get_current_user)):
    return recipe_service.get_recipes(user["id"])

@router.get("/{id}")
def get_recipe(id: int, user=Depends(get_current_user)):
    return recipe_service.get_recipe(user["id"], id)

@router.post("")
def new_recipe(recipe: NewRecipe, user=Depends(get_current_user)):
    return recipe_service.new_recipe(recipe, user["id"])

@router.delete("/{id}")
def delete_recipe(id: int, user=Depends(get_current_user)):
    return recipe_service.delete_recipe(user["id"], id)
