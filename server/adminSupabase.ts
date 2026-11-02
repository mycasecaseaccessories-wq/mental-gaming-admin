export function getAdminSupabaseConfig(): { url: string; key: string } | null {
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

export async function adminSupabaseRpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const config = getAdminSupabaseConfig();
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
