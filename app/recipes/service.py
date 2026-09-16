from app.recipes import repository as recipe_repo
from app.recipes.schemas import NewRecipe

def new_recipe(recipe: NewRecipe, user_id):
    return recipe_repo.create_recipe(user_id, recipe.name, recipe.servings, recipe.items)

def get_recipes(user_id):
    return recipe_repo.get_recipes(user_id)

def get_recipe(user_id, id):
    recipe = recipe_repo.get_recipe(user_id, id)
    if recipe is None:
        return None
    macros = recipe_repo.get_recipe_macros(id)
    return {**recipe, "macros": macros}

def get_recipe_macros(recipe_id):
    return recipe_repo.get_recipe_macros(recipe_id)

def delete_recipe(user_id, id):
    return recipe_repo.delete_recipe(user_id, id)