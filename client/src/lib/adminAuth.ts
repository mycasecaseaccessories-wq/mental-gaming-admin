export type AdminUser = {
  email: string;
  role: "admin";
};

export class AdminAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AdminAuthError";
  }
}

let cachedCsrfToken: string | null = null;
let csrfTokenFetchedAt = 0;
const CSRF_CACHE_MS = 5 * 60 * 1000;
const CSRF_TOKEN_PATTERN = /^v1\.\d{10,13}\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/;

async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Do not surface network or parser details to the page.
  }
  return "တောင်းဆိုချက် မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။";
}

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken && Date.now() - csrfTokenFetchedAt < CSRF_CACHE_MS) {
    return cachedCsrfToken;
  }
  const response = await fetch("/api/admin-auth/csrf", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new AdminAuthError(await readMessage(response), response.status);
  const body = (await response.json()) as { csrfToken?: unknown };
  if (typeof body.csrfToken !== "string" || !CSRF_TOKEN_PATTERN.test(body.csrfToken)) {
    throw new AdminAuthError("လုံခြုံရေးအချက်အလက် မမှန်ပါ။", 500);
  }
  cachedCsrfToken = body.csrfToken;
  csrfTokenFetchedAt = Date.now();
  return cachedCsrfToken;
}

export async function fetchAdminUser(): Promise<AdminUser | null> {
  const response = await fetch("/api/admin-auth/me", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new AdminAuthError(await readMessage(response), response.status);
  }
  const body = (await response.json()) as { user?: AdminUser };
  return body.user ?? null;
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const csrfToken = await getCsrfToken();
  const response = await fetch("/api/admin-auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new AdminAuthError(await readMessage(response), response.status);
  }
  const body = (await response.json()) as { user: AdminUser };
  return body.user;
}

export async function logoutAdmin(): Promise<void> {
  const csrfToken = await getCsrfToken();
  const response = await fetch("/api/admin-auth/logout", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new AdminAuthError(await readMessage(response), response.status);
  }
  cachedCsrfToken = null;
  csrfTokenFetchedAt = 0;
}
