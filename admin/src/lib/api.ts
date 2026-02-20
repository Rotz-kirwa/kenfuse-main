const defaultApiHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${defaultApiHost}:4000`;
const TOKEN_KEY = "kenfuse_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const hasBody = init?.body !== undefined;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const tokenHeaders = authHeader();
  Object.entries(tokenHeaders).forEach(([key, value]) => headers.set(key, value));

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[] | undefined> };
      };
      if (payload.error) {
        message = payload.error;
      }

      const fieldErrors = payload.details?.fieldErrors;
      if (fieldErrors) {
        const firstField = Object.values(fieldErrors).find((messages) => messages && messages.length);
        if (firstField && firstField.length > 0) {
          message = firstField[0];
        }
      }
    } catch {
      // Non-JSON response.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
