import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, Users } from "lucide-react";
import { fetchAdminCustomers, type AdminCustomer } from "@/lib/adminData";

const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} Ks`;
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default function Customers() {
  const [items, setItems] = useState<AdminCustomer[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const result = await fetchAdminCustomers(page, search); setItems(result.items); setPages(Math.max(1,result.pages)); setTotal(result.total); }
    catch(e) { setError(e instanceof Error ? e.message : "Customers ဖတ်ရှု၍ မရပါ။"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [page, search]);

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Store operations</p><h2 className="mt-2 text-2xl font-semibold text-white">Customers</h2><p className="mt-2 text-sm text-slate-400">Customer profile နှင့် Wallet လက်ကျန်များကို read-only ကြည့်ရှုရန်။</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 hover:border-cyan-200/25 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </div>
    <form onSubmit={e=>{e.preventDefault();setPage(1);setSearch(q.trim());}} className="mb-4 flex gap-2 rounded-xl border border-white/[0.07] bg-[#101827]/75 p-3">
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#0b111d] px-3"><Search size={15} className="shrink-0 text-slate-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search username or Telegram ID" className="min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"/></div>
      <button className="rounded-lg bg-cyan-200 px-4 text-xs font-semibold text-slate-950">Search</button>
    </form>
    {error && <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200"><AlertCircle size={16}/>{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p> : items.length===0 ? <div className="p-10 text-center"><Users className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm text-slate-400">Customer မတွေ့ပါ။</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Telegram ID</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Wallet KS</th><th className="px-4 py-3">Coins</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th></tr></thead>
        <tbody className="divide-y divide-white/[0.05]">{items.map(u=><tr key={u.id} className="text-slate-300"><td className="px-4 py-3"><p>{u.name}</p><p className="mt-1 text-[10px] text-slate-600">{u.username ? `@${u.username}` : "—"}</p></td><td className="px-4 py-3 font-mono">{u.telegramId}</td><td className="px-4 py-3">{u.tier}</td><td className="px-4 py-3 tabular-nums">{money(u.balanceKS)}</td><td className="px-4 py-3 tabular-nums">{u.balanceCoin.toLocaleString("en-US")}</td><td className="px-4 py-3 text-slate-500">{date(u.joinedAt)}</td><td className="px-4 py-3"><span className={u.isBlocked ? "text-rose-300" : "text-lime-200"}>{u.isBlocked ? "Blocked" : "Active"}</span></td></tr>)}</tbody>
      </table></div>}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500"><span>{total.toLocaleString("en-US")} customers · Page {page} / {pages}</span><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={15}/></button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Next page"><ChevronRight size={15}/></button></div></div>
    </section>
  </div>;
}
