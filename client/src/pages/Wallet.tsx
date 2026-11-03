import { useEffect, useState } from "react";
import { RefreshCw, Search, Wallet } from "lucide-react";
import { fetchAdminCustomers, type AdminCustomer } from "@/lib/adminData";

const money = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value || 0);

export default function WalletPage() {
  const [items, setItems] = useState<AdminCustomer[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(nextPage = page, nextQuery = search) {
    setLoading(true); setError("");
    try {
      const data = await fetchAdminCustomers(nextPage, nextQuery);
      setItems(data.items); setPage(data.page); setPages(Math.max(1, data.pages));
    } catch (e) { setError(e instanceof Error ? e.message : "Wallet စာရင်းကို ဖတ်၍မရပါ။"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(1, ""); }, []);

  return <section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Customer balances · Read only</p><h2 className="mt-2 text-2xl font-semibold text-white">Wallet Overview</h2><p className="mt-2 text-sm text-slate-400">MongoDB Store API မှ Customer KS နှင့် Coin လက်ကျန်များကို ဖတ်ရှုထားသည်။</p></div>
      <button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:opacity-50"><RefreshCw size={15} className={loading?"animate-spin":""}/> Refresh</button>
    </div>
    <form className="mb-4 flex max-w-xl gap-2" onSubmit={e=>{e.preventDefault();setSearch(query.trim());void load(1,query.trim());}}>
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#101827] px-3"><Search size={15} className="text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Customer name, username, Telegram ID" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/></div>
      <button className="rounded-xl bg-cyan-200 px-4 text-xs font-semibold text-slate-950">Search</button>
    </form>
    {error&&<p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-4"><Wallet size={17} className="text-cyan-200"/><h3 className="text-sm font-semibold text-white">Customer Wallets</h3><span className="ml-auto text-xs text-slate-500">Page {page} / {pages}</span></div>
      {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:items.length===0?<p className="p-8 text-center text-sm text-slate-500">Wallet စာရင်း မရှိပါ။</p>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Telegram ID</th><th className="px-4 py-3">KS Balance</th><th className="px-4 py-3">Coin Balance</th><th className="px-4 py-3">Total Deposited</th><th className="px-4 py-3">Tier</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{items.map(item=><tr key={item.id} className="text-slate-300"><td className="px-4 py-3"><p>{item.name}</p><p className="mt-1 text-[10px] text-slate-500">{item.username?("@"+item.username):"—"}</p></td><td className="px-4 py-3 tabular-nums">{item.telegramId}</td><td className="px-4 py-3 font-semibold text-cyan-100">{money(item.balanceKS)} Ks</td><td className="px-4 py-3">{money(item.balanceCoin)}</td><td className="px-4 py-3">{money(item.totalDeposited)} Ks</td><td className="px-4 py-3">{item.tier}</td></tr>)}</tbody></table></div>}
      <div className="flex justify-end gap-2 border-t border-white/[0.06] p-3"><button type="button" disabled={page<=1||loading} onClick={()=>void load(page-1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Previous</button><button type="button" disabled={page>=pages||loading} onClick={()=>void load(page+1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Next</button></div>
    </div>
    <p className="mt-3 text-[11px] text-slate-600">လက်ကျန်ပြင်ဆင်ခြင်း၊ Credit/Debit နှင့် Refund လုပ်ဆောင်ချက်များကို ဤ Module တွင် မဖွင့်ထားပါ။</p>
  </section>;
}
