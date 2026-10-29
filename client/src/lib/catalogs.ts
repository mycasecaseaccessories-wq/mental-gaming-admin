import { getAdminCsrfToken } from "@/lib/adminAuth";

export type AdminCatalog = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentCategoryId: string | null;
  productCount: number;
  subCatalogs?: AdminCatalog[];
};

export type FlatCatalog = AdminCatalog & {
  parentName: string | null;
  displayName: string;
};

export class CatalogApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "CatalogApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: { error?: unknown } & Record<string, unknown>;
  try {
    payload = (await response.json()) as { error?: unknown } & Record<string, unknown>;
  } catch {
    throw new CatalogApiError("ဆိုင်ဒေတာဆာဗာမှ မမှန်ကန်သော အဖြေကို ရရှိခဲ့ပါသည်။", response.status);
  }
  if (!response.ok) {
    throw new CatalogApiError(
      typeof payload.error === "string" ? payload.error : "တောင်းဆိုမှု မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။",
      response.status,
    );
  }
  return payload as T;
}

export async function fetchCatalogs(): Promise<AdminCatalog[]> {
  const response = await fetch("/api/admin/catalogs", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await parseResponse<{ catalogs: AdminCatalog[] }>(response);
  return payload.catalogs;
}

export function flattenCatalogs(catalogs: AdminCatalog[]): FlatCatalog[] {
  const result: FlatCatalog[] = [];
  for (const parent of catalogs) {
    result.push({ ...parent, parentName: null, displayName: parent.name });
    for (const child of parent.subCatalogs ?? []) {
      result.push({ ...child, parentName: parent.name, displayName: `${parent.name} / ${child.name}` });
    }
  }
  return result;
}

export async function updateCatalogImage(id: string, imageUrl: string | null): Promise<void> {
  const csrfToken = await getAdminCsrfToken();
  const response = await fetch(`/api/admin/catalogs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ imageUrl }),
  });
  await parseResponse<{ ok: boolean }>(response);
}
