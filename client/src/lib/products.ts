import { getAdminCsrfToken } from "@/lib/adminAuth";

export type ProductStatus = "active" | "out_of_stock" | "coming_soon" | "hidden";
export type ProductType = "DirectTopup" | "DigitalCode";

export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  region: string;
  productType: ProductType;
  finalPrice: number;
  flashSalePrice: number | null;
  stockCount: number;
  isActive: boolean;
  status: ProductStatus;
  imageUrl: string | null;
  description: string;
  sortOrder: number;
  catalogId: string | null;
};

export type ProductInput = Omit<AdminProduct, "id">;
export type ProductList = { items: AdminProduct[]; total: number; page: number; pages: number };

export class ProductApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ProductApiError";
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: { error?: unknown } & Record<string, unknown>;
  try {
    payload = (await response.json()) as { error?: unknown } & Record<string, unknown>;
  } catch {
    throw new ProductApiError("ဆိုင်ဒေတာဆာဗာမှ မမှန်ကန်သော အဖြေကို ရရှိခဲ့ပါသည်။", response.status);
  }
  if (!response.ok) {
    const message = typeof payload.error === "string"
      ? payload.error
      : "တောင်းဆိုမှု မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။";
    throw new ProductApiError(message, response.status);
  }
  return payload as T;
}

export async function fetchProducts(search: string, page: number, catalogId?: string): Promise<ProductList> {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("search", search);
  if (catalogId) query.set("catalogId", catalogId);
  const response = await fetch(`/api/admin/products?${query.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return readResponse<ProductList>(response);
}

async function saveProductRequest(path: string, method: "POST" | "PATCH", input: ProductInput): Promise<void> {
  const csrfToken = await getAdminCsrfToken();
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(input),
  });
  await readResponse<{ ok: boolean }>(response);
}

export function createProduct(input: ProductInput): Promise<void> {
  return saveProductRequest("/api/admin/products", "POST", input);
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  return saveProductRequest(`/api/admin/products/${encodeURIComponent(id)}`, "PATCH", input as ProductInput);
}
