export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "kenfuse_token";
const USER_KEY = "kenfuse_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
