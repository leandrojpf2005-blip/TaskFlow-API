// Thin fetch wrapper around the FastAPI backend.
// - Attaches "Authorization: Bearer <token>" on every request (persisted in
//   localStorage so a refresh stays logged in).
// - Dedupes identical in-flight GETs: React StrictMode double-fires effects in
//   dev, and the backend currently shares one DB connection across requests
//   (not thread-safe — concurrent queries can cross results). Collapsing
//   duplicate GETs keeps mount-time traffic strictly sequential.

export const API_BASE_URL = "http://127.0.0.1:8000";

// Error carrying the HTTP status, so callers can branch on it (e.g. 404).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const TOKEN_KEY = "coachfuel_token";
// "Remember me" checked -> localStorage (survives closing the browser).
// unchecked -> sessionStorage (dropped when the tab/browser closes).
// On load, read from whichever storage has it.
let authToken: string | null =
  localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null, remember = true) {
  authToken = token;
  // clear both first so a token never lingers in the other store
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (token) {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function doFetch<T>(path: string, options: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body?.detail === "string" ? body.detail : JSON.stringify(body?.detail ?? "");
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, detail || `Request failed (${res.status})`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const inflightGets = new Map<string, Promise<unknown>>();

export function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") return doFetch<T>(path, options);

  const existing = inflightGets.get(path);
  if (existing) return existing as Promise<T>;

  const p = doFetch<T>(path, options).finally(() => inflightGets.delete(path));
  inflightGets.set(path, p);
  return p;
}
