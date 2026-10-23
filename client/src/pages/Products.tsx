import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  createProduct,
  fetchProducts,
  ProductApiError,
  updateProduct,
  type AdminProduct,
  type ProductInput,
  type ProductStatus,
  type ProductType,
} from "@/lib/products";

type FormValues = {
  name: string;
  category: string;
  region: string;
  productType: ProductType;
  finalPrice: string;
  flashSalePrice: string;
  stockCount: string;
  status: ProductStatus;
  imageUrl: string;
  description: string;
  sortOrder: string;
};

const EMPTY_FORM: FormValues = {
  name: "",
  category: "",
  region: "Global",
  productType: "DirectTopup",
  finalPrice: "",
  flashSalePrice: "",
  stockCount: "-1",
  status: "active",
  imageUrl: "",
  description: "",
  sortOrder: "0",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "အသုံးပြုနေသည်",
  out_of_stock: "ကုန်သွားသည်",
  coming_soon: "မကြာမီရောက်ရှိမည်",
  hidden: "ဖျောက်ထားသည်",
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  active: "border-lime-300/20 bg-lime-300/[0.08] text-lime-200",
  out_of_stock: "border-amber-300/20 bg-amber-300/[0.08] text-amber-200",
  coming_soon: "border-violet-300/20 bg-violet-300/[0.08] text-violet-200",
  hidden: "border-slate-400/20 bg-slate-400/[0.07] text-slate-300",
};

