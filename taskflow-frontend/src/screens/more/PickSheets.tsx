import { BellOff, Check } from "lucide-react";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { LANGS } from "../../lib/i18n";
import { THEMES, type ThemeKey } from "../../lib/theme";
import { EmptyState, Sheet } from "../../components/ui";

// Small pickers opened from the More tab.

export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const { lang, setLang, t } = useLang();
  return (
    <Sheet onClose={onClose} title={t("more.language")}>
      <div className="option-list">
        {LANGS.map((l) => (
          <button
            key={l.key}
            className={`option${lang === l.key ? " on" : ""}`}
            onClick={() => {
              setLang(l.key);
              onClose();
            }}
            aria-pressed={lang === l.key}
          >
            <span className="flag">{l.flag}</span>
            <span className="grow">{l.label}</span>
            {lang === l.key && <Check />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function ThemeSheet({
  theme,
  onPick,
  onClose,
}: {
  theme: ThemeKey;
  onPick: (t: ThemeKey) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  return (
    <Sheet onClose={onClose} title={t("more.theme")}>
      <div className="option-list">
        {THEMES.map((th) => (
          <button
            key={th.key}
            className={`option${theme === th.key ? " on" : ""}`}
            onClick={() => {
              onPick(th.key);
              onClose();
            }}
            aria-pressed={theme === th.key}
          >
            <span style={{ display: "flex", gap: 3 }}>
              {th.dots.map((c, i) => (
                <i key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1px solid var(--line)" }} />
              ))}
            </span>
            <span className="grow">{th.key === "light" ? t("more.themeLight") : t("more.themeDark")}</span>
            {theme === th.key && <Check />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function UnitsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { prefs, setPrefs } = usePrefs();
  return (
    <Sheet onClose={onClose} title={t("units.title")} subtitle={t("units.hint")}>
      <p className="label-out" style={{ marginTop: 4 }}>
        {t("units.weight")}
      </p>
      <div className="seg-choice">
        {(["kg", "lb"] as const).map((u) => (
          <button key={u} className={prefs.weightUnit === u ? "on" : ""} onClick={() => setPrefs({ weightUnit: u })}>
            {u === "kg" ? t("units.kg") : t("units.lb")}
          </button>
        ))}
      </div>
      <p className="label-out">{t("units.length")}</p>
      <div className="seg-choice">
        {(["cm", "in"] as const).map((u) => (
          <button key={u} className={prefs.lengthUnit === u ? "on" : ""} onClick={() => setPrefs({ lengthUnit: u })}>
            {u === "cm" ? t("units.cm") : t("units.in")}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onClose}>
        {t("common.done")}
      </button>
    </Sheet>
  );
}

export function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  return (
    <Sheet onClose={onClose} title={t("more.notifications")}>
      <EmptyState icon={BellOff} title={t("more.noNotifications")} text={t("more.noNotificationsHint")} />
    </Sheet>
  );
}
