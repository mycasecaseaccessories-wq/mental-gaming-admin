import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";

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

type AdminSession = { email: string; role: "admin" };
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

function derivePasswordDigest(value: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, PASSWORD_SALT, 64, (error, key) => {
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

export async function createAdminSession(email: string, secret: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(normalizeEmail(email))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
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
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { email: normalizeEmail(payload.sub), role: "admin" };
  } catch {
    return null;
  }
}

export async function getAdminSessionForRequest(req: Request): Promise<AdminSession | null> {
  const credentials = getCredentials();
  if (!credentials) return null;
  const token = parseCookieHeader(req.headers.cookie ?? "")[SESSION_COOKIE];
  const session = token ? await verifyAdminSession(token, credentials.sessionSecret) : null;
  return session?.email === credentials.email ? session : null;
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
    const emailMatches = email.length <= 320 && email === credentials.email;
    const passwordMatchesConfigured = await passwordMatches(password, credentials.password);

    if (!emailMatches || !passwordMatchesConfigured) {
      res.status(401).json({ error: "အီးမေးလ်လိပ်စာ သို့မဟုတ် password မမှန်ပါ။" });
      return;
    }

    clearLoginAttempts(ip);
    const token = await createAdminSession(credentials.email, credentials.sessionSecret);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    res.status(200).json({ user: { email: credentials.email, role: "admin" } });
  });

  app.get("/api/admin-auth/me", async (req: Request, res: Response) => {
    const credentials = getCredentials();
    if (!credentials) {
      res.status(503).json({ error: "Admin ဝင်ရောက်မှုအတွက် လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ။" });
      return;
    }

    const token = parseCookieHeader(req.headers.cookie ?? "")[SESSION_COOKIE];
    const session = token ? await verifyAdminSession(token, credentials.sessionSecret) : null;
    if (!session || session.email !== credentials.email) {
      clearSessionCookie(res);
      res.status(401).json({ error: "ဝင်ရောက်ခွင့် မရှိပါ။" });
      return;
    }

    res.status(200).json({ user: session });
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
