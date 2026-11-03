import express from "express";
import path from "node:path";
import { registerAdminAuthRoutes } from "./server/adminAuth.js";
import { registerAdminProductRoutes } from "./server/adminProducts.js";
import { registerAdminStaffRoutes } from "./server/adminStaff.js";

export function createApp(publicDirectory = path.resolve(process.cwd(), "public")) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use("/api/admin/media", express.json({ limit: "1.4mb" }));
  app.use(express.json({ limit: "32kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });
  app.use(express.static(publicDirectory, { index: false }));

  app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));
  registerAdminAuthRoutes(app);
  registerAdminProductRoutes(app);
  registerAdminStaffRoutes(app);

  app.get(["/", "/login", "/dashboard", "/products", "/catalogs", "/orders", "/customers", "/transactions", "/topups", "/staff", "/activity", "/wallet", "/analytics", "/settings", "/gateways"], (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(publicDirectory, "index.html"));
  });

  return app;
}

const app = createApp();
export default app;
