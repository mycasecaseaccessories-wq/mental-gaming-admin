import express from "express";
import { registerAdminAuthRoutes } from "./server/adminAuth.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));
registerAdminAuthRoutes(app);

export default app;
