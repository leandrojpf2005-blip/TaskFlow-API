import { useEffect, useState } from "react";
import { Bell, ChevronRight, Flame, Languages, LogOut, Moon, Ruler, Salad, Sun, Target, User, Utensils } from "lucide-react";
import { getStreak, type Streak } from "../../api/stats";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { LANGS } from "../../lib/i18n";
import { applyTheme, getSavedTheme, type ThemeKey } from "../../lib/theme";
import { Chip, ITile, TabHeader, useConfirm } from "../../components/ui";
import { ProfileEdit } from "./ProfileEdit";
import { MealsScreen } from "./Meals";
import { Goals } from "./Goals";
import { Nutrition } from "./Nutrition";
import { LanguageSheet, NotificationsSheet, ThemeSheet, UnitsSheet } from "./PickSheets";
import type { LucideIcon } from "lucide-react";

type SheetKind = "units" | "theme" | "lang" | "bell" | null;

/** "Mais" — account, meals, goals, nutrition and preferences. */
export function MoreTab() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { user, profile, meals, version, logout } = useApp();
  const { prefs } = usePrefs();
  const [theme, setTheme] = useState<ThemeKey>(getSavedTheme);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [confirmNode, ask] = useConfirm();

  useEffect(() => {
    getStreak().then(setStreak);
  }, [version.diary, version.workouts]);

  const pace = profile.weekly_change_kg ?? 0;
  const goalChip =
    profile.goal_weight_kg != null
      ? `${f.weight(profile.goal_weight_kg)} ${f.wUnit}`
      : `${f.weightSigned(pace, 2)} ${f.wUnit}/${t("goals.weekShort")}`;

  const doLogout = async () => {
    const ok = await ask({ title: t("more.logoutConfirm"), confirm: t("more.logout"), cancel: t("common.cancel") });
    if (ok) logout();
  };

  return (
    <div className="page">
      <TabHeader
        title={t("more.title")}
        subtitle={t("more.subtitle")}
        right={
          <button className="round-btn" onClick={() => setSheet("bell")} aria-label={t("more.notifications")}>
            <Bell />
          </button>
        }
      />

      <section className="card profile-card">
        <span className="avatar xl">{user.username.charAt(0)}</span>
        <div className="grow">
          <b>{user.username}</b>
          <small>{user.email}</small>
          <button className="pill-btn" onClick={() => nav.push(<ProfileEdit />)}>
            {t("more.editProfile")}
          </button>
        </div>
        {streak && streak.current > 0 && (
          <div className="streak-col">
            <Chip tone="coral" icon={Flame}>
              {streak.current}
            </Chip>
            <small>{t("more.streak")}</small>
          </div>
        )}
      </section>

      <p className="group-label">{t("more.section.account")}</p>
      <section className="card flush">
        <Row icon={User} title={t("more.profile")} hint={t("more.profileHint")} onClick={() => nav.push(<ProfileEdit />)} />
      </section>

      <p className="group-label">{t("more.section.meals")}</p>
      <section className="card flush">
        <Row
          icon={Utensils}
          title={t("more.meals")}
          hint={t("more.mealsHint")}
          value={String(meals.length)}
          onClick={() => nav.push(<MealsScreen />)}
        />
      </section>

      <p className="group-label">{t("more.section.goals")}</p>
      <section className="card flush">
        <Row icon={Target} tone="coral" title={t("more.goals")} hint={t("more.goalsHint")} value={goalChip} onClick={() => nav.push(<Goals />)} />
      </section>

      <p className="group-label">{t("more.section.nutrition")}</p>
      <section className="card flush">
        <Row
          icon={Salad}
          title={t("more.nutrition")}
          hint={t("more.nutritionHint")}
          value={profile.target_calories ? `${f.kcal(profile.target_calories)} kcal` : undefined}
          onClick={() => nav.push(<Nutrition />)}
        />
      </section>

      <p className="group-label">{t("more.section.prefs")}</p>
      <section className="card flush">
        <Row
          icon={Ruler}
          tone="beige"
          title={t("more.units")}
          hint={t("more.unitsHint")}
          value={`${prefs.weightUnit} · ${prefs.lengthUnit}`}
          onClick={() => setSheet("units")}
        />
        <Row
          icon={theme === "dark" ? Moon : Sun}
          tone="beige"
          title={t("more.theme")}
          hint={theme === "dark" ? t("more.themeDark") : t("more.themeLight")}
          value={theme === "dark" ? t("more.themeDark") : t("more.themeLight")}
          onClick={() => setSheet("theme")}
        />
        <Row
          icon={Languages}
          tone="beige"
          title={t("more.language")}
          hint={LANGS.find((l) => l.key === lang)?.label ?? ""}
          value={LANGS.find((l) => l.key === lang)?.flag}
          onClick={() => setSheet("lang")}
        />
      </section>

      <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={doLogout}>
        <LogOut />
        {t("more.logout")}
      </button>

      {sheet === "units" && <UnitsSheet onClose={() => setSheet(null)} />}
      {sheet === "lang" && <LanguageSheet onClose={() => setSheet(null)} />}
      {sheet === "bell" && <NotificationsSheet onClose={() => setSheet(null)} />}
      {sheet === "theme" && (
        <ThemeSheet
          theme={theme}
          onPick={(k) => {
            applyTheme(k);
            setTheme(k);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {confirmNode}
    </div>
  );
}

function Row({
  icon,
  tone,
  title,
  hint,
  value,
  onClick,
}: {
  icon: LucideIcon;
  tone?: "green" | "coral" | "beige";
  title: string;
  hint: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button className="mrow" onClick={onClick}>
      <ITile icon={icon} tone={tone ?? "green"} />
      <span className="grow">
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      {value && (
        <Chip tone="neutral">
          <span className="tnum">{value}</span>
        </Chip>
      )}
      <ChevronRight />
    </button>
  );
}
