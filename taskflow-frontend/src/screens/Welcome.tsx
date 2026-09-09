import { useState, type FormEvent } from "react";
import { UpliftLogo } from "../components/UpliftLogo";
import { IconChevronLeft } from "../components/icons";
import * as authApi from "../api/auth";
import type { User } from "../api/auth";

type Mode = "welcome" | "login" | "register";

export function Welcome({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<Mode>("welcome");

  if (mode === "welcome") {
    return (
      <div className="welcome">
        <UpliftLogo className="logo" />
        <h1>Uplift</h1>
        <p>Track your macros, log your lifts, watch your progress climb.</p>
        <div className="cta">
          <button className="p" onClick={() => setMode("register")}>
            Get started
          </button>
          <button className="l" onClick={() => setMode("login")}>
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  return <AuthForm mode={mode} setMode={setMode} onAuthed={onAuthed} />;
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
      if (isRegister) {
        await authApi.register(username, email, password);
      }
      await authApi.login(email, password, remember);
      const me = await authApi.getMe();
      onAuthed(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form className="authcard" onSubmit={submit}>
      <button type="button" className="backbtn" onClick={() => setMode("welcome")}>
        <IconChevronLeft /> Back
      </button>
      <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>

      {error && <div className="banner">{error}</div>}

      {isRegister && (
        <div className="field">
          <label>Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
      )}
      <div className="field">
        <label>Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
      </div>

      <label className="checkrow">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Keep me signed in
      </label>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
      </button>

      <div className="switch">
        {isRegister ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => setMode(isRegister ? "login" : "register")}>
          {isRegister ? "Log in" : "Sign up"}
        </button>
      </div>
    </form>
  );
}
