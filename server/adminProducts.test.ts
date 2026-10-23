import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac, randomBytes } from "node:crypto";
import express from "express";
import type { AddressInfo } from "node:net";
import { createAdminSession, registerAdminAuthRoutes } from "./adminAuth";
import { registerAdminProductRoutes } from "./adminProducts";

describe("admin product API proxy", () => {
  const keys = ["MG_ADMIN_EMAIL", "MG_ADMIN_PASSWORD", "MG_ADMIN_SESSION_SECRET", "MG_PRODUCT_API_SECRET"] as const;
  const original = new Map<string, string | undefined>();
  type TestServer = ReturnType<ReturnType<typeof express>["listen"]>;
  let server: TestServer;
  let baseUrl: string;
  let sessionCookie: string;
  let serviceSecret: string;
  let upstreamCalls: number;
  let lastUrl: string;
  let lastInit: RequestInit | undefined;

  beforeEach(async () => {
    for (const key of keys) original.set(key, process.env[key]);
    serviceSecret = randomBytes(32).toString("hex");
    process.env.MG_ADMIN_EMAIL = "owner@example.com";
    process.env.MG_ADMIN_PASSWORD = "Test-only-Site-Password-123!";
    process.env.MG_ADMIN_SESSION_SECRET = randomBytes(32).toString("base64url");
    process.env.MG_PRODUCT_API_SECRET = serviceSecret;
    sessionCookie = `mg_admin_session=${await createAdminSession("owner@example.com", process.env.MG_ADMIN_SESSION_SECRET)}`;
    upstreamCalls = 0;
    lastUrl = "";
    lastInit = undefined;

    const app = express();
    app.use(express.json({ limit: "32kb" }));
    registerAdminAuthRoutes(app);
    registerAdminProductRoutes(app, {
      apiOrigin: "https://store-api.example.test",
      fetcher: async (input, init) => {
        upstreamCalls += 1;
        lastUrl = String(input);
        lastInit = init;
        return new Response(JSON.stringify({ ok: true, items: [], total: 0, page: 1, pages: 1 }), {
          status: init?.method === "POST" ? 201 : 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    for (const key of keys) {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    original.clear();
  });

  async function getCsrfToken(): Promise<string> {
    const response = await fetch(`${baseUrl}/api/admin-auth/csrf`);
    const body = await response.json() as { csrfToken: string };
    return body.csrfToken;
  }

  it("does not call the store API without a valid admin session", async () => {
    const response = await fetch(`${baseUrl}/api/admin/products?page=1`);
    expect(response.status).toBe(401);
    expect(upstreamCalls).toBe(0);
  });

  it("signs a read-only list request and forwards only to the product endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/admin/products?page=2&search=Diamonds`, {
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ total: 0, page: 1 });
    expect(upstreamCalls).toBe(1);
    expect(lastUrl).toBe("https://store-api.example.test/api/store/admin-portal/products?page=2&search=Diamonds");

    const headers = new Headers(lastInit?.headers);
    expect(headers.get("x-mg-admin-email")).toBe("owner@example.com");
    const timestamp = headers.get("x-mg-timestamp") ?? "";
    const nonce = headers.get("x-mg-nonce") ?? "";
    const bodyText = "";
    const bodyHash = createHash("sha256").update(bodyText).digest("hex");
    const payload = ["v1", "GET", "/api/store/admin-portal/products?page=2&search=Diamonds", timestamp, nonce, "owner@example.com", bodyHash].join("\n");
    const expectedSignature = createHmac("sha256", serviceSecret).update(payload).digest("hex");
    expect(headers.get("x-mg-signature")).toBe(expectedSignature);
    expect(headers.get("x-mg-nonce")).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
  });

  it("rejects product changes without CSRF and signs a valid create request", async () => {
    const input = { name: "Diamonds 100", category: "Mobile Legends", finalPrice: 3000 };
    const denied = await fetch(`${baseUrl}/api/admin/products`, {
      method: "POST",
      headers: { Cookie: sessionCookie, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(denied.status).toBe(403);
    expect(upstreamCalls).toBe(0);

    const csrfToken = await getCsrfToken();
    const created = await fetch(`${baseUrl}/api/admin/products`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(input),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ ok: true });
    expect(lastUrl).toBe("https://store-api.example.test/api/store/admin-portal/products");

    const headers = new Headers(lastInit?.headers);
    const bodyText = String(lastInit?.body ?? "");
    expect(bodyText).toBe(JSON.stringify(input));
    const timestamp = headers.get("x-mg-timestamp") ?? "";
    const nonce = headers.get("x-mg-nonce") ?? "";
    const bodyHash = createHash("sha256").update(bodyText).digest("hex");
    const payload = ["v1", "POST", "/api/store/admin-portal/products", timestamp, nonce, "owner@example.com", bodyHash].join("\n");
    expect(headers.get("x-mg-signature")).toBe(createHmac("sha256", serviceSecret).update(payload).digest("hex"));
  });

  it("does not proxy paths outside the product API", async () => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${baseUrl}/api/admin/products/../../users`, {
      method: "PATCH",
      redirect: "manual",
      headers: { Cookie: sessionCookie, "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: "{}",
    });
    expect([400, 404]).toContain(response.status);
    expect(upstreamCalls).toBe(0);
  });
});
