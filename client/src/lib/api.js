// The ONE place that talks to the backend. Every page uses api(...).
// It attaches the token, normalises errors, and signs the user out on a 401.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9090/api";
const TOKEN_KEY = "forgetrack_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors; // [{ field, message }] from the server, if any
  }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = "GET", body, signal } = {}) {
  const token = tokenStore.get();
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    // An expired/invalid token on a logged-in session -> sign out.
    // (A failed login has no token yet, so it doesn't trigger this.)
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  }

  return data;
}
