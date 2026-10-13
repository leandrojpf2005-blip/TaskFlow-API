import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ChevronDown, ChevronRight, Plus, ScanBarcode, Utensils, X, Zap } from "lucide-react";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt } from "../../lib/useFmt";
import { loadRecents, type RecentFood } from "../../lib/recents";
import { logFood, mealForNow } from "../../lib/logFood";
import { mealLabel } from "../../lib/mealNames";
import { parseDay, todayIso } from "../../lib/dates";
import { ErrorBanner, ITile, errText } from "../../components/ui";
import { FoodSearch } from "./FoodSearch";
import { QuickAdd } from "./QuickAdd";
import { Barcode } from "./Barcode";
import { Recipes } from "./Recipes";

/** "Adicionar" — the centre Log button: pick a meal, then how to log. */
export function LogHub() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { meals, date, setDate, version, bump, toast } = useApp();
  const [mealId, setMealId] = useState<number | undefined>(() => mealForNow(meals)?.id);
  const [recents, setRecents] = useState<RecentFood[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Meals load asynchronously on first launch; pick one once they arrive.
  const activeMeal = meals.find((m) => m.id === mealId) ?? mealForNow(meals);

  useEffect(() => {
    let live = true;
    loadRecents(version.diary).then((r) => {
      if (!live) return;
      setRecents([...r].sort((a, b) => b.lastDate.localeCompare(a.lastDate)));
    });
    return () => {
      live = false;
    };
  }, [version.diary]);

  const today = todayIso();
  const dayLabel = date === today ? t("common.today") : f.dayMonth(parseDay(date));

  const quickLog = async (r: RecentFood) => {
    if (!activeMeal) return;
    setBusyKey(r.key);
    setError(null);
    try {
      await logFood(r, 1, activeMeal.id, date);
      bump("diary");
      toast(t("add.added", { meal: mealLabel(activeMeal.name, lang) }));
    } catch (e) {
      setError(errText(e, t));
    } finally {
      setBusyKey(null);
    }
  };

  const mid = activeMeal?.id;

  return (
    <div className="page">
      <div className="log-top">
        <button className="round-btn" onClick={nav.pop} aria-label={t("common.close")}>
          <X />
        </button>
        <label className="ctx-chip">
          <CalendarDays />
          {dayLabel}
          {activeMeal ? ` · ${mealLabel(activeMeal.name, lang)}` : ""}
          <ChevronDown />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label={t("weight.date")}
          />
        </label>
        <span style={{ width: 40 }} />
      </div>

      <div className="log-hero">
        <ITile icon={Plus} tone="solid" size="lg" round />
        <h1>{t("add.title")}</h1>
        <p>{t("add.subtitle")}</p>
      </div>

      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card">
        <span className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
          {t("add.addTo")}
        </span>
        <div className="meal-chips">
          {meals.map((m) => (
            <button
              key={m.id}
              className={m.id === activeMeal?.id ? "on" : ""}
              onClick={() => setMealId(m.id)}
              aria-pressed={m.id === activeMeal?.id}
            >
              {mealLabel(m.name, lang)}
            </button>
          ))}
        </div>
      </section>

      <button className="action-card primary" onClick={() => nav.push(<FoodSearch mealId={mid} />, "tabs")}>
        <span className="itile glass lg">
          <Utensils />
        </span>
        <span className="grow">
          <b>{t("add.food")}</b>
          <small>{t("add.foodHint")}</small>
        </span>
        <span className="go">
          <ChevronRight />
        </span>
      </button>
      <ActionCard icon={ScanBarcode} tone="coral" title={t("add.barcode")} hint={t("add.barcodeHint")} onClick={() => nav.push(<Barcode mealId={mid} />)} />
      <ActionCard icon={Zap} tone="beige" title={t("add.quick")} hint={t("add.quickHint")} onClick={() => nav.push(<QuickAdd mealId={mid} />)} />
      <ActionCard icon={BookOpen} tone="green" title={t("add.recipe")} hint={t("add.recipeHint")} onClick={() => nav.push(<Recipes mealId={mid} />, "tabs")} />

      <section className="card" style={{ marginTop: 12 }}>
        <div className="card-row" style={{ marginBottom: 12 }}>
          <span className="card-title" style={{ fontSize: 15 }}>
            {t("add.recents")}
          </span>
          <button className="link" onClick={() => nav.push(<FoodSearch mealId={mid} />, "tabs")}>
            {t("common.seeAll")}
          </button>
        </div>
        {recents === null ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            {t("common.loading")}
          </p>
        ) : recents.length === 0 ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            {t("add.noRecents")}
          </p>
        ) : (
          recents.slice(0, 3).map((r) => (
            <div className="recent-row" key={r.key}>
              <div className="recent-chip">
                <span className="lbadge" style={{ width: 32, height: 32, borderRadius: 10, fontSize: 13 }}>
                  {r.name.charAt(0)}
                </span>
                <span style={{ minWidth: 0 }}>
                  <b>{r.name}</b>
                  <small className="tnum">{f.kcal(r.calories)} kcal</small>
                </span>
              </div>
              <button
                className="add-circle lg"
                onClick={() => quickLog(r)}
                disabled={busyKey === r.key || !activeMeal}
                aria-label={`${t("common.add")} ${r.name}`}
              >
                <Plus />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function ActionCard({
  icon,
  tone,
  title,
  hint,
  onClick,
}: {
  icon: typeof Zap;
  tone: "green" | "coral" | "beige";
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button className="action-card" onClick={onClick}>
      <ITile icon={icon} tone={tone} size="lg" />
      <span className="grow">
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      <span className="go">
        <ChevronRight />
      </span>
    </button>
  );
}
