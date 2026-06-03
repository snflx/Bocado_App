const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "restaurant_reviews_token";
const USER_KEY = "restaurant_reviews_user";

export function getStoredSession() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const rawUser = sessionStorage.getItem(USER_KEY);
  return {
    token,
    user: rawUser ? JSON.parse(rawUser) : null
  };
}

export function saveSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

const ABORT_TIMEOUT = 15_000;

export async function request(path, { token, signal, ...options } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_TIMEOUT);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal: signal || controller.signal
  }).finally(() => clearTimeout(timeoutId));

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No fue posible completar la solicitud");
  }

  return data;
}
