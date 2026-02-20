const defaultApiHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${defaultApiHost}:4000`;

export interface ApiError {
  error: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const hasBody = init?.body !== undefined;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as ApiError;
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
      // Ignore JSON parse failures for non-JSON error responses.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
