import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../index";

describe("admin website routes", () => {
  let publicDirectory: string;
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
  let baseUrl: string;

  beforeEach(async () => {
    publicDirectory = await mkdtemp(path.join(os.tmpdir(), "mgadmin-public-"));
    await mkdir(path.join(publicDirectory, "assets"));
    await writeFile(
      path.join(publicDirectory, "index.html"),
      "<!doctype html><html><head><title>Mental Gaming Admin</title></head><body>Admin login</body></html>",
    );
    await writeFile(path.join(publicDirectory, "assets", "app.js"), "globalThis.adminAppReady = true;");

    server = createApp(publicDirectory).listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(publicDirectory, { recursive: true, force: true });
  });

  it.each(["/", "/login", "/dashboard"])("serves the admin application at %s", async (route) => {
    const response = await fetch(`${baseUrl}${route}`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(html).toContain("Mental Gaming Admin");
  });

  it("serves built assets and keeps the health API available", async () => {
    const asset = await fetch(`${baseUrl}/assets/app.js`);
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("adminAppReady");

    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
  });
});
