// Thin fetch wrapper. The base URL points at the FastAPI backend.
// (Later: move this to an env var instead of hardcoding.)

export const API_BASE_URL = "http://127.0.0.1:8000";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }

  // DELETE may return no body; guard against empty responses.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
