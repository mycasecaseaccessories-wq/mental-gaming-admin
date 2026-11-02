import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createAdminSession } from "./adminAuth";
import { registerAdminStaffRoutes } from "./adminStaff";

describe("admin staff access routes", () => {
  const keys = [
    "MG_ADMIN_EMAIL",
    "MG_ADMIN_PASSWORD",
    "MG_ADMIN_SESSION_SECRET",
    "MG_ADMIN_SUPABASE_URL",
    "MG_ADMIN_SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const original = new Map<string, string | undefined>();
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let baseUrl: string;
  let sessionCookie: string;

  beforeEach(async () => {
    for (const key of keys) original.set(key, process.env[key]);
    process.env.MG_ADMIN_EMAIL = "owner@example.com";
    process.env.MG_ADMIN_PASSWORD = "Test-only-Site-Password-123!";
    const sessionSecret = randomBytes(32).toString("base64url");
    process.env.MG_ADMIN_SESSION_SECRET = sessionSecret;
    delete process.env.MG_ADMIN_SUPABASE_URL;
    delete process.env.MG_ADMIN_SUPABASE_SERVICE_ROLE_KEY;

    const token = await createAdminSession("owner@example.com", sessionSecret);
    sessionCookie = "mg_admin_session=" + token;

    const app = express();
    app.use(express.json({ limit: "32kb" }));
    registerAdminStaffRoutes(app);
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

  it("rejects unauthenticated staff requests and disables response caching", async () => {
    const response = await fetch(baseUrl + "/api/admin/access/staff");
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed when the Admin Supabase service key is not configured", async () => {
    const response = await fetch(baseUrl + "/api/admin/access/staff", {
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Admin Supabase အတွက် protected environment settings မပြည့်စုံသေးပါ။",
    });
  });
});
