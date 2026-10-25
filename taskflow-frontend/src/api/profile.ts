// Profile / plan API.
//   GET /profile -> Profile (404 if the user hasn't set one up)
//   PUT /profile -> Profile (saves inputs, computes + returns the plan)

import { request, ApiError } from "./client";
import type { Profile, ProfileInput } from "../types/profile";

// Returns null (not an error) when the user has no profile yet.
export async function getProfile(): Promise<Profile | null> {
  try {
    return await request<Profile>("/profile");
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function saveProfile(input: ProfileInput): Promise<Profile> {
  return request<Profile>("/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Manual targets (backend ticket). Targets are the user's own numbers: PUT
// /profile no longer recalculates them, the plan is only a suggestion.
//   GET /profile/plan    -> Plan     (computed from the profile, not saved)
//   PUT /profile/targets -> Profile  (saves exactly what the user typed)

export interface Plan {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface TargetsInput {
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}

/** The suggested plan, or null while the backend has no /profile/plan yet. */
export async function getPlan(): Promise<Plan | null> {
  try {
    return await request<Plan>("/profile/plan");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return null;
    throw e;
  }
}

export function saveTargets(input: TargetsInput): Promise<Profile> {
  return request<Profile>("/profile/targets", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
