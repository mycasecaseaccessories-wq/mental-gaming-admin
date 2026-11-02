import { Router, type Express, type Request, type Response } from "express";
import { getAdminSessionForRequest, isAdminCsrfRequestValid } from "./adminAuth.js";

type AdminAccess = {
  email: string;
  display_name: string | null;
  is_active: boolean;
  access_state: "active" | "pending_auth" | "suspended";
  role_key: string;
  permissions: string[];
};

function getSupabaseConfig(): { url: string; key: string } | null {
  const rawUrl = process.env.MG_ADMIN_SUPABASE_URL?.trim() ?? "";
  const key = process.env.MG_ADMIN_SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!rawUrl || Buffer.byteLength(key, "utf8") < 32) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("ADMIN_SUPABASE_FORBIDDEN");
    throw new Error("ADMIN_SUPABASE_REQUEST_FAILED");
  }
  return await response.json() as T;
}

async function authorize(req: Request, res: Response, permission: string): Promise<{ email: string; access: AdminAccess } | null> {
  const session = await getAdminSessionForRequest(req);
  if (!session) {
    res.status(401).json({ error: "Admin အဖြစ် ဝင်ရောက်ရန် လိုအပ်ပါသည်။" });
    return null;
  }
  try {
    const access = await rpc<AdminAccess>("mg_admin_bootstrap_super_admin", {
      p_email: session.email,
      p_display_name: null,
    });
    if (!access.email || !access.is_active || access.access_state !== "active" || !access.permissions?.includes(permission)) {
      res.status(403).json({ error: "ဤလုပ်ဆောင်ချက်အတွက် ခွင့်ပြုချက် မရှိပါ။" });
      return null;
    }
    return { email: session.email, access };
  } catch {
    res.status(503).json({ error: "Admin permission service ကို ချိတ်ဆက်၍ မရပါ။ လုံခြုံရေးအတွက် လုပ်ဆောင်ချက်ကို ပိတ်ထားသည်။" });
    return null;
  }
}

function sendError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "ADMIN_SUPABASE_NOT_CONFIGURED") {
    res.status(503).json({ error: "Admin Supabase အတွက် protected environment settings မပြည့်စုံသေးပါ။" });
  } else if (message === "ADMIN_SUPABASE_FORBIDDEN") {
    res.status(403).json({ error: "ဤလုပ်ဆောင်ချက်ကို ခွင့်မပြုပါ။" });
  } else {
    res.status(503).json({ error: "Admin data service ကို ယာယီအသုံးမပြုနိုင်ပါ။" });
  }
}

export function registerAdminStaffRoutes(app: Express) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/staff", async (req, res) => {
    if (!await authorize(req, res, "staff.manage")) return;
    try {
      res.setHeader("Cache-Control", "no-store");
      res.json({ items: await rpc<unknown[]>("mg_admin_list_staff") });
    } catch (error) { sendError(res, error); }
  });

  router.get("/roles", async (req, res) => {
    if (!await authorize(req, res, "roles.manage")) return;
    try {
      res.setHeader("Cache-Control", "no-store");
      const [roles, permissions] = await Promise.all([
        rpc<unknown[]>("mg_admin_list_roles"),
        rpc<unknown[]>("mg_admin_list_permissions"),
      ]);
      res.json({ roles, permissions });
    } catch (error) { sendError(res, error); }
  });

  router.post("/roles/:roleKey", async (req, res) => {
    const authorized = await authorize(req, res, "roles.manage");
    if (!authorized) return;
    if (!req.is("application/json") || !isAdminCsrfRequestValid(req)) {
      res.status(403).json({ error: "လုံခြုံရေးအတည်ပြုမှု မအောင်မြင်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပါ။" });
      return;
    }
    const roleKey = req.params.roleKey;
    const permissions = req.body?.permissions;
    if (!["admin", "manager", "staff", "viewer"].includes(roleKey) ||
        !Array.isArray(permissions) || permissions.length > 100 ||
        permissions.some((permission: unknown) => typeof permission !== "string" || permission.length > 120)) {
      res.status(400).json({ error: "Role သို့မဟုတ် Permission စာရင်းကို ပြန်စစ်ပါ။" });
      return;
    }
    try {
      const item = await rpc<unknown>("mg_admin_save_role_permissions", {
        p_actor_email: authorized.email,
        p_role_key: roleKey,
        p_permissions: permissions,
      });
      res.status(200).json({ item });
    } catch (error) { sendError(res, error); }
  });

  router.get("/activity", async (req, res) => {
    if (!await authorize(req, res, "audit.view")) return;
    try {
      const limit = Math.max(1, Math.min(250, Number(req.query.limit) || 100));
      res.setHeader("Cache-Control", "no-store");
      res.json({ items: await rpc<unknown[]>("mg_admin_list_activity", { p_limit: limit, p_actor_email: null }) });
    } catch (error) { sendError(res, error); }
  });

  router.post("/staff", async (req, res) => {
    const authorized = await authorize(req, res, "staff.manage");
    if (!authorized) return;
    if (!req.is("application/json") || !isAdminCsrfRequestValid(req)) {
      res.status(403).json({ error: "လုံခြုံရေးအတည်ပြုမှု မအောင်မြင်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပါ။" });
      return;
    }
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 100) : "";
    const roleKey = typeof req.body?.roleKey === "string" ? req.body.roleKey : "";
    const isActive = req.body?.isActive === true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 ||
        !["super_admin", "admin", "manager", "staff", "viewer"].includes(roleKey)) {
      res.status(400).json({ error: "Email သို့မဟုတ် Role ကို ပြန်စစ်ပါ။" });
      return;
    }
    try {
      const item = await rpc<unknown>("mg_admin_save_staff", {
        p_actor_email: authorized.email,
        p_email: email,
        p_display_name: displayName || null,
        p_role_key: roleKey,
        p_is_active: isActive,
      });
      res.status(200).json({ item });
    } catch (error) { sendError(res, error); }
  });

  app.use("/api/admin/access", router);
}