function formFromProduct(product?: AdminProduct): FormValues {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name,
    category: product.category,
    region: product.region,
    productType: product.productType,
    finalPrice: String(product.finalPrice),
    flashSalePrice: product.flashSalePrice === null ? "" : String(product.flashSalePrice),
    stockCount: String(product.stockCount),
    status: product.status,
    imageUrl: product.imageUrl ?? "",
    description: product.description,
    sortOrder: String(product.sortOrder),
  };
}

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ကျပ်`;
}

function messageFor(error: unknown): string {
  if (error instanceof ProductApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "တောင်းဆိုမှု မအောင်မြင်ပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။";
}

function ProductDialog({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: AdminProduct | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(() => formFromProduct(product ?? undefined));
  const [error, setError] = useState("");

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const finalPrice = Number(values.finalPrice);
    const flashSalePrice = values.flashSalePrice.trim() === "" ? null : Number(values.flashSalePrice);
    const stockCount = Number(values.stockCount);
    const sortOrder = Number(values.sortOrder);
    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      setError("ဈေးနှုန်းကို မှန်ကန်စွာ ထည့်သွင်းပါ။");
      return;
    }
    if (flashSalePrice !== null && (!Number.isFinite(flashSalePrice) || flashSalePrice < 0)) {
      setError("လျှော့ဈေးကို မှန်ကန်စွာ ထည့်သွင်းပါ။");
      return;
    }
    if (!Number.isInteger(stockCount) || stockCount < -1) {
      setError("လက်ကျန်သည် -1 သို့မဟုတ် သုညနှင့်အထက် ကိန်းပြည့် ဖြစ်ရမည်။");
      return;
    }
    if (!Number.isInteger(sortOrder)) {
      setError("အစီအစဉ်နံပါတ်ကို ကိန်းပြည့် ထည့်သွင်းပါ။");
      return;
    }
    const input: ProductInput = {
      name: values.name.trim(),
      category: values.category.trim(),
      region: values.region.trim() || "Global",
      productType: values.productType,
      finalPrice,
      flashSalePrice,
      stockCount,
      isActive: values.status !== "hidden",
      status: values.status,
      imageUrl: values.imageUrl.trim() || null,
      description: values.description.trim(),
      sortOrder,
    };
    try {
      await onSave(input);
    } catch (saveError) {
      setError(messageFor(saveError));
    }
  }

  const inputClass = "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0a101b] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10";
  const labelClass = "block text-xs font-medium text-slate-300";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101827] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-cyan-200">ကုန်ပစ္စည်းစာရင်း</p>
            <h2 id="product-form-title" className="mt-2 text-xl font-semibold text-white">
              {product ? "ကုန်ပစ္စည်းအချက်အလက် ပြင်ဆင်ရန်" : "ကုန်ပစ္စည်းအသစ် ထည့်ရန်"}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="ပိတ်ရန်" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>ကုန်ပစ္စည်းအမည် *
              <input className={inputClass} required maxLength={160} value={values.name} onChange={(event) => setField("name", event.target.value)} placeholder="ဥပမာ — Diamonds 100" />
            </label>
            <label className={labelClass}>အုပ်စုအမည် *
              <input className={inputClass} required maxLength={100} value={values.category} onChange={(event) => setField("category", event.target.value)} placeholder="ဥပမာ — Mobile Legends" />
            </label>
            <label className={labelClass}>ဒေသ သို့မဟုတ် ဆာဗာ
              <input className={inputClass} maxLength={100} value={values.region} onChange={(event) => setField("region", event.target.value)} placeholder="Global" />
            </label>
            <label className={labelClass}>ကုန်ပစ္စည်းအမျိုးအစား
              <select className={inputClass} value={values.productType} onChange={(event) => setField("productType", event.target.value as ProductType)}>
                <option value="DirectTopup">တိုက်ရိုက်ငွေဖြည့်</option>
                <option value="DigitalCode">ဒစ်ဂျစ်တယ်ကုဒ်</option>
              </select>
            </label>
            <label className={labelClass}>ပုံမှန်ဈေးနှုန်း (ကျပ်) *
              <input className={inputClass} required type="number" min="0" step="0.01" value={values.finalPrice} onChange={(event) => setField("finalPrice", event.target.value)} placeholder="0" />
            </label>
            <label className={labelClass}>လျှော့ဈေး (မထည့်လည်းရသည်)
              <input className={inputClass} type="number" min="0" step="0.01" value={values.flashSalePrice} onChange={(event) => setField("flashSalePrice", event.target.value)} placeholder="လျှော့ဈေးမရှိပါ" />
            </label>
            <label className={labelClass}>လက်ကျန်အရေအတွက်
              <input className={inputClass} required type="number" min="-1" step="1" value={values.stockCount} onChange={(event) => setField("stockCount", event.target.value)} />
              <span className="mt-1 block text-[11px] text-slate-500">-1 ထည့်လျှင် အကန့်အသတ်မရှိဟု သတ်မှတ်မည်။</span>
            </label>
            <label className={labelClass}>ဖော်ပြမည့်အခြေအနေ
              <select className={inputClass} value={values.status} onChange={(event) => setField("status", event.target.value as ProductStatus)}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className={labelClass}>ပုံလိပ်စာ (URL)
              <input className={inputClass} type="url" value={values.imageUrl} onChange={(event) => setField("imageUrl", event.target.value)} placeholder="https://..." />
            </label>
            <label className={labelClass}>စီစဉ်မှုနံပါတ်
              <input className={inputClass} type="number" step="1" value={values.sortOrder} onChange={(event) => setField("sortOrder", event.target.value)} />
            </label>
          </div>

          <label className={labelClass}>ရှင်းလင်းချက်
            <textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#0a101b] px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10" maxLength={5000} value={values.description} onChange={(event) => setField("description", event.target.value)} placeholder="ကုန်ပစ္စည်းအကြောင်း အတိုချုံးဖော်ပြပါ။" />
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-50">မလုပ်တော့ပါ</button>
            <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
              {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
              {saving ? "သိမ်းဆည်းနေသည်…" : "သိမ်းဆည်းရန်"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Products() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchProducts(search, page);
      setItems(result.items);
      setTotal(result.total);
      setPages(Math.max(1, result.pages));
    } catch (loadError) {
      setError(messageFor(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  function openCreateDialog() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  function openEditDialog(product: AdminProduct) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  async function handleSave(input: ProductInput) {
    setSaving(true);
    setNotice("");
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, input);
        setNotice("ကုန်ပစ္စည်းအချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ။");
      } else {
        await createProduct(input);
        setPage(1);
        setSearch("");
        setSearchText("");
        setNotice("ကုန်ပစ္စည်းအသစ်ကို ထည့်သွင်းပြီးပါပြီ။");
      }
      setDialogOpen(false);
      await loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(product: AdminProduct) {
    setBusyId(product.id);
    setNotice("");
    setError("");
    try {
      const status: ProductStatus = product.status === "hidden" ? "active" : "hidden";
      await updateProduct(product.id, { status });
      setNotice(status === "hidden" ? "ကုန်ပစ္စည်းကို ဖျောက်ထားပြီးပါပြီ။" : "ကုန်ပစ္စည်းကို ပြန်လည်ဖော်ပြပြီးပါပြီ။");
      await loadProducts();
    } catch (toggleError) {
      setError(messageFor(toggleError));
    } finally {
      setBusyId(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
    setNotice("");
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-cyan-200/80">ဆိုင်၏ လက်ရှိစာရင်း</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">ဆိုင်တွင် ပြသမည့်ကုန်ပစ္စည်းများကို ကြည့်ရှု၊ ရှာဖွေ၊ အသစ်ထည့်သွင်းနှင့် ပြင်ဆင်ပါ။</p>
        </div>
        <button type="button" onClick={openCreateDialog} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
          <Plus size={17} aria-hidden="true" />
          ကုန်ပစ္စည်းအသစ်
        </button>
      </div>

      <section className="rounded-2xl border border-white/8 bg-[#111827]/80 p-4 shadow-xl shadow-black/10 sm:p-5" aria-label="ကုန်ပစ္စည်းစာရင်း">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-xl">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">အမည် သို့မဟုတ် အုပ်စုဖြင့် ရှာရန်</span>
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#0a101b] pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/40" placeholder="အမည် သို့မဟုတ် အုပ်စုဖြင့် ရှာရန်" />
            </label>
            <button type="submit" className="h-11 rounded-xl border border-white/10 px-4 text-sm font-medium text-slate-200 hover:border-cyan-300/30 hover:text-cyan-100">ရှာရန်</button>
          </form>
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:justify-end">
            <span>စုစုပေါင်း {total.toLocaleString("en-US")} ခု</span>
            <button type="button" onClick={() => void loadProducts()} disabled={loading} aria-label="စာရင်းအသစ်ပြန်ဖွင့်ရန်" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            </button>
          </div>
        </div>

        {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-lime-300/15 bg-lime-300/[0.06] px-4 py-3 text-sm text-lime-200"><CheckCircle2 size={16} aria-hidden="true" />{notice}</p>}
        {error && <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</span><button type="button" onClick={() => void loadProducts()} className="self-start rounded-lg border border-rose-200/20 px-3 py-1.5 text-xs hover:bg-rose-200/5 sm:self-auto">ပြန်ကြိုးစားရန်</button></div>}

        {loading ? (
          <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-400" role="status"><LoaderCircle size={19} className="animate-spin text-cyan-200" aria-hidden="true" />စာရင်းဖွင့်နေသည်…</div>
        ) : items.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center">
            <Package size={27} className="text-slate-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-300">{search ? "ရှာဖွေမှုနှင့် ကိုက်ညီသော ကုန်ပစ္စည်း မတွေ့ပါ။" : "ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ။"}</p>
            <p className="mt-1 text-xs text-slate-500">{search ? "အမည် သို့မဟုတ် အုပ်စုကို ပြောင်းပြီး ထပ်ရှာပါ။" : "ကုန်ပစ္စည်းအသစ် ထည့်ရန် ခလုတ်ကို နှိပ်ပါ။"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((product) => (
              <article key={product.id} className="flex flex-col gap-4 rounded-xl border border-white/8 bg-[#0c1320] p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-slate-500">
                    {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} ပုံ`} className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ImageIcon size={20} aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-sm font-semibold text-white">{product.name}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLES[product.status]}`}>{STATUS_LABELS[product.status]}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">{product.category} · {product.region} · {product.productType === "DigitalCode" ? "ဒစ်ဂျစ်တယ်ကုဒ်" : "တိုက်ရိုက်ငွေဖြည့်"}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-slate-200">{formatPrice(product.finalPrice)}</span>
                      {product.flashSalePrice !== null && <span className="text-amber-200">လျှော့ဈေး {formatPrice(product.flashSalePrice)}</span>}
                      <span className="text-slate-500">လက်ကျန် {product.stockCount === -1 ? "အကန့်အသတ်မရှိ" : product.stockCount.toLocaleString("en-US")}</span>
                    </div>
                    {product.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 border-t border-white/8 pt-3 sm:border-t-0 sm:pt-0">
                  <button type="button" onClick={() => openEditDialog(product)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-200 hover:border-cyan-200/30 hover:text-cyan-100 sm:flex-none">
                    <Pencil size={14} aria-hidden="true" /> ပြင်ဆင်ရန်
                  </button>
                  <button type="button" onClick={() => void toggleVisibility(product)} disabled={busyId === product.id} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 hover:border-amber-200/25 hover:text-amber-100 disabled:cursor-wait disabled:opacity-60 sm:flex-none">
                    {busyId === product.id ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : product.status === "hidden" ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                    {product.status === "hidden" ? "ပြန်ဖော်ရန်" : "ဖျောက်ရန်"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && pages > 1 && <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">စာမျက်နှာ {page} / {pages}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} aria-label="ယခင်စာမျက်နှာ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page >= pages} aria-label="နောက်စာမျက်နှာ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        </div>}
      </section>

      {dialogOpen && <ProductDialog product={editingProduct} saving={saving} onClose={() => { if (!saving) setDialogOpen(false); }} onSave={handleSave} />}
    </div>
  );
}
