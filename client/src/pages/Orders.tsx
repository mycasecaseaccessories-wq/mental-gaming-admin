import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { fetchAdminOrders, type AdminOrder } from "@/lib/adminData";

const statuses = ["Pending", "Processing", "Success", "Cancelled", "Refunded", "all"];
const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} Ks`;
const date = (value: string) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function Orders() {
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState("Pending");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await fetchAdminOrders(page, status);
      setItems(result.items); setPages(Math.max(1, result.pages)); setTotal(result.total);
    } catch (e) { setError(e instanceof Error ? e.message : "Orders ဖတ်ရှု၍ မရပါ။"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [page, status]);

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Store operations</p><h2 className="mt-2 text-2xl font-semibold text-white">Orders</h2><p className="mt-2 text-sm text-slate-400">MongoDB မှ အော်ဒါစာရင်းကို ဖတ်ရှုခြင်းသာ ဖြစ်သည်။</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 hover:border-cyan-200/25 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#101827]/75 p-3">
      <label className="flex items-center gap-3 text-xs text-slate-400">Order status
        <select value={status} onChange={e => { setPage(1); setStatus(e.target.value); }} className="h-9 rounded-lg border border-white/10 bg-[#0b111d] px-3 text-xs text-slate-200">
          {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
      </label>
      <span className="text-xs text-slate-500">{total.toLocaleString("en-US")} orders</span>
    </div>
    {error && <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200"><AlertCircle size={16}/>{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p> : items.length === 0 ? <div className="p-10 text-center"><ClipboardList className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm text-slate-400">အော်ဒါ မရှိသေးပါ။</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
        <tbody className="divide-y divide-white/[0.05]">{items.map(o => <tr key={o.id} className="text-slate-300"><td className="px-4 py-3 font-mono text-cyan-100">{o.shortId || o.id.slice(-8)}</td><td className="px-4 py-3"><p>{o.user?.name ?? "Unknown"}</p><p className="mt-1 text-[10px] text-slate-600">{o.user?.username ? `@${o.user.username}` : o.user?.telegramId ?? "—"}</p></td><td className="px-4 py-3">{o.productName ?? "—"}</td><td className="px-4 py-3 tabular-nums">{money(o.amountKS)}</td><td className="px-4 py-3"><span className="rounded-md border border-white/10 px-2 py-1 text-[10px]">{o.status}</span></td><td className="px-4 py-3 text-slate-500">{date(o.timestamp)}</td></tr>)}</tbody>
      </table></div>}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={15}/></button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Next page"><ChevronRight size={15}/></button></div></div>
    </section>
  </div>;
}
