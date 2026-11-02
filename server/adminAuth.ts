import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { adminSupabaseRpc } from "./adminSupabase.js";

const SESSION_COOKIE = "mg_admin_session";
const SESSION_ISSUER = "mental-gaming-admin";
const SESSION_AUDIENCE = "mg-admin-dashboard";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const CSRF_MAX_AGE_SECONDS = 10 * 60;
const PASSWORD_SALT = randomBytes(16);
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const MAX_TRACKED_LOGIN_KEYS = 2000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

type AdminSession = { email: string; role: "admin" | "staff"; roleKey: string };
type Credentials = { email: string; password: string; sessionSecret: string };

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getCredentials(): Credentials | null {
  const email = normalizeEmail(process.env.MG_ADMIN_EMAIL ?? "");
  const password = process.env.MG_ADMIN_PASSWORD ?? "";
  const sessionSecret = process.env.MG_ADMIN_SESSION_SECRET ?? "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (
    !validEmail ||
    password.length < 12 ||
    password.length > 1024 ||
    Buffer.byteLength(sessionSecret, "utf8") < 32
  ) {
    return null;
  }
  return { email, password, sessionSecret };
}

function derivePasswordDigest(value: string, salt: Buffer = PASSWORD_SALT): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function passwordMatches(candidate: string, configured: string): Promise<boolean> {
  if (!candidate || candidate.length > 1024 || !configured) return false;
  const [candidateDigest, configuredDigest] = await Promise.all([
    derivePasswordDigest(candidate),
    derivePasswordDigest(configured),
  ]);
  return timingSafeEqual(candidateDigest, configuredDigest);
}

export async function createAdminSession(email: string, secret: string, roleKey = "super_admin"): Promise<string> {
  const role = roleKey === "super_admin" ? "admin" : "staff";
  return new SignJWT({ role, roleKey })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(normalizeEmail(email))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
}

export async function hashStaffPassword(password: string): Promise<{ hash: string; salt: string }> {
  if (password.length < 12 || password.length > 128) throw new Error("INVALID_STAFF_PASSWORD");
  const salt = randomBytes(16);
  const digest = await derivePasswordDigest(password, salt);
  return { hash: digest.toString("base64url"), salt: salt.toString("base64url") };
}

