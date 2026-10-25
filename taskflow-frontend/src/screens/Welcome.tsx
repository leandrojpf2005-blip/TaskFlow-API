import { useState, type FormEvent } from "react";
import { ArrowLeft, Lock, Mail, TrendingUp, User as UserIcon } from "lucide-react";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";
import type { User } from "../api/auth";
import { useLang } from "../lib/langHooks";
import { LANGS } from "../lib/i18n";
import { ErrorBanner, ITile, errText } from "../components/ui";

type Mode = "welcome" | "login" | "register";

/** First screen when signed out: brand, then log in or create an account. */
export function Welcome({ onAuthed }: { onAuthed: (u: User) => void }) {
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState<Mode>("welcome");

  return (
    <div className="app">
      <div className="auth">
        {mode !== "welcome" && (
          <button className="round-btn" onClick={() => setMode("welcome")} aria-label={t("common.back")} style={{ marginBottom: 18 }}>
            <ArrowLeft />
          </button>
        )}
        <div className="auth-brand">
          <ITile icon={TrendingUp} tone="solid" size="lg" round />
          <h1>{mode === "welcome" ? "Uplift" : mode === "login" ? t("auth.welcomeBack") : t("auth.createTitle")}</h1>
          <p>{mode === "welcome" ? t("auth.tagline") : mode === "login" ? t("auth.loginHint") : t("auth.registerHint")}</p>
        </div>

        {mode === "welcome" ? (
          <>
            <button className="btn btn-primary" onClick={() => setMode("register")}>
              {t("auth.getStarted")}
            </button>
            <button className="btn btn-outline" onClick={() => setMode("login")}>
              {t("auth.haveAccountBtn")}
            </button>
          </>
        ) : (
          <AuthForm mode={mode} setMode={setMode} onAuthed={onAuthed} />
        )}

        <div className="lang-row" role="radiogroup" aria-label={t("more.language")}>
          {LANGS.map((l) => (
            <button key={l.key} className={lang === l.key ? "on" : ""} onClick={() => setLang(l.key)} role="radio" aria-checked={lang === l.key}>
              {l.flag} {l.key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  mode,
  setMode,
  onAuthed,
}: {
  mode: "login" | "register";
  setMode: (m: Mode) => void;
  onAuthed: (u: User) => void;
}) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await authApi.register(username.trim(), email.trim(), password);
      await authApi.login(email.trim(), password, remember);
      onAuthed(await authApi.getMe());
    } catch (err) {
      const badLogin = !isRegister && err instanceof ApiError && (err.status === 401 || err.status === 400);
      setError(badLogin ? t("auth.failedLogin") : errText(err, t));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      {isRegister && (
        <label className="field">
          <span>{t("auth.username")}</span>
          <div className="input-wrap">
            <UserIcon />
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
        </label>
      )}
      <label className="field">
        <span>{t("auth.email")}</span>
        <div className="input-wrap">
          <Mail />
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
      </label>
      <label className="field">
        <span>{t("auth.password")}</span>
        <div className="input-wrap">
          <Lock />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        </div>
      </label>
      <label className="check-row">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        {t("auth.remember")}
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 10 }}>
        {busy ? t("auth.working") : isRegister ? t("auth.register") : t("auth.login")}
      </button>
      <p className="auth-switch">
        {isRegister ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
        <button type="button" onClick={() => setMode(isRegister ? "login" : "register")}>
          {isRegister ? t("auth.login") : t("auth.register")}
        </button>
      </p>
    </form>
  );
}
