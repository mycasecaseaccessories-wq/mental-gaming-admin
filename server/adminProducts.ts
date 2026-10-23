import { createHash, createHmac, randomBytes } from "node:crypto";
import { Router, type Express, type Request, type Response } from "express";
import { getAdminSessionForRequest, isAdminCsrfRequestValid } from "./adminAuth.js";

const PRODUCT_API_ORIGIN = "https://mental-gaming-store.vercel.app";
const ADMIN_PRODUCT_PREFIX = "/api/admin/products";

export type ProductProxyOptions = {
  apiOrigin?: string;
  fetcher?: typeof fetch;
};

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

function isAllowedProxyPath(method: string, suffix: string): boolean {
  if (method === "GET") return suffix === "" || suffix.startsWith("?");
  if (method === "POST") return suffix === "";
  return method === "PATCH" && /^\/[a-f0-9]{24}$/i.test(suffix);
}

function errorForStatus(status: number): string {
  if (status === 400) return "ထည့်သွင်းထားသော ကုန်ပစ္စည်းအချက်အလက်ကို ပြန်စစ်ဆေးပါ။";
  if (status === 404) return "ကုန်ပစ္စည်းကို မတွေ့ပါ။ စာရင်းကို ပြန်လည်ဖွင့်ပါ။";
  if (status === 409) return "တောင်းဆိုမှုကို လက်ခံမရပါ။ စာမျက်နှာကို ပြန်လည်ဖွင့်ပြီး ထပ်ကြိုးစားပါ။";
  if (status === 429) return "တောင်းဆိုမှုများ များနေပါသည်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။";
  return "ဆိုင်ဒေတာဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။";
}

async function sendProductRequest(
  req: Request,
  res: Response,
  method: "GET" | "POST" | "PATCH",
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

  const secret = process.env["MG_PRODUCT_API_SECRET"] ?? "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    res.status(503).json({ error: "ကုန်ပစ္စည်း API လုံခြုံရေးဆက်တင် မပြည့်စုံသေးပါ။" });
    return;
  }

  const suffix = req.originalUrl.startsWith(ADMIN_PRODUCT_PREFIX)
    ? req.originalUrl.slice(ADMIN_PRODUCT_PREFIX.length)
    : "!invalid";
  if (!isAllowedProxyPath(method, suffix)) {
    res.status(404).json({ error: "စာမျက်နှာ မတွေ့ပါ။" });
    return;
  }

  const apiPath = `/api/store/admin-portal/products${suffix}`;
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
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    if (!upstream.ok) {
      res.status(upstream.status >= 400 && upstream.status < 500 && upstream.status !== 401 && upstream.status !== 403
        ? upstream.status
        : 502).json({ error: errorForStatus(upstream.status) });
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
    apiOrigin: options.apiOrigin ?? PRODUCT_API_ORIGIN,
    fetcher: options.fetcher ?? fetch,
  };
  const router = Router();
  router.get("/products", (req, res) => void sendProductRequest(req, res, "GET", resolvedOptions));
  router.post("/products", (req, res) => void sendProductRequest(req, res, "POST", resolvedOptions));
  router.patch("/products/:id", (req, res) => void sendProductRequest(req, res, "PATCH", resolvedOptions));
  app.use("/api/admin", router);
}
