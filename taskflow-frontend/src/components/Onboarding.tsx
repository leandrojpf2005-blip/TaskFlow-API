import { useState } from "react";
import * as profileApi from "../api/profile";
import type { Profile, ProfileInput } from "../types/profile";
import { round1 } from "../lib/format";
import { ProfileForm } from "./ProfileForm";
import { MacroRing } from "./MacroRing";

interface OnboardingProps {
  username: string;
  onDone: (profile: Profile) => void;
}

export function Onboarding({ username, onDone }: OnboardingProps) {
  const [plan, setPlan] = useState<Profile | null>(null);

  const handleSubmit = async (input: ProfileInput) => {
    const saved = await profileApi.saveProfile(input);
    setPlan(saved); // switches to the result view
  };

  if (plan) {
    return (
      <div className="onboard">
        <div className="onboard-card onboard-result">
          <span className="eyebrow">Your plan is ready</span>
          <h1 className="onboard-title">Here are your daily targets</h1>

          <div className="plan-hero">
            <MacroRing
              value={0}
              target={plan.target_calories ?? 0}
              size={150}
              stroke={13}
              color="var(--primary)"
              center={
                <div className="plan-ring-center">
                  <strong>{plan.target_calories}</strong>
                  <span>kcal / day</span>
                </div>
              }
            />
            <div className="plan-macros">
              <div className="plan-macro">
                <span style={{ color: "var(--protein)" }}>Protein</span>
                <strong>{round1(plan.target_protein_g ?? 0)}g</strong>
              </div>
              <div className="plan-macro">
                <span style={{ color: "var(--carbs)" }}>Carbs</span>
                <strong>{round1(plan.target_carbs_g ?? 0)}g</strong>
              </div>
              <div className="plan-macro">
                <span style={{ color: "var(--fat)" }}>Fat</span>
                <strong>{round1(plan.target_fat_g ?? 0)}g</strong>
              </div>
            </div>
          </div>

          <p className="onboard-note">
            You can change these anytime in Settings → Profile.
          </p>
          <button className="btn btn--primary pf-submit" onClick={() => onDone(plan)}>
            Start tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="auth-brand">
          <span className="brand-mark">CF</span>
          <span>CoachFuel</span>
        </div>
        <h1 className="onboard-title">Welcome, {username} 👋</h1>
        <p className="onboard-sub">
          A few details and we'll calculate your calorie and macro targets.
        </p>
        <ProfileForm submitLabel="Calculate my plan" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
