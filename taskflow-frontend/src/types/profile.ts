export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";

// What the user submits (PUT /profile body).
export interface ProfileInput {
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: Sex;
  activity: Activity;
  weekly_change_kg: number;
}

// What comes back — inputs + the computed plan.
export interface Profile extends ProfileInput {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
}
