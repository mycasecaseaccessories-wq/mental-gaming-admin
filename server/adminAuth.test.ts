import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import {
  createAdminSession,
  passwordMatches,
  hashStaffPassword,
  staffPasswordMatches,
  registerAdminAuthRoutes,
  verifyAdminSession,
} from "./adminAuth";

describe("admin authentication", () => {
  const keys = ["MG_ADMIN_EMAIL", "MG_ADMIN_PASSWORD", "MG_ADMIN_SESSION_SECRET"] as const;
  const original = new Map<string, string | undefined>();
  type TestServer = ReturnType<ReturnType<typeof express>["listen"]>;
  let server: TestServer;
  let baseUrl: string;
  let sessionSecret: string;

  beforeEach(async () => {
    for (const key of keys) original.set(key, process.env[key]);
    sessionSecret = randomBytes(32).toString("base64url");
    process.env.MG_ADMIN_EMAIL = "owner@example.com";
    process.env.MG_ADMIN_PASSWORD = "Test-only-Site-Password-123!";
    process.env.MG_ADMIN_SESSION_SECRET = sessionSecret;

    const app = express();
    app.use(express.json({ limit: "32kb" }));
    registerAdminAuthRoutes(app);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    for (const key of keys) {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    original.clear();
  });

  async function issueCsrf() {
    const response = await fetch(`${baseUrl}/api/admin-auth/csrf`);
    const body = await response.json() as { csrfToken: string };
    return { token: body.csrfToken, setCookie: response.headers.get("set-cookie") ?? "" };
  }

  async function loginWithConfiguredAdmin(csrf: Awaited<ReturnType<typeof issueCsrf>>) {
    const response = await fetch(`${baseUrl}/api/admin-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.token,
      },
      body: JSON.stringify({ email: " OWNER@EXAMPLE.COM ", password: "Test-only-Site-Password-123!" }),
    });
    const cookie = (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
    return { response, cookie };
  }

  it("compares the configured site password without accepting a different value", async () => {
    expect(await passwordMatches("Test-only-Site-Password-123!", "Test-only-Site-Password-123!")).toBe(true);
    expect(await passwordMatches("Wrong-site-password", "Test-only-Site-Password-123!")).toBe(false);
    expect(await passwordMatches("", "Test-only-Site-Password-123!")).toBe(false);
  });

  it("accepts only a correctly signed, correctly scoped admin session", async () => {
    const token = await createAdminSession("Owner@Example.com", sessionSecret);
    expect(await verifyAdminSession(token, sessionSecret)).toEqual({
      email: "owner@example.com",
      role: "admin",
      roleKey: "super_admin",
    });
    expect(await verifyAdminSession(token, randomBytes(32).toString("base64url"))).toBeNull();
  });

  it("hashes staff passwords with unique salts and verifies them safely", async () => {
    const first = await hashStaffPassword("Staff-Password-For-Tests-2026!");
    const second = await hashStaffPassword("Staff-Password-For-Tests-2026!");
    expect(first.salt).not.toBe(second.salt);
    expect(await staffPasswordMatches("Staff-Password-For-Tests-2026!", first.hash, first.salt)).toBe(true);
    expect(await staffPasswordMatches("Wrong-Staff-Password-2026!", first.hash, first.salt)).toBe(false);
  });

  it("issues staff sessions with a staff role claim", async () => {
    const token = await createAdminSession("staff@example.com", sessionSecret, "manager");
    expect(await verifyAdminSession(token, sessionSecret)).toEqual({
      email: "staff@example.com",
      role: "staff",
      roleKey: "manager",
    });
  });

  it("issues a signed no-store CSRF token without requiring a browser cookie", async () => {
    const response = await fetch(`${baseUrl}/api/admin-auth/csrf`);
    const body = await response.json() as { csrfToken: string };
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.csrfToken).toMatch(/^v1\.\d{10,13}\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a CSRF token with an altered signature", async () => {
    const csrf = await issueCsrf();
    const altered = `${csrf.token.slice(0, -1)}x`;
    const response = await fetch(`${baseUrl}/api/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": altered },
      body: JSON.stringify({ email: "owner@example.com", password: "Test-only-Site-Password-123!" }),
    });
    expect(response.status).toBe(403);
  });

  it("requires a session for the identity endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/admin-auth/me`);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a cross-site logout even if the signed CSRF token is supplied", async () => {
    const csrf = await issueCsrf();
    const { response: login, cookie } = await loginWithConfiguredAdmin(csrf);
    expect(login.status).toBe(200);

    const attack = await fetch(`${baseUrl}/api/admin-auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Sec-Fetch-Site": "cross-site",
        "X-CSRF-Token": csrf.token,
        Cookie: cookie,
      },
      body: "{}",
    });
    expect(attack.status).toBe(403);
    expect(await attack.json()).toEqual({ error: "ဤတောင်းဆိုမှုကို ခွင့်မပြုပါ။" });

    const stillSignedIn = await fetch(`${baseUrl}/api/admin-auth/me`, { headers: { Cookie: cookie } });
    expect(stillSignedIn.status).toBe(200);
  });

  it("returns the same login error for an incorrect account or password", async () => {
    const csrf = await issueCsrf();
    const response = await fetch(`${baseUrl}/api/admin-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.token,
      },
      body: JSON.stringify({ email: "someone@example.com", password: "wrong-password-value" }),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "အီးမေးလ်လိပ်စာ သို့မဟုတ် password မမှန်ပါ။" });
  });

  it("creates a secure session cookie and clears it on CSRF-protected logout", async () => {
    const csrf = await issueCsrf();
    const { response: login, cookie } = await loginWithConfiguredAdmin(csrf);
    const loginBody = await login.json();
    const sessionSetCookie = login.headers.get("set-cookie") ?? "";

    expect(login.status).toBe(200);
    expect(sessionSetCookie).toContain("mg_admin_session=");
    expect(sessionSetCookie).toContain("HttpOnly");
    expect(sessionSetCookie).toContain("Secure");
    expect(sessionSetCookie).toContain("SameSite=None");
    expect(loginBody.user).toMatchObject({ email: "owner@example.com", role: "admin", roleKey: "super_admin" });
    expect(loginBody.user.permissions).toContain("dashboard.view");
    expect(JSON.stringify(loginBody)).not.toContain("Test-only-Site-Password-123!");

    const me = await fetch(`${baseUrl}/api/admin-auth/me`, { headers: { Cookie: cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ user: { email: "owner@example.com", role: "admin", roleKey: "super_admin" } });

    const logout = await fetch(`${baseUrl}/api/admin-auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.token,
        Cookie: cookie,
      },
      body: "{}",
    });
    const logoutCookie = logout.headers.get("set-cookie") ?? "";
    expect(logout.status).toBe(200);
    expect(logoutCookie).toContain("mg_admin_session=;");
    expect(logoutCookie).not.toContain("__Host-mg_admin_csrf");

    const anonymous = await fetch(`${baseUrl}/api/admin-auth/me`);
    expect(anonymous.status).toBe(401);
  });

  it("limits repeated failed logins and shows a Burmese retry message", async () => {
    const csrf = await issueCsrf();
    const successful = await loginWithConfiguredAdmin(csrf);
    expect(successful.response.status).toBe(200);

    const makeWrongLogin = () => fetch(`${baseUrl}/api/admin-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf.token,
      },
      body: JSON.stringify({ email: "unknown@example.com", password: "wrong-password-value" }),
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await makeWrongLogin();
      expect(response.status).toBe(401);
      await response.arrayBuffer();
    }
    const limited = await makeWrongLogin();
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "အကြိမ်များစွာ ကြိုးစားထားပါတယ်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။" });
  });
});
