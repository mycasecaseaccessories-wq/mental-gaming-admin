import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import {
  hashStaffPassword,
  registerAdminAuthRoutes,
} from "./adminAuth";
import type { adminSupabaseRpc } from "./adminSupabase";

describe("staff email/password authentication", () => {
  const keys = ["MG_ADMIN_EMAIL", "MG_ADMIN_PASSWORD", "MG_ADMIN_SESSION_SECRET"] as const;
  const original = new Map<string, string | undefined>();
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let baseUrl: string;
  let staffHash: { hash: string; salt: string };
  let staffActive = true;
  let rateAllowed = true;

  beforeEach(async () => {
    for (const key of keys) original.set(key, process.env[key]);
    process.env.MG_ADMIN_EMAIL = "owner@example.com";
    process.env.MG_ADMIN_PASSWORD = "Test-only-Site-Password-123!";
    process.env.MG_ADMIN_SESSION_SECRET = randomBytes(32).toString("base64url");
    staffHash = await hashStaffPassword("Staff-Password-For-Tests-2026!");
    staffActive = true;
    rateAllowed = true;

    const rpc: typeof adminSupabaseRpc = async <T>(name: string): Promise<T> => {
      if (name === "mg_admin_claim_login_attempt") return rateAllowed as T;
      if (name === "mg_admin_clear_login_attempt") return undefined as T;
      if (name === "mg_admin_get_staff_login") {
        return {
          email: "staff@example.com",
          is_active: staffActive,
          access_state: staffActive ? "active" : "suspended",
          password_hash: staffHash.hash,
          password_salt: staffHash.salt,
          role_key: "staff",
          permissions: ["dashboard.view", "orders.view"],
        } as T;
      }
      if (name === "mg_admin_get_staff_access") {
        return {
          email: "staff@example.com",
          is_active: staffActive,
          access_state: staffActive ? "active" : "suspended",
          role_key: "staff",
          permissions: ["dashboard.view", "orders.view"],
        } as T;
      }
      throw new Error("Unexpected RPC: " + name);
    };

    const app = express();
    app.use(express.json({ limit: "32kb" }));
    registerAdminAuthRoutes(app, { rpc });
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = "http://127.0.0.1:" + address.port;
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

  async function csrfToken() {
    const response = await fetch(baseUrl + "/api/admin-auth/csrf");
    const body = await response.json() as { csrfToken: string };
    return body.csrfToken;
  }

  it("authenticates an active staff account and resolves current permissions", async () => {
    const token = await csrfToken();
    const login = await fetch(baseUrl + "/api/admin-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
      body: JSON.stringify({ email: "STAFF@example.com", password: "Staff-Password-For-Tests-2026!" }),
    });
    expect(login.status).toBe(200);
    const body = await login.json() as { user: { email: string; role: string; roleKey: string; permissions: string[] } };
    expect(body.user).toEqual({
      email: "staff@example.com",
      role: "staff",
      roleKey: "staff",
      permissions: ["dashboard.view", "orders.view"],
    });

    const cookie = (login.headers.get("set-cookie") ?? "").split(";", 1)[0];
    const me = await fetch(baseUrl + "/api/admin-auth/me", { headers: { Cookie: cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      user: { email: "staff@example.com", role: "staff", roleKey: "staff", permissions: ["dashboard.view", "orders.view"] },
    });
  });

  it("uses a generic login error for an incorrect staff password", async () => {
    const token = await csrfToken();
    const response = await fetch(baseUrl + "/api/admin-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
      body: JSON.stringify({ email: "staff@example.com", password: "Incorrect-Staff-Password!" }),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "အီးမေးလ်လိပ်စာ သို့မဟုတ် password မမှန်ပါ။" });
  });

  it("rejects a suspended staff account even when its password hash matches", async () => {
    staffActive = false;
    const token = await csrfToken();
    const response = await fetch(baseUrl + "/api/admin-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
      body: JSON.stringify({ email: "staff@example.com", password: "Staff-Password-For-Tests-2026!" }),
    });
    expect(response.status).toBe(401);
  });

  it("enforces the durable rate-limit response for staff login", async () => {
    rateAllowed = false;
    const token = await csrfToken();
    const response = await fetch(baseUrl + "/api/admin-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
      body: JSON.stringify({ email: "staff@example.com", password: "Staff-Password-For-Tests-2026!" }),
    });
    expect(response.status).toBe(429);
  });
});
