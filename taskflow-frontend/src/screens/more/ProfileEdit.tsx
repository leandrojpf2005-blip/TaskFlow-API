import { useState } from "react";
import { saveProfile } from "../../api/profile";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { parseNum } from "../../lib/locale";
import { cmTo, kgTo, toCm, toKg } from "../../lib/units";
import { ErrorBanner, ScreenHeader, errText } from "../../components/ui";
import { BodyForm, type BodyValues } from "./BodyForm";

const r1 = (n: number) => String(Math.round(n * 10) / 10);

/** "Perfil" — account details and the body data the calorie plan is built from. */
export function ProfileEdit() {
  const { t } = useLang();
  const nav = useNav();
  const { user, profile, setProfile, toast } = useApp();
  const { prefs } = usePrefs();
  const [v, setV] = useState<BodyValues>({
    weight: r1(kgTo(Number(profile.weight_kg), prefs.weightUnit)),
    height: r1(cmTo(Number(profile.height_cm), prefs.lengthUnit)),
    age: String(profile.age),
    sex: profile.sex,
    activity: profile.activity,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const w = parseNum(v.weight);
    const h = parseNum(v.height);
    const a = parseNum(v.age);
    if (!(w > 0 && h > 0 && a >= 10 && a < 120)) return setError(t("profile.invalid"));
    setBusy(true);
    setError(null);
    try {
      const p = await saveProfile({
        weight_kg: Math.round(toKg(w, prefs.weightUnit) * 10) / 10,
        height_cm: Math.round(toCm(h, prefs.lengthUnit) * 10) / 10,
        age: Math.round(a),
        sex: v.sex,
        activity: v.activity,
        weekly_change_kg: Number(profile.weekly_change_kg),
        ...("goal_weight_kg" in profile ? { goal_weight_kg: profile.goal_weight_kg ?? null } : {}),
      });
      setProfile(p);
      toast(t("profile.saved"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader title={t("profile.title")} subtitle={t("profile.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <p className="group-label" style={{ marginTop: 0 }}>
        {t("profile.account")}
      </p>
      <section className="card target-table">
        <div className="target-row">
          <div className="grow">
            <small>{t("profile.username")}</small>
            <b>{user.username}</b>
          </div>
        </div>
        <div className="target-row">
          <div className="grow">
            <small>{t("profile.email")}</small>
            <b>{user.email}</b>
          </div>
        </div>
      </section>

      <p className="group-label">{t("profile.body")}</p>
      <section className="card">
        <BodyForm v={v} onChange={(p) => setV((prev) => ({ ...prev, ...p }))} />
      </section>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("profile.save")}
        </button>
      </div>
    </div>
  );
}
