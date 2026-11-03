import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, RefreshCw } from "lucide-react";
import { fetchAdminTopups, type AdminTopup } from "@/lib/adminData";

const date=(v:string)=>new Date(v).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"});
export default function Topups(){
  const [items,setItems]=useState<AdminTopup[]>([]);
  const [page,setPage]=useState(1);
  const [pages,setPages]=useState(1);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function load(){setLoading(true);setError("");try{const r=await fetchAdminTopups(page);setItems(r.items);setPages(Math.max(1,r.pages));setTotal(r.total);}catch(e){setError(e instanceof Error?e.message:"Top-ups ဖတ်ရှု၍ မရပါ။");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[page]);
  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Finance · Read only</p><h2 className="mt-2 text-2xl font-semibold text-white">Pending Top-ups</h2><p className="mt-2 text-sm text-slate-400">စောင့်ဆိုင်းနေသော Top-up တောင်းဆိုမှုများကို ကြည့်ရှုရန်။ Approve / Reject ကို မဖွင့်ရသေးပါ။</p></div><button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:opacity-50"><RefreshCw size={15} className={loading?"animate-spin":""}/> Refresh</button></div>
    <div className="mb-4 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-4 py-3 text-xs text-amber-100/80">ဤစာမျက်နှာသည် စာရင်းကြည့်ရှုခြင်းသာ ဖြစ်သည်။ ငွေစာရင်းပြောင်းလဲစေမည့် လုပ်ဆောင်ချက်များကို ပိတ်ထားသည်။</div>
    {error&&<p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200"><AlertCircle size={16}/>{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75">
      {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:items.length===0?<div className="p-10 text-center"><CreditCard className="mx-auto text-slate-600" size={24}/><p className="mt-3 text-sm text-slate-400">Pending Top-up မရှိပါ။</p></div>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs">
        <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Amount (Ks)</th><th className="px-4 py-3">Payment method</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Proof</th></tr></thead>
        <tbody className="divide-y divide-white/[0.05]">{items.map(t=><tr key={t.id} className="text-slate-300"><td className="px-4 py-3 font-mono text-cyan-100">{t.txId??t.id.slice(-8)}</td><td className="px-4 py-3">{t.user?.name??"Unknown"}</td><td className="px-4 py-3 tabular-nums">{Math.round(t.amount).toLocaleString("en-US")}</td><td className="px-4 py-3">{t.paymentMethod??"—"}</td><td className="px-4 py-3 text-slate-500">{date(t.timestamp)}</td><td className="px-4 py-3">{t.screenshotUrl?<a href={t.screenshotUrl} target="_blank" rel="noreferrer" className="text-cyan-200 underline underline-offset-2">View proof</a>:"—"}</td></tr>)}</tbody>
      </table></div>}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500"><span>{total.toLocaleString("en-US")} pending · Page {page} / {pages}</span><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={15}/></button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronRight size={15}/></button></div></div>
    </section>
  </div>;
}
