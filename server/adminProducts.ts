import { createHash, createHmac, randomBytes } from "node:crypto";
import { Router, type Express, type Request, type Response } from "express";
import { getAdminSessionForRequest, isAdminCsrfRequestValid } from "./adminAuth.js";

const PRODUCTION_PRODUCT_API_ORIGIN = "https://mental-gaming-store.vercel.app";

export function getProductApiOrigin(): string {
  const configured = process.env["MG_PRODUCT_API_ORIGIN"]?.trim();
  if (configured) {
    try {
      const origin = new URL(configured);
      if (
        origin.protocol !== "https:" ||
        origin.username ||
        origin.password ||
        origin.pathname !== "/" ||
        origin.search ||
        origin.hash
      ) {
        return "";
      }
      return origin.origin;
    } catch {
      return "";
    }
  }
  return process.env["VERCEL_ENV"] === "production" ? PRODUCTION_PRODUCT_API_ORIGIN : "";
}
const ADMIN_PREFIX = "/api/admin";
const SERVICE_PREFIX = "/api/store/admin-portal";

export type ProductProxyOptions = {
  apiOrigin?: string;
  fetcher?: typeof fetch;
};

type PortalMethod = "GET" | "POST" | "PATCH";

function signingPayload(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  email: string,
  bodyText: string,
): string {
  const bodyHash = createHash("sha256").update(bodyText).digest("hex");
  return ["v1", method.toUpperCase(), path, timestamp, nonce, email.trim().toLowerCase(), bodyHash].join("\n");
}

function hasOnlyQueryKeys(search: string, allowedKeys: ReadonlySet<string>): boolean {
  const keys = [...new URLSearchParams(search).keys()];
  return keys.every((key, index) => allowedKeys.has(key) && keys.indexOf(key) === index);
}

function resolveServicePath(method: PortalMethod, originalUrl: string): string | null {
  if (!originalUrl.startsWith(ADMIN_PREFIX)) return null;
  const suffix = originalUrl.slice(ADMIN_PREFIX.length);
  const queryIndex = suffix.indexOf("?");
  const path = queryIndex < 0 ? suffix : suffix.slice(0, queryIndex);
  const search = queryIndex < 0 ? "" : suffix.slice(queryIndex + 1);
  const hasQuery = queryIndex >= 0 && search.length > 0;

  if (path === "/products") {
    if (method === "POST") return hasQuery ? null : `${SERVICE_PREFIX}${suffix}`;
    if (method === "GET" && (!hasQuery || hasOnlyQueryKeys(search, new Set(["page", "search", "catalogId"])))) {
      return `${SERVICE_PREFIX}${suffix}`;
    }
    return null;
  }
  const readOnlyQueryRoutes: Record<string, ReadonlySet<string>> = {
    summary: new Set(),
    orders: new Set(["page", "status"]),
    users: new Set(["page", "q"]),
    transactions: new Set(["page", "type", "status"]),
    topups: new Set(["page"]),
  };
  if (["summary", "orders", "users", "transactions", "topups"].includes(path.slice(1)) && method === "GET") {
    const allowed = readOnlyQueryRoutes[path.slice(1)];
    if (allowed && (!hasQuery || hasOnlyQueryKeys(search, allowed))) return `${SERVICE_PREFIX}${suffix}`;
    return null;
  }
  if (path === "/catalogs") {
    if (method === "GET" && !hasQuery) return `${SERVICE_PREFIX}${suffix}`;
    return null;
  }
  if (path === "/media") {
    if (method === "POST" && !hasQuery) return `${SERVICE_PREFIX}${suffix}`;
    return null;
  }
  if (/^\/products\/[a-f0-9]{24}$/i.test(path) && method === "PATCH" && !hasQuery) {
    return `${SERVICE_PREFIX}${suffix}`;
  }
  if (/^\/catalogs\/[a-f0-9]{24}$/i.test(path) && method === "PATCH" && !hasQuery) {
    return `${SERVICE_PREFIX}${suffix}`;
  }
  return null;
}

