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
