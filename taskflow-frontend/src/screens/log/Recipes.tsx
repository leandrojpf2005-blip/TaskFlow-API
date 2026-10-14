import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Flame,
  Minus,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import * as foodsApi from "../../api/foods";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { logFood, macrosFor, mealForNow } from "../../lib/logFood";
import { mealLabel } from "../../lib/mealNames";
import {
  EmptyState,
  ErrorBanner,
  ITile,
  Info,
  LetterBadge,
  MacroDots,
  ScreenHeader,
  Segmented,
  Sheet,
  errText,
  useConfirm,
} from "../../components/ui";
import type { Food, RecipeDetail, RecipeSummary } from "../../types/foods";
import type { Loggable, Macros } from "../../types/loggable";

type RTab = "mine" | "new" | "saved";
type Sort = "name" | "kcal";
const TONES = ["green", "coral", "beige"] as const;

function perServing(d: RecipeDetail | undefined, servings: number): Macros {
  const s = servings > 0 ? servings : 1;
  return {
    calories: Number(d?.macros?.calories ?? 0) / s,
    protein: Number(d?.macros?.protein_g ?? 0) / s,
    carbs: Number(d?.macros?.carbs_g ?? 0) / s,
    fat: Number(d?.macros?.fat_g ?? 0) / s,
  };
}

function recipeLoggable(r: RecipeSummary, d: RecipeDetail | undefined): Loggable {
  return { key: `recipe:${r.id}`, name: r.name, basis: "serving", ...perServing(d, Number(r.servings)) };
}

/** "Receitas" — your recipes with per-serving macros; build new ones; log servings. */
export function Recipes({ mealId, initialTab = "mine" }: { mealId?: number; initialTab?: RTab }) {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { version } = useApp();
  const { savedRecipes } = usePrefs();
  const [tab, setTab] = useState<RTab>(initialTab);
  const [list, setList] = useState<RecipeSummary[] | null>(null);
  const [details, setDetails] = useState<Record<number, RecipeDetail>>({});
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<Loggable | null>(null);

  useEffect(() => {
    let live = true;
    foodsApi
      .getRecipes()
      .then(async (rs) => {
        if (!live) return;
        setList(rs);
        // GET /recipes has no macros, so fetch each recipe's totals alongside.
        const ds = await Promise.all(rs.map((r) => foodsApi.getRecipe(r.id).catch(() => null)));
        if (!live) return;
        const map: Record<number, RecipeDetail> = {};
        ds.forEach((d) => d && (map[d.id] = d));
        setDetails(map);
      })
      .catch((e) => live && (setError(errText(e, t)), setList([])));
    return () => {
      live = false;
    };
    // t only shapes the error text; refetching on a language switch isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.recipes]);

  const shown = useMemo(() => {
    let rs = list ?? [];
    if (tab === "saved") rs = rs.filter((r) => savedRecipes.includes(r.id));
    const needle = q.trim().toLowerCase();
    if (needle) rs = rs.filter((r) => r.name.toLowerCase().includes(needle));
    const kcal = (r: RecipeSummary) => perServing(details[r.id], Number(r.servings)).calories;
    return [...rs].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, lang) : kcal(b) - kcal(a)));
  }, [list, tab, savedRecipes, q, sort, details, lang]);

  return (
    <div className="page">
      <ScreenHeader
        title={t("recipes.title")}
        subtitle={t("recipes.subtitle")}
        onBack={nav.pop}
        backLabel={t("common.back")}
        right={
          <button className="pill-btn solid" onClick={() => setTab("new")}>
            <Plus />
            {t("recipes.new")}
          </button>
        }
      />

      <Segmented
        small
        value={tab}
        onChange={setTab}
        options={[
          { value: "mine", label: t("recipes.tab.mine") },
          { value: "new", label: t("recipes.tab.new") },
          { value: "saved", label: t("recipes.tab.saved") },
        ]}
      />

      <ErrorBanner message={error} onClose={() => setError(null)} />

      {tab === "new" ? (
        <RecipeBuilder onCreated={() => setTab("mine")} />
      ) : (
        <>
          <div className="searchbar">
            <Search />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("recipes.search")} aria-label={t("recipes.search")} />
            {q && (
              <button className="clear" onClick={() => setQ("")} aria-label={t("common.clear")}>
                <X />
              </button>
            )}
          </div>

          <div className="list-head">
            <b>{shown.length === 1 ? t("recipes.count1") : t("recipes.count", { n: shown.length })}</b>
            <label className="sort">
              {t("recipes.sort")}
              <ChevronDown />
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t("recipes.sort")}>
                <option value="name">{t("recipes.sort.name")}</option>
                <option value="kcal">{t("recipes.sort.kcal")}</option>
              </select>
            </label>
          </div>

          {list === null ? (
            <p className="muted" style={{ textAlign: "center", padding: 20 }}>
              {t("common.loading")}
            </p>
          ) : shown.length === 0 ? (
            tab === "saved" ? (
              <EmptyState icon={Bookmark} title={t("recipes.noSaved")} text={t("recipes.noSavedHint")} />
            ) : (
              <EmptyState
                icon={BookOpen}
                title={t("recipes.empty")}
                text={t("recipes.emptyHint")}
                action={
                  <button className="btn btn-primary" onClick={() => setTab("new")}>
                    <Plus />
                    {t("recipes.tab.new")}
                  </button>
                }
              />
            )
          ) : (
            <>
              {shown.map((r, i) => {
                const per = perServing(details[r.id], Number(r.servings));
                const servings = Number(r.servings);
                return (
                  <section className="card recipe-card" key={r.id}>
                    <div className="top">
                      <LetterBadge text={r.name} tone={TONES[i % TONES.length]} />
                      <div className="grow">
                        <b>{r.name}</b>
                        <small>{servings === 1 ? t("recipes.servings1") : t("recipes.servings", { n: f.num(servings, 1) })}</small>
                      </div>
                      <button
                        className="add-circle"
                        onClick={() => setLogging(recipeLoggable(r, details[r.id]))}
                        aria-label={`${t("common.add")} ${r.name}`}
                      >
                        <Plus />
                      </button>
                    </div>
                    <button
                      className="kcal-row"
                      onClick={() => nav.push(<RecipeScreen recipe={r} mealId={mealId} />)}
                    >
                      <Flame />
                      <span className="grow">
                        <b className="tnum">{details[r.id] ? f.kcal(per.calories) : "…"} kcal</b> {t("recipes.perServing")}
                      </span>
                      <ChevronRight />
                    </button>
                    <MacroDots
                      protein={per.protein}
                      carbs={per.carbs}
                      fat={per.fat}
                      fmt={f.g}
                      muted
                      suffix={[` g ${t("recipes.prot")}`, ` g ${t("recipes.carb")}`, ` g ${t("recipes.fat")}`]}
                    />
                  </section>
                );
              })}
              <Info>{t("recipes.tapHint")}</Info>
            </>
          )}
        </>
      )}

      {logging && <RecipeLogSheet item={logging} mealId={mealId} onClose={() => setLogging(null)} />}
    </div>
  );
}

