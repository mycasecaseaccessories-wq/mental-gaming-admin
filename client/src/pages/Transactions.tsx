import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, ReceiptText } from "lucide-react";
import { fetchAdminTransactions, type AdminTransaction } from "@/lib/adminData";

const types = ["all", "Topup", "Refund", "AdminCredit", "AdminDebit"];
const statuses = ["all", "Pending", "Completed", "Rejected"];
const date = (v: string) => new Date(v).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function Transactions() {
  const [items,setItems]=useState<AdminTransaction[]>([]);
  const [type,setType]=useState("all");
  const [status,setStatus]=useState("all");
  const [page,setPage]=useState(1);
  const [pages,setPages]=useState(1);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function load(){setLoading(true);setError("");try{const r=await fetchAdminTransactions(page,type,status);setItems(r.items);setPages(Math.max(1,r.pages));setTotal(r.total);}catch(e){setError(e instanceof Error?e.message:"Transactions ဖတ်ရှု၍ မရပါ။");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[page,type,status]);
  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Finance · Read only</p><h2 className="mt-2 text-2xl font-semibold text-white">Transactions</h2><p className="mt-2 text-sm text-slate-400">Transaction ledger ကို ဖတ်ရှုရန်သာ ဖြစ်သည်။</p></div><button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:opacity-50"><RefreshCw size={15} className={loading?"animate-spin":""}/> Refresh</button></div>
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-[#101827]/75 p-3">
      <label className="flex items-center gap-2 text-xs text-slate-400">Type <select value={type} onChange={e=>{setPage(1);setType(e.target.value);}} className="h-9 rounded-lg border border-white/10 bg-[#0b111d] px-3 text-xs text-slate-200">{types.map(v=><option key={v} value={v}>{v==="all"?"All types":v}</option>)}</select></label>
      <label className="flex items-center gap-2 text-xs text-slate-400">Status <select value={status} onChange={e=>{setPage(1);setStatus(e.target.value);}} className="h-9 rounded-lg border border-white/10 bg-[#0b111d] px-3 text-xs text-slate-200">{statuses.map(v=><option key={v} value={v}>{v==="all"?"All statuses":v}</option>)}</select></label>
      <span className="ml-auto text-xs text-slate-500">{total.toLocaleString("en-US")} records</span>
    </div>
    {error&&<p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200"><AlertCircle size={16}/>{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75">
      {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:items.length===0?<div className="p-10 text-center"><ReceiptText className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm text-slate-400">Transaction မတွေ့ပါ။</p></div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Transaction</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount (Ks)</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
        <tbody className="divide-y divide-white/[0.05]">{items.map(t=><tr key={t.id} className="text-slate-300"><td className="px-4 py-3 font-mono text-cyan-100">{t.txId??t.id.slice(-8)}</td><td className="px-4 py-3">{t.user?.name??"Unknown"}</td><td className="px-4 py-3">{t.type}</td><td className="px-4 py-3 tabular-nums">{Math.round(t.amount).toLocaleString("en-US")}</td><td className="px-4 py-3">{t.paymentMethod??"—"}</td><td className="px-4 py-3">{t.status}</td><td className="px-4 py-3 text-slate-500">{date(t.timestamp)}</td></tr>)}</tbody>
      </table></div>}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500"><span>Page {page} / {pages}</span><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={15}/></button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Next page"><ChevronRight size={15}/></button></div></div>
    </section>
  </div>;
}
