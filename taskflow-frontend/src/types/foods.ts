// Food DB + recipes. Food macros are per 100 g (matches the backend, which
// computes recipe macros as food.calories * grams / 100).

export interface Food {
  id: number;
  name: string;
  barcode: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface RecipeSummary {
  id: number;
  name: string;
  servings: number;
}

export interface RecipeMacros {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

// GET /recipes/{id} -> recipe row + total macros across its items.
export interface RecipeDetail {
  id: number;
  name: string;
  servings: number;
  macros: RecipeMacros;
}

export interface NewRecipeItem {
  food_id: number;
  grams: number;
}

export interface NewRecipe {
  name: string;
  servings: number;
  items: NewRecipeItem[];
}