function errorForStatus(status: number): string {
  if (status === 400) return "ထည့်သွင်းထားသော အချက်အလက် သို့မဟုတ် ပုံကို စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။";
  if (status === 404) return "ရွေးထားသော အုပ်စု၊ ကုန်ပစ္စည်း သို့မဟုတ် ပုံကို ရှာမတွေ့ပါ။";
  if (status === 409) return "တောင်းဆိုမှုကို အတည်မပြုနိုင်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပြီး ထပ်ကြိုးစားပါ။";
  if (status === 413) return "ပုံဖိုင်အရွယ်အစား ကြီးလွန်းနေသည်။ အရွယ်သေးသောပုံကို ရွေးပါ။";
  if (status === 429) return "တောင်းဆိုမှု များနေပါသည်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။";
  return "ဆိုင်ဒေတာဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။";
}

async function sendPortalRequest(
  req: Request,
  res: Response,
  method: PortalMethod,
  options: Required<ProductProxyOptions>,
): Promise<void> {
  const session = await getAdminSessionForRequest(req);
  if (!session) {
    res.status(401).json({ error: "ဤလုပ်ဆောင်ချက်အတွက် Admin အဖြစ် ဝင်ရောက်ရန် လိုအပ်ပါသည်။" });
    return;
  }

  if (method !== "GET" && !isAdminCsrfRequestValid(req)) {
    res.status(403).json({ error: "လုံခြုံရေးအတည်ပြုမှု မအောင်မြင်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပြီး ထပ်ကြိုးစားပါ။" });
    return;
  }

  const apiPath = resolveServicePath(method, req.originalUrl);
  if (!apiPath) {
    res.status(404).json({ error: "စာမျက်နှာ မတွေ့ပါ။" });
    return;
  }

  if (!options.apiOrigin) {
    res.status(503).json({ error: "ကုန်ပစ္စည်း API ချိတ်ဆက်မှုကို ဤ environment အတွက် မသတ်မှတ်ရသေးပါ။" });
    return;
  }

  const secret = process.env["MG_PRODUCT_API_SECRET"] ?? "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    res.status(503).json({ error: "ကုန်ပစ္စည်း API လုံခြုံရေးဆက်တင် မပြည့်စုံသေးပါ။" });
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(18).toString("base64url");
  const bodyText = method === "GET" ? "" : JSON.stringify(req.body ?? {});
  const signature = createHmac("sha256", secret)
    .update(signingPayload(method, apiPath, timestamp, nonce, session.email, bodyText))
    .digest("hex");

  try {
    const upstream = await options.fetcher(`${options.apiOrigin}${apiPath}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
        "X-MG-Timestamp": timestamp,
        "X-MG-Nonce": nonce,
        "X-MG-Admin-Email": session.email,
        "X-MG-Signature": signature,
      },
      ...(method === "GET" ? {} : { body: bodyText }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const status = upstream.status >= 400 && upstream.status < 500 && upstream.status !== 401 && upstream.status !== 403
        ? upstream.status
        : 502;
      res.status(status).json({ error: errorForStatus(upstream.status) });
      return;
    }

    const text = await upstream.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      res.status(502).json({ error: "ဆိုင်ဒေတာဆာဗာမှ မမှန်ကန်သော အဖြေကို ရရှိခဲ့ပါသည်။" });
      return;
    }
    res.status(upstream.status).setHeader("Cache-Control", "no-store").json(payload);
  } catch {
    res.status(502).json({ error: "ဆိုင်ဒေတာဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။ အင်တာနက်နှင့် API အခြေအနေကို စစ်ဆေးပါ။" });
  }
}

export function registerAdminProductRoutes(app: Express, options: ProductProxyOptions = {}): void {
  const resolvedOptions: Required<ProductProxyOptions> = {
    apiOrigin: options.apiOrigin ?? getProductApiOrigin(),
    fetcher: options.fetcher ?? fetch,
  };
  const router = Router();
  router.get("/summary", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.get("/orders", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.get("/users", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.get("/transactions", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.get("/topups", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.get("/products", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.post("/products", (req, res) => void sendPortalRequest(req, res, "POST", resolvedOptions));
  router.patch("/products/:id", (req, res) => void sendPortalRequest(req, res, "PATCH", resolvedOptions));
  router.get("/catalogs", (req, res) => void sendPortalRequest(req, res, "GET", resolvedOptions));
  router.patch("/catalogs/:id", (req, res) => void sendPortalRequest(req, res, "PATCH", resolvedOptions));
  router.post("/media", (req, res) => void sendPortalRequest(req, res, "POST", resolvedOptions));
  app.use(ADMIN_PREFIX, router);
}
