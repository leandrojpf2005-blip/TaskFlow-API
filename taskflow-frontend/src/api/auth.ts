// Auth API — wired to the FastAPI backend.
//   POST /auth/register -> UserOut
//   POST /auth/login    -> { access_token, token_type }
//   GET  /auth/me       -> UserOut  (needs the bearer token)

import { request, setAuthToken } from "./client";

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function register(username: string, email: string, password: string): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

// Logs in, stores the token (persistently if remember), returns the response.
export async function login(
  email: string,
  password: string,
  remember = true,
): Promise<TokenResponse> {
  const res = await request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.access_token, remember);
  return res;
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export function logout() {
  setAuthToken(null);
}
