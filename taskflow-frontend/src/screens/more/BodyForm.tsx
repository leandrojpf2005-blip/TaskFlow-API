import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import type { Activity, Sex } from "../../types/profile";

// Body data fields shared by onboarding and the Profile screen. Values are
// kept as typed strings in the user's units; callers convert on save.

export interface BodyValues {
  weight: string;
  height: string;
  age: string;
  sex: Sex;
  activity: Activity;
}

const ACTIVITIES: Activity[] = ["sedentary", "light", "moderate", "active", "very_active"];

export function BodyForm({ v, onChange }: { v: BodyValues; onChange: (patch: Partial<BodyValues>) => void }) {
  const { t } = useLang();
  const { prefs } = usePrefs();
  return (
    <>
      <div className="input-grid">
        <label className="field" style={{ marginTop: 0 }}>
          <span>{t("profile.weight")}</span>
          <div className="input-wrap">
            <input className="input" inputMode="decimal" value={v.weight} onChange={(e) => onChange({ weight: e.target.value })} />
            <span className="unit">{prefs.weightUnit}</span>
          </div>
        </label>
        <label className="field" style={{ marginTop: 0 }}>
          <span>{t("profile.height")}</span>
          <div className="input-wrap">
            <input className="input" inputMode="decimal" value={v.height} onChange={(e) => onChange({ height: e.target.value })} />
            <span className="unit">{prefs.lengthUnit}</span>
          </div>
        </label>
      </div>
      <div className="input-grid" style={{ marginTop: 12 }}>
        <label className="field" style={{ marginTop: 0 }}>
          <span>{t("profile.age")}</span>
          <div className="input-wrap">
            <input className="input" inputMode="numeric" value={v.age} onChange={(e) => onChange({ age: e.target.value })} />
            <span className="unit">{t("profile.years")}</span>
          </div>
        </label>
        <div className="field" style={{ marginTop: 0 }}>
          <span>{t("profile.sex")}</span>
          <div className="seg-choice" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {(["male", "female"] as Sex[]).map((s) => (
              <button key={s} type="button" className={v.sex === s ? "on" : ""} onClick={() => onChange({ sex: s })} style={{ minHeight: 50 }}>
                {s === "male" ? t("profile.male") : t("profile.female")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <span>{t("profile.activity")}</span>
        <div className="option-list">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              type="button"
              className={`option${v.activity === a ? " on" : ""}`}
              onClick={() => onChange({ activity: a })}
              aria-pressed={v.activity === a}
              style={{ minHeight: 50 }}
            >
              <span className="grow">
                {t(`profile.act.${a}`)}
                <small className="muted" style={{ display: "block", fontSize: 12.5, fontWeight: 500 }}>
                  {t(`profile.actHint.${a}`)}
                </small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
