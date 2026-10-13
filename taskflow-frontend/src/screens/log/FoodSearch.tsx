import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Heart, History, Plus, ScanBarcode, Search, SearchX, X, Zap } from "lucide-react";
import { searchFoods } from "../../api/foods";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { loadRecents, type RecentFood } from "../../lib/recents";
import { logFood, mealForNow } from "../../lib/logFood";
import { mealLabel } from "../../lib/mealNames";
import { parseDay, todayIso } from "../../lib/dates";
import { Chip, EmptyState, ErrorBanner, Info, LetterBadge, ScreenHeader, errText } from "../../components/ui";
import { Portion } from "./Portion";
import { QuickAdd } from "./QuickAdd";
import { Barcode } from "./Barcode";
import { Recipes } from "./Recipes";
import type { Food } from "../../types/foods";
import { foodToLoggable, type Loggable } from "../../types/loggable";

type Filter = "favorites" | "history";
type Sort = "recent" | "az" | "kcal";

/** "Adicionar alimento" — search the catalogue, or pick from history/favourites. */
export function FoodSearch({ mealId }: { mealId?: number }) {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { meals, date, version, bump, toast } = useApp();
  const { favorites, isFavorite } = usePrefs();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ q: string; foods: Food[] } | null>(null);
  const [filter, setFilter] = useState<Filter>("history");
  const [sort, setSort] = useState<Sort>("recent");
  const [recents, setRecents] = useState<RecentFood[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const meal = meals.find((m) => m.id === mealId) ?? mealForNow(meals);
  const today = todayIso();
  const dayLabel = date === today ? t("common.today") : f.dayMonth(parseDay(date));

  useEffect(() => {
    let live = true;
    loadRecents(version.diary).then((r) => live && setRecents(r));
    return () => {
      live = false;
    };
  }, [version.diary]);

  // Debounced catalogue search; under two letters we show history instead.
  const query = q.trim();
  const searchingMode = query.length >= 2;
  const results = searchingMode && found?.q === query ? found.foods : null;
  const searching = searchingMode && results === null;

  useEffect(() => {
    if (query.length < 2) return;
    let live = true;
    const timer = window.setTimeout(() => {
      searchFoods(query)
        .then((r) => live && setFound({ q: query, foods: r }))
        .catch(() => live && setFound({ q: query, foods: [] }));
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const recentByKey = useMemo(() => new Map((recents ?? []).map((r) => [r.key, r])), [recents]);

  const history = useMemo(() => {
    const list = [...(recents ?? [])];
    if (sort === "recent") list.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || b.count - a.count);
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name, lang));
    if (sort === "kcal") list.sort((a, b) => b.calories - a.calories);
    return list;
  }, [recents, sort, lang]);

  // The catalogue search has no ordering, so rank here: exact name, then
  // names starting with the query, then shorter (more generic) names.
  const ranked = useMemo(() => {
    const needle = query.toLowerCase();
    const score = (n: string) => {
      const l = n.toLowerCase();
      return (l === needle ? 0 : l.startsWith(needle) ? 1 : 2) * 1000 + n.length;
    };
    return [...(results ?? [])].sort((a, b) => score(a.name) - score(b.name));
  }, [results, query]);
  const rows: Loggable[] = searchingMode ? ranked.map(foodToLoggable) : filter === "favorites" ? favorites : history;

  const open = (item: Loggable) => nav.push(<Portion item={item} mealId={meal?.id} />);

  const quickAdd = async (item: Loggable) => {
    if (!meal) return;
    setBusyKey(item.key);
    setError(null);
    try {
      await logFood(item, item.basis === "per100g" ? 100 : 1, meal.id, date);
      bump("diary");
      toast(t("add.added", { meal: mealLabel(meal.name, lang) }));
    } catch (e) {
      setError(errText(e, t));
    } finally {
      setBusyKey(null);
    }
  };

  const listTitle = searchingMode
    ? t("food.results")
    : filter === "favorites"
      ? t("food.favoriteFoods")
      : t("food.recentFoods");

  return (
    <div className="page">
      <ScreenHeader
        title={t("food.title")}
        subtitle={`${meal ? mealLabel(meal.name, lang) : ""} · ${dayLabel}`}
        onBack={nav.pop}
        backLabel={t("common.back")}
      />

      <div className="searchbar">
        <Search />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("food.searchPlaceholder")}
          aria-label={t("food.searchPlaceholder")}
          enterKeyHint="search"
        />
        {q && (
          <button className="clear" onClick={() => setQ("")} aria-label={t("common.clear")}>
            <X />
          </button>
        )}
        <button className="scan" onClick={() => nav.push(<Barcode mealId={meal?.id} />)} aria-label={t("add.barcode")}>
          <ScanBarcode />
        </button>
      </div>

      <div className="ftiles">
        <button className={`ftile${!searchingMode && filter === "favorites" ? " on" : ""}`} onClick={() => { setQ(""); setFilter("favorites"); }}>
          <Heart />
          {t("food.favorites")}
        </button>
        <button className="ftile" onClick={() => nav.push(<QuickAdd mealId={meal?.id} />)}>
          <Zap />
          {t("food.quick")}
        </button>
        <button className="ftile" onClick={() => nav.push(<Recipes mealId={meal?.id} />, "tabs")}>
          <BookOpen />
          {t("food.recipes")}
        </button>
        <button className={`ftile${!searchingMode && filter === "history" ? " on" : ""}`} onClick={() => { setQ(""); setFilter("history"); }}>
          <History />
          {t("food.history")}
        </button>
      </div>

      <div className="list-head">
        <b>{listTitle}</b>
        {!searchingMode && filter === "history" && (
          <label className="sort">
            {t(sort === "recent" ? "food.sort.recent" : sort === "az" ? "food.sort.az" : "food.sort.kcal")}
            <ChevronDown />
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t("recipes.sort")}>
              <option value="recent">{t("food.sort.recent")}</option>
              <option value="az">{t("food.sort.az")}</option>
              <option value="kcal">{t("food.sort.kcal")}</option>
            </select>
          </label>
        )}
        {searchingMode && searching && <span className="muted" style={{ fontSize: 13 }}>{t("food.searching")}</span>}
      </div>

      <ErrorBanner message={error} onClose={() => setError(null)} />

      {rows.length > 0 && (
        <section className="card flist">
          {rows.slice(0, 40).map((item) => {
            const recent = recentByKey.get(item.key);
            const fav = isFavorite(item.key);
            return (
              <div className="frow" key={item.key}>
                <button className="tap" onClick={() => open(item)}>
                  <LetterBadge text={item.name} />
                  <span className="grow">
                    <span className="nm">
                      <b>{item.name}</b>
                      {fav ? (
                        <Chip tone="coral" size="sm">{t("food.tag.favorite")}</Chip>
                      ) : recent && recent.count >= 3 ? (
                        <Chip tone="green" size="sm">{t("food.tag.frequent")}</Chip>
                      ) : null}
                    </span>
                    <span className="sub">
                      {item.detail ?? (item.basis === "per100g" ? "100 g" : t("food.lastPortion"))}
                    </span>
                  </span>
                  <span className="kcal-col">
                    <b className="tnum">{f.kcal(item.calories)}</b>
                    <small>kcal</small>
                  </span>
                </button>
                <button
                  className="add-circle"
                  onClick={() => quickAdd(item)}
                  disabled={busyKey === item.key || !meal}
                  aria-label={`${t("common.add")} ${item.name}`}
                >
                  <Plus />
                </button>
              </div>
            );
          })}
        </section>
      )}

      {rows.length > 0 && <Info>{t("food.tapHint")}</Info>}

      {rows.length === 0 &&
        (searchingMode ? (
          !searching && results !== null && (
            <EmptyState
              icon={SearchX}
              title={t("food.notFound")}
              text={t("food.notFoundHint")}
              action={
                <button className="btn btn-secondary" onClick={() => nav.push(<QuickAdd mealId={meal?.id} initialName={q.trim()} />)}>
                  <Zap />
                  {t("food.quick")}
                </button>
              }
            />
          )
        ) : filter === "favorites" ? (
          <EmptyState icon={Heart} title={t("food.noFavorites")} text={t("food.noFavoritesHint")} />
        ) : recents === null ? (
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>{t("common.loading")}</p>
        ) : (
          <EmptyState icon={Search} title={t("food.noHistory")} text={t("food.noHistoryHint")} />
        ))}
    </div>
  );
}
