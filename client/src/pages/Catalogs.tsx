import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, FolderTree, ImageIcon, LoaderCircle, Package, RefreshCw, Save } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import { fetchCatalogs, flattenCatalogs, updateCatalogImage, type AdminCatalog } from "@/lib/catalogs";
import { fetchProducts, type AdminProduct, type ProductStatus } from "@/lib/products";

type CatalogTreeItemProps = {
  catalog: AdminCatalog;
  level: number;
  selectedId: string;
  disabled: boolean;
  onSelect: (catalog: AdminCatalog) => void;
};

function CatalogTreeItem({ catalog, level, selectedId, disabled, onSelect }: CatalogTreeItemProps) {
  const active = selectedId === catalog.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(catalog)}
      disabled={disabled}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-cyan-200/25 bg-cyan-200/[0.08]" : "border-transparent hover:border-white/8 hover:bg-white/[0.035]"}`}
      style={{ paddingLeft: `${12 + level * 18}px` }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] text-slate-500">
        {catalog.imageUrl ? <img src={catalog.imageUrl} alt={`${catalog.name} ပုံ`} className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ImageIcon size={17} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-100">{catalog.name}</span>
        <span className="mt-1 block text-[11px] text-slate-500">{catalog.productCount.toLocaleString("en-US")} ခု · {catalog.isActive ? "အသုံးပြုနေသည်" : "ဖျောက်ထားသည်"}</span>
      </span>
      {level > 0 && <ChevronDown size={14} className="rotate-[-90deg] text-slate-600" aria-hidden="true" />}
    </button>
  );
}

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "အသုံးပြုနေသည်",
  out_of_stock: "ကုန်သွားသည်",
  coming_soon: "မကြာမီရောက်ရှိမည်",
  hidden: "ဖျောက်ထားသည်",
};

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ကျပ်`;
}

function updateTreeImage(catalogs: AdminCatalog[], id: string, imageUrl: string | null): AdminCatalog[] {
  return catalogs.map((catalog) => ({
    ...catalog,
    imageUrl: catalog.id === id ? imageUrl : catalog.imageUrl,
    subCatalogs: catalog.subCatalogs?.map((child) => ({
      ...child,
      imageUrl: child.id === id ? imageUrl : child.imageUrl,
    })),
  }));
}

export default function Catalogs() {
  const [catalogs, setCatalogs] = useState<AdminCatalog[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const flatCatalogs = useMemo(() => flattenCatalogs(catalogs), [catalogs]);
  const selected = flatCatalogs.find((catalog) => catalog.id === selectedId) ?? null;

  const loadCatalogs = useCallback(async () => {
    setLoadingCatalogs(true);
    setError("");
    try {
      const result = await fetchCatalogs();
      setCatalogs(result);
      setSelectedId((current) => current && flattenCatalogs(result).some((catalog) => catalog.id === current)
        ? current
        : result[0]?.id ?? result[0]?.subCatalogs?.[0]?.id ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "အုပ်စုစာရင်းကို ဖွင့်၍ မရပါ။");
    } finally {
      setLoadingCatalogs(false);
    }
  }, []);

  useEffect(() => { void loadCatalogs(); }, [loadCatalogs]);

  useEffect(() => {
    setImageDraft(selected?.imageUrl ?? "");
  }, [selected?.id, selected?.imageUrl]);

  const loadProducts = useCallback(async () => {
    if (!selectedId) {
      setProducts([]);
      setTotal(0);
      setPages(1);
      return;
    }
    setLoadingProducts(true);
    setError("");
    try {
      const result = await fetchProducts("", page, selectedId);
      setProducts(result.items);
      setTotal(result.total);
      setPages(Math.max(1, result.pages));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "ကုန်ပစ္စည်းစာရင်းကို ဖွင့်၍ မရပါ။");
    } finally {
      setLoadingProducts(false);
    }
  }, [page, selectedId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  function selectCatalog(catalog: AdminCatalog) {
    setSelectedId(catalog.id);
    setPage(1);
    setNotice("");
    setError("");
  }

  async function saveImage() {
    if (!selected || savingImage) return;
    const nextUrl = imageDraft.trim() || null;
    if (nextUrl) {
      try {
        if (new URL(nextUrl).protocol !== "https:") throw new Error();
      } catch {
        setError("HTTPS ဖြင့်စသော ပုံလိပ်စာ မှန်ကန်စွာ ထည့်ပါ။");
        return;
      }
    }
    setSavingImage(true);
    setError("");
    setNotice("");
    try {
      await updateCatalogImage(selected.id, nextUrl);
      setCatalogs((current) => updateTreeImage(current, selected.id, nextUrl));
      setImageDraft(nextUrl ?? "");
      setNotice("အုပ်စု၏ပုံကို သိမ်းဆည်းပြီးပါပြီ။");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ပုံကို သိမ်းဆည်း၍ မရပါ။");
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-cyan-200/80">ဆိုင်၏ အုပ်စုဖွဲ့စည်းပုံ</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">အုပ်စုနှင့် ပုံများ</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">အုပ်စုကြီး၊ အုပ်စုခွဲနှင့် ထုတ်ကုန်များကို ရွေးကြည့်ပြီး တစ်ခုချင်းစီအတွက် ပုံတင်နိုင်ပါသည်။</p>
        </div>
        <button type="button" onClick={() => void loadCatalogs()} disabled={loadingCatalogs || uploadingImage || savingImage} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 hover:border-cyan-200/25 disabled:opacity-50">
          <RefreshCw size={15} className={loadingCatalogs ? "animate-spin" : ""} aria-hidden="true" /> ပြန်ဖွင့်ရန်
        </button>
      </div>

      {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-lime-300/15 bg-lime-300/[0.06] px-4 py-3 text-sm text-lime-200"><CheckCircle2 size={16} aria-hidden="true" />{notice}</p>}
      {error && <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
        <section className="rounded-2xl border border-white/8 bg-[#111827]/80 p-4 shadow-xl shadow-black/10 sm:p-5" aria-label="အုပ်စုစာရင်း">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200"><FolderTree size={17} className="text-cyan-200" aria-hidden="true" /> အုပ်စုများ</div>
          {loadingCatalogs ? (
            <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-400" role="status"><LoaderCircle size={17} className="animate-spin text-cyan-200" /> ဖွင့်နေသည်…</div>
          ) : catalogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">အုပ်စုစာရင်း မရှိသေးပါ။</p>
          ) : (
            <div className="space-y-1">
              {catalogs.map((parent) => (
                <div key={parent.id}>
                  <CatalogTreeItem catalog={parent} level={0} selectedId={selectedId} disabled={uploadingImage || savingImage} onSelect={selectCatalog} />
                  {(parent.subCatalogs ?? []).map((child) => (
                    <CatalogTreeItem key={child.id} catalog={child} level={1} selectedId={selectedId} disabled={uploadingImage || savingImage} onSelect={selectCatalog} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          {selected ? (
            <section className="rounded-2xl border border-white/8 bg-[#111827]/80 p-4 shadow-xl shadow-black/10 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-cyan-200/80">{selected.parentName ? `အုပ်စုခွဲ · ${selected.parentName}` : "အုပ်စုကြီး"}</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{selected.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{selected.productCount.toLocaleString("en-US")} ခု · {selected.isActive ? "ဆိုင်တွင် အသုံးပြုနေသည်" : "လက်ရှိ ဖျောက်ထားသည်"}</p>
                </div>
              </div>
              <ImageUploadField value={imageDraft} onChange={setImageDraft} disabled={savingImage} onUploadingChange={setUploadingImage} label="ဤအုပ်စုအတွက် ပုံ" />
              <label className="mt-4 block text-xs font-medium text-slate-300">သိမ်းဆည်းမည့် HTTPS ပုံလိပ်စာ
                <input type="url" value={imageDraft} onChange={(event) => setImageDraft(event.target.value)} placeholder="https://..." className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0a101b] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/45" />
              </label>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setImageDraft("")} disabled={savingImage || uploadingImage || !imageDraft} className="h-10 rounded-xl border border-white/10 px-4 text-xs text-slate-300 hover:bg-white/[0.04] disabled:opacity-40">ပုံဖယ်ရန်</button>
                <button type="button" onClick={() => void saveImage()} disabled={savingImage || uploadingImage || imageDraft.trim() === (selected.imageUrl ?? "")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
                  {savingImage ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
                  {savingImage ? "သိမ်းဆည်းနေသည်…" : "ပုံသိမ်းရန်"}
                </button>
              </div>
            </section>
          ) : (
            <section className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">အုပ်စုတစ်ခုကို ရွေးပါ။</section>
          )}

          <section className="rounded-2xl border border-white/8 bg-[#111827]/80 p-4 shadow-xl shadow-black/10 sm:p-5" aria-label="ရွေးထားသောအုပ်စု၏ ကုန်ပစ္စည်းများ">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Package size={17} className="text-cyan-200" aria-hidden="true" />{selected ? `${selected.name} · ကုန်ပစ္စည်းများ` : "ကုန်ပစ္စည်းများ"}</div>
              {selected && <span className="text-xs text-slate-500">စုစုပေါင်း {total.toLocaleString("en-US")} ခု</span>}
            </div>
            {loadingProducts ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-400" role="status"><LoaderCircle size={17} className="animate-spin text-cyan-200" /> စာရင်းဖွင့်နေသည်…</div>
            ) : products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">ဤအုပ်စုတွင် တိုက်ရိုက်ချိတ်ထားသော ကုန်ပစ္စည်း မရှိသေးပါ။</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => <ProductRow key={product.id} product={product} />)}
              </div>
            )}
            {!loadingProducts && pages > 1 && <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3"><p className="text-xs text-slate-500">စာမျက်နှာ {page} / {pages}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} aria-label="ယခင်စာမျက်နှာ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-40"><ChevronLeft size={16} /></button><button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page >= pages} aria-label="နောက်စာမျက်နှာ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#0c1320] p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] text-slate-500">
        {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} ပုံ`} className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ImageIcon size={17} aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-slate-100">{product.name}</h3>
        <p className="mt-1 truncate text-xs text-slate-500">{product.region} · {product.productType === "DigitalCode" ? "ဒစ်ဂျစ်တယ်ကုဒ်" : "တိုက်ရိုက်ငွေဖြည့်"}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold text-slate-200">{formatPrice(product.finalPrice)}</p>
        <p className={`mt-1 text-[10px] ${product.status === "active" ? "text-lime-200" : "text-slate-400"}`}>{STATUS_LABELS[product.status]}</p>
      </div>
    </article>
  );
}