export async function staffPasswordMatches(candidate: string, storedHash: string, storedSalt: string): Promise<boolean> {
  if (!candidate || candidate.length > 128) return false;
  try {
    const salt = Buffer.from(storedSalt, "base64url");
    const expected = Buffer.from(storedHash, "base64url");
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = await derivePasswordDigest(candidate, salt);
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}

export async function verifyAdminSession(
  token: string,
  secret: string,
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    if (typeof payload.sub !== "string") return null;
    if (payload.role === "admin" && (payload.roleKey === undefined || payload.roleKey === "super_admin")) {
      return { email: normalizeEmail(payload.sub), role: "admin", roleKey: "super_admin" };
    }
    if (payload.role === "staff" && typeof payload.roleKey === "string" && payload.roleKey.length <= 64) {
      return { email: normalizeEmail(payload.sub), role: "staff", roleKey: payload.roleKey };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAdminSessionForRequest(req: Request): Promise<AdminSession | null> {
  const credentials = getCredentials();
  if (!credentials) return null;
  const token = parseCookieHeader(req.headers.cookie ?? "")[SESSION_COOKIE];
  const session = token ? await verifyAdminSession(token, credentials.sessionSecret) : null;
  if (!session) return null;
  if (session.role === "admin") return session.email === credentials.email ? session : null;
  return session.email !== credentials.email ? session : null;
}

export function isAdminCsrfRequestValid(req: Request): boolean {
  const credentials = getCredentials();
  return Boolean(
    credentials && req.is("application/json") && hasValidCsrfToken(req, credentials.sessionSecret),
  );
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function createCsrfToken(secret: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(32).toString("base64url");
  const message = `v1.${issuedAt}.${nonce}`;
  const signature = createHmac("sha256", secret).update(message).digest("base64url");
  return `${message}.${signature}`;
}

function isValidCsrfToken(token: string, secret: string): boolean {
  if (token.length > 256) return false;
  const [version, issuedAtText, nonce, signature, extra] = token.split(".");
  if (
    extra !== undefined ||
    version !== "v1" ||
    !/^\d{10,13}$/.test(issuedAtText ?? "") ||
    !/^[A-Za-z0-9_-]{43}$/.test(nonce ?? "") ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature ?? "")
  ) return false;

  const issuedAt = Number(issuedAtText);
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60 || now - issuedAt > CSRF_MAX_AGE_SECONDS) return false;

  const message = `${version}.${issuedAtText}.${nonce}`;
  const expected = createHmac("sha256", secret).update(message).digest("base64url");
  return safeEqual(expected, signature);
}

function hasValidCsrfToken(req: Request, secret: string): boolean {
  if (req.get("Sec-Fetch-Site")?.toLowerCase() === "cross-site") return false;
  return isValidCsrfToken(req.get("X-CSRF-Token") ?? "", secret);
}

function pruneExpiredLoginAttempts(now: number) {
  for (const [key, value] of loginAttempts) {
    if (value.resetAt <= now) loginAttempts.delete(key);
  }
}

function allowLoginAttempt(ip: string): boolean {
  const now = Date.now();
  pruneExpiredLoginAttempts(now);

  const current = loginAttempts.get(ip);
  if (!current) {
    if (loginAttempts.size >= MAX_TRACKED_LOGIN_KEYS) {
      let oldestKey: string | undefined;
      let oldestExpiry = Number.POSITIVE_INFINITY;
      for (const [key, value] of loginAttempts) {
        if (value.resetAt < oldestExpiry) {
          oldestKey = key;
          oldestExpiry = value.resetAt;
        }
      }
      if (oldestKey) loginAttempts.delete(oldestKey);
    }
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }

  if (current.count >= LOGIN_MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

function staffLoginAttemptKeys(ip: string, email: string): string[] {
  return [
    createHash("sha256").update("staff-login-ip:" + ip).digest("hex"),
    createHash("sha256").update("staff-login-email:" + normalizeEmail(email)).digest("hex"),
  ];
}

async function allowStaffLoginAttempt(ip: string, email: string): Promise<boolean> {
  const keys = staffLoginAttemptKeys(ip, email);
  const results = await Promise.all(keys.map((key) =>
    adminSupabaseRpc<boolean>("mg_admin_claim_login_attempt", {
      p_attempt_key: key,
      p_window_seconds: 900,
      p_max_attempts: LOGIN_MAX_ATTEMPTS,
    }),
  ));
  return results.every(Boolean);
}

async function clearStaffLoginAttempts(ip: string, email: string): Promise<void> {
  await Promise.all(staffLoginAttemptKeys(ip, email).map((key) =>
    adminSupabaseRpc<void>("mg_admin_clear_login_attempt", { p_attempt_key: key }),
  ));
}

function requestIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function sendNoStore(res: Response) {
  res.setHeader("Cache-Control", "no-store");
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: 0 });
}

export function registerAdminAuthRoutes(app: Express) {
  app.use("/api/admin-auth", (_req, res, next) => {
    sendNoStore(res);
    next();
  });

  app.get("/api/admin-auth/csrf", (_req: Request, res: Response) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.status(503).json({ error: "Admin ဝင်ရောက်မှုအတွက် လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ။" });
      return;
    }
    res.status(200).json({ csrfToken: createCsrfToken(credentials.sessionSecret) });
  });

  app.post("/api/admin-auth/login", async (req: Request, res: Response) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.status(503).json({ error: "Admin ဝင်ရောက်မှုအတွက် လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ။" });
      return;
    }
    if (!req.is("application/json") || !hasValidCsrfToken(req, credentials.sessionSecret)) {
      res.status(403).json({ error: "ဤတောင်းဆိုမှုကို ခွင့်မပြုပါ။" });
      return;
    }

    const ip = requestIp(req);
    if (!allowLoginAttempt(ip)) {
      res.status(429).json({ error: "အကြိမ်များစွာ ကြိုးစားထားပါတယ်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။" });
      return;
    }

    const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || email.length > 320 || !password || password.length > 128) {
      res.status(401).json({ error: "အီးမေးလ်လိပ်စာ သို့မဟုတ် password မမှန်ပါ။" });
      return;
    }

    let token: string | null = null;
    let user: { email: string; role: "admin" | "staff"; roleKey: string; permissions: string[] } | null = null;
    if (email === credentials.email && await passwordMatches(password, credentials.password)) {
      token = await createAdminSession(credentials.email, credentials.sessionSecret, "super_admin");
      user = {
        email: credentials.email, role: "admin", roleKey: "super_admin",
        permissions: ["dashboard.view","orders.view","customers.view","products.view","products.manage","catalogs.view","catalogs.manage","wallet.view","transactions.view","topups.view","analytics.view","settings.view","staff.manage","roles.manage","audit.view","notifications.manage","announcements.manage"],
      };
    } else if (email !== credentials.email) {
      try {
        if (!await allowStaffLoginAttempt(ip, email)) {
          res.status(429).json({ error: "အကြိမ်များစွာ ကြိုးစားထားပါတယ်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။" });
          return;
        }
        const staff = await adminSupabaseRpc<{ email?: string; is_active?: boolean; access_state?: string; password_hash?: string | null; password_salt?: string | null; role_key?: string; permissions?: string[] }>("mg_admin_get_staff_login", { p_email: email });
        if (staff.email === email && staff.is_active === true && staff.access_state === "active" &&
            typeof staff.password_hash === "string" && typeof staff.password_salt === "string" &&
            typeof staff.role_key === "string" && await staffPasswordMatches(password, staff.password_hash, staff.password_salt)) {
          token = await createAdminSession(email, credentials.sessionSecret, staff.role_key);
          user = { email, role: "staff", roleKey: staff.role_key, permissions: Array.isArray(staff.permissions) ? staff.permissions : [] };
          await clearStaffLoginAttempts(ip, email);
        }
      } catch {
        // Keep the same public response for missing, inactive, and unavailable staff accounts.
      }
    }

    if (!token || !user) {
      res.status(401).json({ error: "အီးမေးလ်လိပ်စာ သို့မဟုတ် password မမှန်ပါ။" });
      return;
    }

    clearLoginAttempts(ip);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    res.status(200).json({ user });
  });

  app.get("/api/admin-auth/me", async (req: Request, res: Response) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.status(503).json({ error: "Admin ဝင်ရောက်မှုအတွက် လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ။" });
      return;
    }

    const token = parseCookieHeader(req.headers.cookie ?? "")[SESSION_COOKIE];
    const session = token ? await verifyAdminSession(token, credentials.sessionSecret) : null;
    if (!session || (session.role === "admin" && session.email !== credentials.email) ||
        (session.role === "staff" && session.email === credentials.email)) {
      clearSessionCookie(res);
      res.status(401).json({ error: "ဝင်ရောက်ခွင့် မရှိပါ။" });
      return;
    }

    if (session.role === "staff") {
      try {
        const access = await adminSupabaseRpc<{ email?: string; is_active?: boolean; access_state?: string; role_key?: string; permissions?: string[] }>("mg_admin_get_staff_access", { p_email: session.email });
        if (access.email !== session.email || access.is_active !== true || access.access_state !== "active") {
          clearSessionCookie(res);
          res.status(401).json({ error: "ဤဝန်ထမ်းအကောင့်ကို ပိတ်ထားပါသည်။" });
          return;
        }
        res.status(200).json({ user: { email: session.email, role: "staff", roleKey: access.role_key, permissions: Array.isArray(access.permissions) ? access.permissions : [] } });
        return;
      } catch {
        res.status(503).json({ error: "Staff permission service ကို ယာယီအသုံးမပြုနိုင်ပါ။" });
        return;
      }
    }

    res.status(200).json({ user: {
      email: session.email, role: "admin", roleKey: "super_admin",
      permissions: ["dashboard.view","orders.view","customers.view","products.view","products.manage","catalogs.view","catalogs.manage","wallet.view","transactions.view","topups.view","analytics.view","settings.view","staff.manage","roles.manage","audit.view","notifications.manage","announcements.manage"],
    } });
  });

  app.post("/api/admin-auth/logout", (req: Request, res: Response) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.status(503).json({ error: "Admin ဝင်ရောက်မှုအတွက် လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ။" });
      return;
    }
    if (!req.is("application/json") || !hasValidCsrfToken(req, credentials.sessionSecret)) {
      res.status(403).json({ error: "ဤတောင်းဆိုမှုကို ခွင့်မပြုပါ။" });
      return;
    }
    clearSessionCookie(res);
    res.status(200).json({ success: true });
  });
}
