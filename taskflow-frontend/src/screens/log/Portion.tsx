import { useState } from "react";
import { ChevronDown, Flame, Heart, Sparkles, Utensils } from "lucide-react";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { logFood, macrosFor, mealForNow } from "../../lib/logFood";
import { mealLabel } from "../../lib/mealNames";
import { ErrorBanner, ITile, LetterBadge, PBar, ScreenHeader, Stepper, errText } from "../../components/ui";
import type { Loggable } from "../../types/loggable";

type Unit = "g" | "portion100";

/** "Ajustar porção" — choose how much, see the macros live, add to a meal. */
export function Portion({ item, mealId: initialMealId }: { item: Loggable; mealId?: number }) {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { meals, profile, date, bump, toast } = useApp();
  const { isFavorite, toggleFavorite } = usePrefs();
  const perGram = item.basis === "per100g";
  const [unit, setUnit] = useState<Unit>("g");
  const [raw, setRaw] = useState(perGram ? "100" : "1");
  const [mealId, setMealId] = useState(initialMealId ?? mealForNow(meals)?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typed = parseNum(raw);
  const valid = Number.isFinite(typed) && typed > 0;
  // `amount` is what logFood expects: grams for catalogue foods, servings otherwise.
  const amount = !valid ? 0 : perGram && unit === "portion100" ? typed * 100 : typed;
  const m = macrosFor(item, amount);

  const step = perGram ? (unit === "g" ? 10 : 0.5) : 0.5;
  const fmtRaw = (n: number) => f.editable(n, 2);
  const stepBy = (dir: 1 | -1) => {
    const base = valid ? typed : 0;
    setRaw(fmtRaw(Math.max(step, Math.round((base + dir * step) / step) * step)));
  };

  const chips: { label: string; value: number }[] = perGram
    ? unit === "g"
      ? [50, 100, 150, 200].map((g) => ({ label: `${g} g`, value: g }))
      : [0.5, 1, 1.5, 2].map((p) => ({ label: `${f.num(p, 1)}×`, value: p }))
    : [
        { label: "½", value: 0.5 },
        { label: "1", value: 1 },
        { label: "1½", value: 1.5 },
        { label: "2", value: 2 },
      ];

  const range = perGram && unit === "g" ? { min: 10, max: 500, step: 5 } : { min: 0.25, max: 4, step: 0.25 };
  const sliderVal = Math.min(range.max, Math.max(range.min, valid ? typed : range.min));
  const fill = ((sliderVal - range.min) / (range.max - range.min)) * 100;

  const unitLabel = perGram ? (unit === "g" ? "g" : "× 100 g") : t("food.servings");
  const perLabel = perGram ? t("portion.per", { n: f.num(amount) }) : t("portion.perServings", { n: f.num(typed || 0, 2) });
  const baseChip = perGram
    ? t("portion.kcalPer100", { n: f.kcal(item.calories) })
    : t("portion.kcalPerServing", { n: f.kcal(item.calories) });

  const fav = isFavorite(item.key);
  const meal = meals.find((x) => x.id === mealId);

  const add = async () => {
    if (!valid) return setError(t("portion.needAmount"));
    if (!meal) return setError(t("portion.needMeal"));
    setBusy(true);
    setError(null);
    try {
      await logFood(item, amount, meal.id, date);
      bump("diary");
      toast(t("add.added", { meal: mealLabel(meal.name, lang) }));
      nav.goTab("home");
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader
        title={t("food.title")}
        subtitle={t("portion.subtitle")}
        onBack={nav.pop}
        backLabel={t("common.back")}
        right={
          <button
            className="round-btn"
            onClick={() => toast(toggleFavorite(item) ? t("portion.favAdded") : t("portion.favRemoved"))}
            aria-label={t("food.favorites")}
            aria-pressed={fav}
            style={fav ? { color: "var(--coral)" } : undefined}
          >
            <Heart fill={fav ? "currentColor" : "none"} />
          </button>
        }
      />

      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card food-head">
        <LetterBadge text={item.name} tone="green" size="lg" />
        <div style={{ minWidth: 0 }}>
          <b>{item.name}</b>
          <small>{item.detail ?? (perGram ? t("portion.catalogue") : t("food.lastPortion"))}</small>
          <span className="chip neutral tnum">{baseChip}</span>
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-title">{t("portion.quantity")}</span>
          {perGram ? (
            <select
              className="select-chip"
              value={unit}
              onChange={(e) => {
                const next = e.target.value as Unit;
                // Keep the same physical amount when switching units.
                if (valid) setRaw(fmtRaw(next === "g" ? typed * 100 : typed / 100));
                setUnit(next);
              }}
              aria-label={t("portion.unit")}
            >
              <option value="g">{t("portion.grams")}</option>
              <option value="portion100">{t("portion.portions100")}</option>
            </select>
          ) : (
            <span className="chip neutral">{t("food.servings")}</span>
          )}
        </div>

        <Stepper value={raw} onChange={setRaw} onStep={stepBy} unit={unitLabel} label={t("portion.quantity")} />

        <div className="qchips">
          {chips.map((c) => (
            <button
              key={c.label}
              className={valid && Math.abs(typed - c.value) < 1e-9 ? "on" : ""}
              onClick={() => setRaw(fmtRaw(c.value))}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="range-row">
          <input
            type="range"
            className="slider"
            min={range.min}
            max={range.max}
            step={range.step}
            value={sliderVal}
            onChange={(e) => setRaw(fmtRaw(Number(e.target.value)))}
            style={{ ["--fill" as string]: `${fill}%` }}
            aria-label={t("portion.quantity")}
          />
          <span className="tnum">
            {perGram && unit === "g"
              ? `${range.min} – ${range.max} g`
              : `${f.num(range.min, 2)} – ${f.num(range.max)}×`}
          </span>
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-title">{t("portion.summary")}</span>
          <span className="muted tnum" style={{ fontSize: 13 }}>
            {perLabel}
          </span>
        </div>
        <div className="cal-tile">
          <ITile icon={Flame} tone="solid" size="sm" />
          <span className="grow">{t("portion.calories")}</span>
          <b className="tnum">
            {f.kcal(m.calories)}
            <small>kcal</small>
          </b>
        </div>
        <div className="macro-tiles">
          <MacroTile name={t("home.protein")} value={m.protein} target={profile.target_protein_g ?? 0} color="var(--p)" track="var(--p-soft)" />
          <MacroTile name={t("home.carbs")} value={m.carbs} target={profile.target_carbs_g ?? 0} color="var(--c)" track="var(--c-soft)" />
          <MacroTile name={t("home.fat")} value={m.fat} target={profile.target_fat_g ?? 0} color="var(--f)" track="var(--f-soft)" />
        </div>
        <p className="live-hint">
          <Sparkles />
          {t("portion.liveHint")}
        </p>
      </section>

      <p className="label-out">{t("portion.addTo")}</p>
      <label className="card select-card">
        <ITile icon={Utensils} size="sm" />
        <span className="grow">
          <b>{meal ? mealLabel(meal.name, lang) : "—"}</b>
        </span>
        <ChevronDown />
        <select value={mealId ?? ""} onChange={(e) => setMealId(Number(e.target.value))} aria-label={t("portion.addTo")}>
          {meals.map((x) => (
            <option key={x.id} value={x.id}>
              {mealLabel(x.name, lang)}
            </option>
          ))}
        </select>
      </label>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={add} disabled={busy || !valid}>
          {busy ? t("common.saving") : t("portion.addToDiary")}
        </button>
      </div>
    </div>
  );
}

function MacroTile({
  name,
  value,
  target,
  color,
  track,
}: {
  name: string;
  value: number;
  target: number;
  color: string;
  track: string;
}) {
  const f = useFmt();
  return (
    <div className="macro-tile">
      <span className="name">
        <i className="mdot" style={{ background: color }} />
        {name}
      </span>
      <b className="tnum">{f.g(value)} g</b>
      <PBar value={value} max={target} thin color={color} track={track} />
    </div>
  );
}
