// Food DB + recipes API.
//   GET    /foods?q=          -> Food[]        (macros per 100 g)
//   GET    /recipes           -> RecipeSummary[]
//   GET    /recipes/{id}      -> RecipeDetail  (recipe + total macros)
//   POST   /recipes           -> recipe id
//   DELETE /recipes/{id}

import { request } from "./client";
import type { Food, RecipeSummary, RecipeDetail, NewRecipe } from "../types/foods";

export const searchFoods = (q: string) => request<Food[]>(`/foods?q=${encodeURIComponent(q)}`);

export const getRecipes = () => request<RecipeSummary[]>("/recipes");

export const getRecipe = (id: number) => request<RecipeDetail>(`/recipes/${id}`);

export const createRecipe = (r: NewRecipe) =>
  request<number>("/recipes", { method: "POST", body: JSON.stringify(r) });

export const deleteRecipe = (id: number) =>
  request<unknown>(`/recipes/${id}`, { method: "DELETE" });
