export type AdminList<T> = { items: T[]; total: number; page: number; pages: number };
export type AdminOrder = {
  id: string; shortId: string | null; status: string; productName: string | null;
  productType: string | null; amountKS: number; timestamp: string;
  user: { id: string; name: string; username: string | null; telegramId: number } | null;
};
export type AdminCustomer = {
  id: string; telegramId: number; name: string; username: string | null;
  balanceKS: number; balanceCoin: number; totalDeposited: number; tier: string;
  isBlocked: boolean; joinedAt: string | null;
};
export type AdminTransaction = {
  id: string; txId: string | null; type: string; amount: number; status: string;
  paymentMethod: string | null; note: string | null; timestamp: string;
  user: { id: string; name: string; username: string | null; telegramId: number } | null;
};
export type AdminTopup = {
  id: string; txId: string | null; amount: number; paymentMethod: string | null;
  screenshotUrl: string | null; timestamp: string;
  user: { id: string; name: string; username: string | null; telegramId: number } | null;
};

async function readAdminList<T>(path: string, params: Record<string, string>): Promise<AdminList<T>> {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/admin/${path}?${query.toString()}`, {
    credentials: "include", headers: { Accept: "application/json" }, cache: "no-store",
  });
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error("ဆာဗာမှ အဖြေမရရှိပါ။"); }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error : "အချက်အလက်များကို ဖတ်ရှု၍ မရပါ။";
    throw new Error(message);
  }
  return body as AdminList<T>;
}

export const fetchAdminOrders = (page: number, status: string) =>
  readAdminList<AdminOrder>("orders", { page: String(page), status });
export const fetchAdminCustomers = (page: number, q: string) =>
  readAdminList<AdminCustomer>("users", { page: String(page), ...(q ? { q } : {}) });
export const fetchAdminTransactions = (page: number, type: string, status: string) =>
  readAdminList<AdminTransaction>("transactions", { page: String(page), type, status });
export const fetchAdminTopups = (page: number) =>
  readAdminList<AdminTopup>("topups", { page: String(page) });
