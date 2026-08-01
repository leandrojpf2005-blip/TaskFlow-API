import { MacroRing } from "./MacroRing";

interface LandingProps {
  onLogin: () => void;
  onSignup: () => void;
}

// Marketing page shown before login. The preview panel is a static,
// non-interactive mock of the diary built from real app styling.
export function Landing({ onLogin, onSignup }: LandingProps) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-mark">CF</span>
          <span>CoachFuel</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn--ghost" onClick={onLogin}>
            Log in
          </button>
          <button className="btn btn--primary" onClick={onSignup}>
            Get started
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">Nutrition coaching, simplified</span>
          <h1 className="landing-title">
            Your macros,
            <br />
            <em>dialed in.</em>
          </h1>
          <p className="landing-sub">
            A food diary built for coach–client work: meal-based logging, per-meal calorie
            targets, and live macro rings that show the day at a glance.
          </p>
          <div className="landing-cta">
            <button className="btn btn--primary btn--lg" onClick={onSignup}>
              Start tracking free
            </button>
            <button className="btn btn--ghost btn--lg" onClick={onLogin}>
              I have an account
            </button>
          </div>
          <ul className="landing-points">
            <li>Log food in seconds, MyFitnessPal-style</li>
            <li>Custom meals with their own calorie budgets</li>
            <li>Protein, carbs & fat tracked against your plan</li>
          </ul>
        </div>

        <div className="landing-preview" aria-hidden>
          <div className="lp-card lp-summary">
            <MacroRing
              value={1430}
              target={2200}
              size={124}
              stroke={11}
              color="var(--primary)"
              center={
                <div className="lp-ring-center">
                  <strong>770</strong>
                  <span>kcal left</span>
                </div>
              }
            />
            <div className="lp-bars">
              <div className="lp-bar">
                <span className="lp-bar-label" style={{ color: "var(--protein)" }}>
                  Protein
                </span>
                <div className="lp-track">
                  <div className="lp-fill" style={{ width: "72%", background: "var(--protein)" }} />
                </div>
              </div>
              <div className="lp-bar">
                <span className="lp-bar-label" style={{ color: "var(--carbs)" }}>
                  Carbs
                </span>
                <div className="lp-track">
                  <div className="lp-fill" style={{ width: "58%", background: "var(--carbs)" }} />
                </div>
              </div>
              <div className="lp-bar">
                <span className="lp-bar-label" style={{ color: "var(--fat)" }}>
                  Fat
                </span>
                <div className="lp-track">
                  <div className="lp-fill" style={{ width: "45%", background: "var(--fat)" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lp-card lp-meal">
            <header>
              <span className="lp-meal-name">🌅 Breakfast</span>
              <span className="lp-meal-cal">435 kcal</span>
            </header>
            <div className="lp-food">
              <span>Oats with whey &amp; banana</span>
              <strong>430</strong>
            </div>
            <div className="lp-food">
              <span>Black coffee</span>
              <strong>5</strong>
            </div>
          </div>

          <div className="lp-card lp-meal">
            <header>
              <span className="lp-meal-name">🥗 Lunch</span>
              <span className="lp-meal-cal">620 kcal</span>
            </header>
            <div className="lp-food">
              <span>Chicken, rice &amp; greens</span>
              <strong>620</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature">
          <span className="feature-icon" aria-hidden>
            🍽
          </span>
          <h3>Meal-based diary</h3>
          <p>Breakfast to pre-workout — create the meals you actually eat and log against them.</p>
        </div>
        <div className="feature">
          <span className="feature-icon" aria-hidden>
            🎯
          </span>
          <h3>Per-meal targets</h3>
          <p>Give every meal its own calorie budget and watch the day add itself up.</p>
        </div>
        <div className="feature">
          <span className="feature-icon" aria-hidden>
            📈
          </span>
          <h3>Live macro rings</h3>
          <p>Calories, protein, carbs and fat tracked in real time against your plan.</p>
        </div>
      </section>

      <footer className="landing-foot">
        CoachFuel — built with React, FastAPI &amp; PostgreSQL
      </footer>
    </div>
  );
}