/** Choose how many servings and which meal, then log. */
export function RecipeLogSheet({ item, mealId, onClose }: { item: Loggable; mealId?: number; onClose: () => void }) {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { meals, date, bump, toast } = useApp();
  const [servings, setServings] = useState(1);
  const [mid, setMid] = useState(mealId ?? mealForNow(meals)?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const m = macrosFor(item, servings);
  const meal = meals.find((x) => x.id === mid);

  const add = async () => {
    if (!meal) return;
    setBusy(true);
    try {
      await logFood(item, servings, meal.id, date);
      bump("diary");
      toast(t("add.added", { meal: mealLabel(meal.name, lang) }));
      onClose();
      nav.goTab("home");
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} title={item.name} subtitle={t("recipes.howMany")}>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <div className="stepper" style={{ margin: "4px 0 14px" }}>
        <button className="step" onClick={() => setServings((s) => Math.max(0.5, s - 0.5))} aria-label="−">
          <Minus />
        </button>
        <div className="value">
          <b className="tnum" style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {f.num(servings, 1)}
          </b>
          <span>{servings === 1 ? t("recipes.serving") : t("food.servings")}</span>
        </div>
        <button className="step plus" onClick={() => setServings((s) => s + 0.5)} aria-label="+">
          <Plus />
        </button>
      </div>
      <div className="cal-tile" style={{ marginTop: 0 }}>
        <ITile icon={Flame} tone="solid" size="sm" />
        <span className="grow">{t("portion.calories")}</span>
        <b className="tnum">
          {f.kcal(m.calories)}
          <small>kcal</small>
        </b>
      </div>
      <MacroDots protein={m.protein} carbs={m.carbs} fat={m.fat} fmt={f.g} muted />
      <label className="card select-card" style={{ marginTop: 14 }}>
        <ITile icon={Utensils} size="sm" />
        <span className="grow">
          <small>{t("portion.addTo")}</small>
          <b>{meal ? mealLabel(meal.name, lang) : "—"}</b>
        </span>
        <ChevronDown />
        <select value={mid ?? ""} onChange={(e) => setMid(Number(e.target.value))} aria-label={t("portion.addTo")}>
          {meals.map((x) => (
            <option key={x.id} value={x.id}>
              {mealLabel(x.name, lang)}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={add} disabled={busy || !meal}>
        {busy ? t("common.saving") : t("portion.addToDiary")}
      </button>
    </Sheet>
  );
}

/** One recipe: per-serving and whole-recipe macros, save, delete, log. */
function RecipeScreen({ recipe, mealId }: { recipe: RecipeSummary; mealId?: number }) {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { bump, toast } = useApp();
  const { savedRecipes, toggleSavedRecipe } = usePrefs();
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();
  const saved = savedRecipes.includes(recipe.id);

  useEffect(() => {
    foodsApi
      .getRecipe(recipe.id)
      .then(setDetail)
      .catch((e) => setError(errText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);

  const servings = Number(recipe.servings);
  const per = perServing(detail ?? undefined, servings);
  const whole: Macros = {
    calories: Number(detail?.macros?.calories ?? 0),
    protein: Number(detail?.macros?.protein_g ?? 0),
    carbs: Number(detail?.macros?.carbs_g ?? 0),
    fat: Number(detail?.macros?.fat_g ?? 0),
  };

  const remove = async () => {
    const ok = await ask({ title: t("recipes.confirmDelete"), confirm: t("common.delete"), cancel: t("common.cancel"), danger: true });
    if (!ok) return;
    try {
      await foodsApi.deleteRecipe(recipe.id);
      bump("recipes");
      toast(t("recipes.deleted"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader
        title={recipe.name}
        subtitle={servings === 1 ? t("recipes.servings1") : t("recipes.servings", { n: f.num(servings, 1) })}
        onBack={nav.pop}
        backLabel={t("common.back")}
        right={
          <button
            className="round-btn"
            onClick={() => {
              toggleSavedRecipe(recipe.id);
              toast(saved ? t("recipes.unsaved") : t("recipes.savedToast"));
            }}
            aria-pressed={saved}
            aria-label={t("recipes.tab.saved")}
            style={saved ? { color: "var(--accent)" } : undefined}
          >
            <Bookmark fill={saved ? "currentColor" : "none"} />
          </button>
        }
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <MacroSummary title={t("recipes.perServingTitle")} m={per} loading={!detail} />
      <MacroSummary title={t("recipes.wholeRecipe")} m={whole} loading={!detail} />

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={() => setLogging(true)} disabled={!detail}>
          <Plus />
          {t("portion.addToDiary")}
        </button>
        <button className="btn btn-danger" onClick={remove}>
          <Trash2 />
          {t("recipes.delete")}
        </button>
      </div>

      {logging && detail && (
        <RecipeLogSheet item={recipeLoggable(recipe, detail)} mealId={mealId} onClose={() => setLogging(false)} />
      )}
      {confirmNode}
    </div>
  );
}

function MacroSummary({ title, m, loading }: { title: string; m: Macros; loading?: boolean }) {
  const { t } = useLang();
  const f = useFmt();
  return (
    <section className="card">
      <span className="card-title">{title}</span>
      <div className="cal-tile">
        <ITile icon={Flame} tone="solid" size="sm" />
        <span className="grow">{t("portion.calories")}</span>
        <b className="tnum">
          {loading ? "…" : f.kcal(m.calories)}
          <small>kcal</small>
        </b>
      </div>
      <div className="macro-tiles">
        {[
          { n: t("home.protein"), v: m.protein, c: "var(--p)" },
          { n: t("home.carbs"), v: m.carbs, c: "var(--c)" },
          { n: t("home.fat"), v: m.fat, c: "var(--f)" },
        ].map((x) => (
          <div className="macro-tile" key={x.n}>
            <span className="name">
              <i className="mdot" style={{ background: x.c }} />
              {x.n}
            </span>
            <b className="tnum" style={{ marginBottom: 0 }}>
              {loading ? "…" : `${f.g(x.v)} g`}
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}

interface BuildItem {
  food: Food;
  grams: string;
}

/** "Nova receita" — name, servings, ingredients by weight. */
function RecipeBuilder({ onCreated }: { onCreated: () => void }) {
  const { t } = useLang();
  const f = useFmt();
  const { bump, toast } = useApp();
  const [name, setName] = useState("");
  const [servings, setServings] = useState(1);
  const [items, setItems] = useState<BuildItem[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ q: string; foods: Food[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = q.trim();
  const results = query.length >= 2 && found?.q === query ? found.foods : [];

  useEffect(() => {
    if (query.length < 2) return;
    let live = true;
    const timer = window.setTimeout(() => {
      foodsApi
        .searchFoods(query)
        .then((r) => live && setFound({ q: query, foods: r.slice(0, 20) }))
        .catch(() => live && setFound({ q: query, foods: [] }));
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const total = items.reduce<Macros>(
    (acc, it) => {
      const g = parseNum(it.grams);
      if (!Number.isFinite(g)) return acc;
      const k = g / 100;
      return {
        calories: acc.calories + Number(it.food.calories ?? 0) * k,
        protein: acc.protein + Number(it.food.protein_g ?? 0) * k,
        carbs: acc.carbs + Number(it.food.carbs_g ?? 0) * k,
        fat: acc.fat + Number(it.food.fat_g ?? 0) * k,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const create = async () => {
    if (!name.trim()) return setError(t("recipes.needName"));
    const valid = items
      .map((it) => ({ food_id: it.food.id, grams: parseNum(it.grams) }))
      .filter((it) => Number.isFinite(it.grams) && it.grams > 0);
    if (valid.length === 0) return setError(t("recipes.needItems"));
    setBusy(true);
    setError(null);
    try {
      await foodsApi.createRecipe({ name: name.trim(), servings, items: valid });
      bump("recipes");
      toast(t("recipes.created"));
      onCreated();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <section className="card">
        <label className="field">
          <span>{t("recipes.name")}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("recipes.namePlaceholder")} />
        </label>
        <div className="field">
          <span>{t("recipes.servingsLabel")}</span>
          <div className="card-row" style={{ justifyContent: "flex-start", gap: 14 }}>
            <button className="round-btn" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="−">
              <Minus />
            </button>
            <b className="tnum" style={{ fontSize: 22, minWidth: 28, textAlign: "center" }}>
              {servings}
            </b>
            <button className="round-btn" onClick={() => setServings((s) => s + 1)} aria-label="+">
              <Plus />
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <span className="card-title">{t("recipes.ingredients")}</span>
        {items.length > 0 && (
          <div style={{ marginTop: 6 }}>
            {items.map((it, i) => (
              <div className="ingredient" key={`${it.food.id}-${i}`}>
                <div className="grow">
                  <b>{it.food.name}</b>
                  <small className="tnum">
                    {f.kcal((Number(it.food.calories ?? 0) * (parseNum(it.grams) || 0)) / 100)} kcal
                  </small>
                </div>
                <input
                  className="grams-input tnum"
                  inputMode="decimal"
                  value={it.grams}
                  onChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))}
                  aria-label={`${it.food.name} (g)`}
                />
                <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
                  g
                </span>
                <button className="icon-del" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} aria-label={t("common.delete")}>
                  <X />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="searchbar" style={{ marginTop: 12, height: 50 }}>
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("recipes.addIngredient")}
            aria-label={t("recipes.addIngredient")}
          />
        </div>
        {results.length > 0 && (
          <div className="search-results">
            {results.map((food) => (
              <button
                key={food.id}
                onClick={() => {
                  setItems((prev) => [...prev, { food, grams: "100" }]);
                  setQ("");
                }}
              >
                <span>
                  {food.name}
                  {food.brand ? <small className="muted"> · {food.brand}</small> : null}
                </span>
                <small className="tnum">{f.kcal(Number(food.calories ?? 0))} kcal/100 g</small>
              </button>
            ))}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <MacroSummary
          title={t("recipes.perServingTitle")}
          m={{
            calories: total.calories / servings,
            protein: total.protein / servings,
            carbs: total.carbs / servings,
            fat: total.fat / servings,
          }}
        />
      )}

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={create} disabled={busy}>
          {busy ? t("common.saving") : t("recipes.create")}
        </button>
      </div>
    </>
  );
}
