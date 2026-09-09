import { useEffect, useState } from "react";
import * as foodsApi from "../api/foods";
import type { Food, RecipeSummary, RecipeDetail } from "../types/foods";
import type { Meal, NewFoodEntry } from "../types/macros";
import { round1 } from "../lib/format";
import { IconChevronLeft } from "./icons";

type Step = "foods" | "food-detail" | "recipes" | "recipe-detail" | "recipe-build" | "manual";
interface BuildItem {
  food: Food;
  grams: number;
}

const scale = (per100: number | null, grams: number) => Math.round(((per100 ?? 0) * grams) / 100);

function ErrorBanner({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null;
  return (
    <div className="banner">
      <span>{error}</span>
      <button onClick={onDismiss}>✕</button>
    </div>
  );
}

function MealPicker({
  meals,
  mealId,
  onPick,
}: {
  meals: Meal[];
  mealId: number;
  onPick: (id: number) => void;
}) {
  return (
    <div className="seg">
      {meals.map((m) => (
        <button key={m.id} className={mealId === m.id ? "on" : ""} onClick={() => onPick(m.id)}>
          {m.name}
        </button>
      ))}
    </div>
  );
}

export function AddFlow({
  meals,
  initialMealId,
  onAdd,
  onClose,
}: {
  meals: Meal[];
  initialMealId: number;
  onAdd: (e: NewFoodEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("foods");
  const [mealId, setMealId] = useState(initialMealId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // food search
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);

  // food detail
  const [food, setFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [unit, setUnit] = useState<"g" | "serving">("g"); // serving = 100 g (the DB basis)
  const [ingredientMode, setIngredientMode] = useState(false);

  // recipes
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [servings, setServings] = useState(1);

  // recipe builder
  const [buildName, setBuildName] = useState("");
  const [buildServings, setBuildServings] = useState(1);
  const [buildItems, setBuildItems] = useState<BuildItem[]>([]);

  // manual
  const [mName, setMName] = useState("");
  const [mCals, setMCals] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");

  const mealName = meals.find((m) => m.id === mealId)?.name ?? "meal";

  useEffect(() => {
    if (step !== "foods") return;
    const query = q.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      foodsApi
        .searchFoods(query)
        .then((r) => !cancelled && setResults(r.slice(0, 40)))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, step]);

  const loadRecipes = () => {
    setRecipesLoading(true);
    foodsApi
      .getRecipes()
      .then(setRecipes)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load recipes"))
      .finally(() => setRecipesLoading(false));
  };

  const openFood = (f: Food) => {
    setFood(f);
    setGrams(100);
    setUnit("g");
    setStep("food-detail");
  };

  const logFood = async () => {
    if (!food) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        meal_id: mealId,
        food_name: food.name,
        calories: scale(food.calories, grams),
        protein: scale(food.protein_g, grams),
        carbs: scale(food.carbs_g, grams),
        fat: scale(food.fat_g, grams),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
      setBusy(false);
    }
  };

  const addIngredient = () => {
    if (!food) return;
    setBuildItems((prev) => [...prev, { food, grams }]);
    setIngredientMode(false);
    setStep("recipe-build");
  };

  const openRecipe = async (id: number) => {
    setError(null);
    try {
      const r = await foodsApi.getRecipe(id);
      setRecipe(r);
      setServings(1);
      setStep("recipe-detail");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open recipe");
    }
  };

  const logRecipe = async () => {
    if (!recipe) return;
    const per = (v: number | null) => Math.round(((v ?? 0) / recipe.servings) * servings);
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        meal_id: mealId,
        food_name: recipe.name,
        calories: per(recipe.macros.calories),
        protein: per(recipe.macros.protein_g),
        carbs: per(recipe.macros.carbs_g),
        fat: per(recipe.macros.fat_g),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
      setBusy(false);
    }
  };

  const saveRecipe = async () => {
    if (!buildItems.length) {
      setError("Add at least one ingredient.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await foodsApi.createRecipe({
        name: buildName.trim() || "My recipe",
        servings: buildServings,
        items: buildItems.map((i) => ({ food_id: i.food.id, grams: i.grams })),
      });
      setBuildName("");
      setBuildServings(1);
      setBuildItems([]);
      setStep("recipes");
      loadRecipes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save recipe");
      setBusy(false);
    }
  };

  const logManual = async () => {
    setBusy(true);
    setError(null);
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    try {
      await onAdd({
        meal_id: mealId,
        food_name: mName.trim(),
        calories: num(mCals),
        protein: num(mP),
        carbs: num(mC),
        fat: num(mF),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
      setBusy(false);
    }
  };

  // -------- food detail --------
  if (step === "food-detail" && food) {
    return (
      <div className="addflow">
        <button className="backbtn" onClick={() => setStep(ingredientMode ? "recipe-build" : "foods")}>
          <IconChevronLeft /> Back
        </button>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <div className="dtitle">
          <b>{food.name}</b>
          <small>{Math.round(food.calories ?? 0)} kcal / 100 g</small>
        </div>
        <div className="dmac">
          <div className="d"><b>{scale(food.calories, grams)}</b><small>kcal</small></div>
          <div className="d"><b>{scale(food.protein_g, grams)}g</b><small>Protein</small></div>
          <div className="d"><b>{scale(food.carbs_g, grams)}g</b><small>Carbs</small></div>
          <div className="d"><b>{scale(food.fat_g, grams)}g</b><small>Fat</small></div>
        </div>
        <div className="seg">
          <button className={unit === "serving" ? "on" : ""} onClick={() => setUnit("serving")}>
            Serving (100 g)
          </button>
          <button className={unit === "g" ? "on" : ""} onClick={() => setUnit("g")}>
            Grams
          </button>
        </div>
        <div className="field">
          <label>{unit === "serving" ? "Servings" : "Amount (g)"}</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={unit === "serving" ? grams / 100 : grams}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setGrams(unit === "serving" ? v * 100 : v);
            }}
            autoFocus
          />
        </div>
        {!ingredientMode && <MealPicker meals={meals} mealId={mealId} onPick={setMealId} />}
        {ingredientMode ? (
          <button className="btn" onClick={addIngredient}>Add ingredient</button>
        ) : (
          <button className="btn" onClick={logFood} disabled={busy}>
            {busy ? "Adding…" : `Add to ${mealName}`}
          </button>
        )}
      </div>
    );
  }

  // -------- recipe detail --------
  if (step === "recipe-detail" && recipe) {
    const per = (v: number | null) => Math.round(((v ?? 0) / recipe.servings) * servings);
    return (
      <div className="addflow">
        <button className="backbtn" onClick={() => setStep("recipes")}>
          <IconChevronLeft /> Back
        </button>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <div className="dtitle">
          <b>{recipe.name}</b>
          <small>
            Makes {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} ·{" "}
            {Math.round((recipe.macros.calories ?? 0) / recipe.servings)} kcal each
          </small>
        </div>
        <div className="dmac">
          <div className="d"><b>{per(recipe.macros.calories)}</b><small>kcal</small></div>
          <div className="d"><b>{per(recipe.macros.protein_g)}g</b><small>Protein</small></div>
          <div className="d"><b>{per(recipe.macros.carbs_g)}g</b><small>Carbs</small></div>
          <div className="d"><b>{per(recipe.macros.fat_g)}g</b><small>Fat</small></div>
        </div>
        <div className="field">
          <label>Servings</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value) || 0)}
          />
        </div>
        <MealPicker meals={meals} mealId={mealId} onPick={setMealId} />
        <button className="btn" onClick={logRecipe} disabled={busy}>
          {busy ? "Adding…" : `Add to ${mealName}`}
        </button>
      </div>
    );
  }

  // -------- recipe builder --------
  if (step === "recipe-build") {
    const tot = buildItems.reduce(
      (a, i) => ({
        cal: a.cal + scale(i.food.calories, i.grams),
        p: a.p + scale(i.food.protein_g, i.grams),
        c: a.c + scale(i.food.carbs_g, i.grams),
        f: a.f + scale(i.food.fat_g, i.grams),
      }),
      { cal: 0, p: 0, c: 0, f: 0 },
    );
    const perSrv = (v: number) => (buildServings > 0 ? Math.round(v / buildServings) : 0);
    return (
      <div className="addflow">
        <button className="backbtn" onClick={() => setStep("recipes")}>
          <IconChevronLeft /> New recipe
        </button>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <input
          className="input"
          placeholder="Recipe name"
          value={buildName}
          onChange={(e) => setBuildName(e.target.value)}
        />
        <div className="dcard">
          <div className="drow">
            <div className="dl">Total</div>
            <div className="dv">
              {tot.cal} kcal
              <small>P {tot.p} · C {tot.c} · F {tot.f}</small>
            </div>
          </div>
          <div className="drow">
            <div className="dl">Per serving</div>
            <div className="dv">
              {perSrv(tot.cal)} kcal
              <small>P {perSrv(tot.p)} · C {perSrv(tot.c)} · F {perSrv(tot.f)}</small>
            </div>
          </div>
        </div>
        <div className="field">
          <label>Servings it makes</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={buildServings}
            onChange={(e) => setBuildServings(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div className="sechead"><b>Ingredients</b></div>
        {buildItems.length ? (
          <div className="dcard">
            {buildItems.map((i, idx) => (
              <div className="ingrow" key={idx}>
                <div className="t">
                  <b>{i.food.name}</b>
                  <small>{i.grams} g · {scale(i.food.calories, i.grams)} kcal</small>
                </div>
                <button className="del" onClick={() => setBuildItems((p) => p.filter((_, j) => j !== idx))}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="emptystate">No ingredients yet.</div>
        )}
        <button className="btn-ghost" onClick={() => { setIngredientMode(true); setQ(""); setStep("foods"); }}>
          ＋ Add ingredient
        </button>
        <button className="btn" onClick={saveRecipe} disabled={busy}>
          {busy ? "Saving…" : "Save recipe"}
        </button>
      </div>
    );
  }

  // -------- manual entry --------
  if (step === "manual") {
    return (
      <div className="addflow">
        <button className="backbtn" onClick={() => setStep("foods")}>
          <IconChevronLeft /> Back
        </button>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Quick add to {mealName}</h3>
        <div className="field"><label>Food name</label><input className="input" value={mName} onChange={(e) => setMName(e.target.value)} autoFocus /></div>
        <div className="field"><label>Calories</label><input className="input" type="number" value={mCals} onChange={(e) => setMCals(e.target.value)} /></div>
        <div className="grid3">
          <div className="field"><label>Protein</label><input className="input" type="number" value={mP} onChange={(e) => setMP(e.target.value)} /></div>
          <div className="field"><label>Carbs</label><input className="input" type="number" value={mC} onChange={(e) => setMC(e.target.value)} /></div>
          <div className="field"><label>Fat</label><input className="input" type="number" value={mF} onChange={(e) => setMF(e.target.value)} /></div>
        </div>
        <MealPicker meals={meals} mealId={mealId} onPick={setMealId} />
        <button className="btn" onClick={logManual} disabled={busy || !mName.trim()}>
          {busy ? "Adding…" : "Add food"}
        </button>
      </div>
    );
  }

  // -------- recipes list --------
  if (step === "recipes") {
    return (
      <div className="addflow">
        <button className="backbtn" onClick={onClose}>
          <IconChevronLeft /> Log food
        </button>
        <div className="tabs">
          <button onClick={() => setStep("foods")}>Foods</button>
          <button className="on" onClick={() => setStep("recipes")}>Recipes</button>
        </div>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <button className="btn-ghost" onClick={() => { setBuildName(""); setBuildServings(1); setBuildItems([]); setStep("recipe-build"); }}>
          ＋ Create recipe
        </button>
        {recipesLoading ? (
          <div className="loading">Loading…</div>
        ) : recipes.length ? (
          recipes.map((r) => (
            <button className="row tap" key={r.id} onClick={() => openRecipe(r.id)}>
              <div className="t"><b>{r.name}</b><small>{r.servings} servings</small></div>
              <span className="chev">›</span>
            </button>
          ))
        ) : (
          <div className="emptystate">No recipes yet. Create one above.</div>
        )}
      </div>
    );
  }

  // -------- foods search (default) --------
  return (
    <div className="addflow">
      <button className="backbtn" onClick={ingredientMode ? () => { setIngredientMode(false); setStep("recipe-build"); } : onClose}>
        <IconChevronLeft /> {ingredientMode ? "Add ingredient" : "Log food"}
      </button>
      {!ingredientMode && (
        <div className="tabs">
          <button className="on" onClick={() => setStep("foods")}>Foods</button>
          <button onClick={() => { setStep("recipes"); loadRecipes(); }}>Recipes</button>
        </div>
      )}
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <input className="input" placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {searching && <div className="loading">Searching…</div>}
      {results.map((f) => (
        <button className="row tap" key={f.id} onClick={() => openFood(f)}>
          <div className="t"><b>{f.name}</b><small>{round1(f.calories ?? 0)} kcal / 100 g</small></div>
          <span className="kc">{Math.round(f.calories ?? 0)}<small>/100g</small></span>
        </button>
      ))}
      {!searching && q.trim().length >= 2 && results.length === 0 && (
        <div className="emptystate">No foods match “{q}”.</div>
      )}
      {!ingredientMode && (
        <button className="btn-ghost" onClick={() => setStep("manual")}>＋ Quick add manually</button>
      )}
    </div>
  );
}
