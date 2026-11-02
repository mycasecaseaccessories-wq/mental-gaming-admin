import { useEffect, useState } from "react";
import { Activity, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";

type Analytics = {
  meta: { period: string; label: string; generatedAt: string; timezone: string };
  revenue: { grossRevenue: number; refundTotal: number; netRevenue: number; orderCount: number; topups: { total: number; count: number }; refunds: { total: number; count: number } };
  users: { newUsers: number; totalUsers: number };
  gateway: Array<{ method: string; total: number; count: number }>;
  trend: Array<{ date: string; revenue: number; orders: number }>;
  cancellation: { cancelled: number; total: number; rate: number };
  accountingNote: string;
};
const money=(v:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(v||0)+" Ks";

export default function AnalyticsPage() {
  const [period,setPeriod]=useState("month");
  const [data,setData]=useState<Analytics|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function load(next=period){
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/admin/analytics?period="+encodeURIComponent(next),{credentials:"include",headers:{Accept:"application/json"},cache:"no-store"});
      const body=await response.json().catch(()=>({error:"Analytics response မရရှိပါ။"})) as Analytics&{error?:string};
      if(!response.ok)throw new Error(body.error||"Analytics မရရှိပါ။");
      setData(body);
    }catch(e){setError(e instanceof Error?e.message:"Analytics မရရှိပါ။");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load("month");},[]);
  const cards=data?[
    {label:"Gross Revenue",value:money(data.revenue.grossRevenue),icon:TrendingUp},
    {label:"Net Revenue",value:money(data.revenue.netRevenue),icon:Activity},
    {label:"Successful Orders",value:String(data.revenue.orderCount),icon:Wallet},
    {label:"New Customers",value:String(data.users.newUsers),icon:Users},
    {label:"Top-ups Completed",value:money(data.revenue.topups.total),icon:Wallet},
    {label:"Refunds",value:money(data.revenue.refundTotal),icon:Activity},
  ]:[];
  return <section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Store performance · Read only</p><h2 className="mt-2 text-2xl font-semibold text-white">Analytics</h2><p className="mt-2 text-sm text-slate-400">Store API မှာရှိသော Orders, Transactions နှင့် Customers အချက်အလက်များ။</p></div><div className="flex gap-2"><select value={period} onChange={e=>{setPeriod(e.target.value);void load(e.target.value);}} className="h-10 rounded-xl border border-white/10 bg-[#101827] px-3 text-xs text-slate-200"><option value="today">Today (MMT)</option><option value="yesterday">Yesterday (MMT)</option><option value="week">Last 7 Days</option><option value="month">Last 30 Days</option></select><button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-200 disabled:opacity-50"><RefreshCw size={14} className={loading?"animate-spin":""}/> Refresh</button></div></div>
    {error&&<p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">{error}</p>}
    {loading&&!data?<p className="rounded-2xl border border-white/[0.07] p-8 text-center text-sm text-slate-500">Analytics ဖတ်ရှုနေသည်…</p>:data&&<><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=>{const Icon=card.icon;return <article key={card.label} className="rounded-2xl border border-white/[0.07] bg-[#101827]/80 p-4"><div className="flex items-center justify-between"><p className="text-xs text-slate-400">{card.label}</p><Icon size={17} className="text-cyan-200"/></div><p className="mt-3 text-xl font-semibold text-white">{card.value}</p></article>;})}</div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)]"><section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101827]/75"><div className="border-b border-white/[0.07] px-4 py-4"><h3 className="text-sm font-semibold text-white">Daily Revenue Trend</h3><p className="mt-1 text-xs text-slate-500">{data.meta.label} · Asia/Rangoon</p></div>{data.trend.length===0?<p className="p-8 text-center text-sm text-slate-500">ရွေးထားသောကာလအတွင်း Success Order မရှိပါ။</p>:<div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead className="text-[10px] uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{data.trend.map(row=><tr key={row.date} className="text-slate-300"><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.orders}</td><td className="px-4 py-3 font-semibold text-cyan-100">{money(row.revenue)}</td></tr>)}</tbody></table></div>}</section>
    <section className="rounded-2xl border border-white/[0.07] bg-[#101827]/75 p-4"><h3 className="text-sm font-semibold text-white">Payment Method Mix</h3><div className="mt-4 space-y-3">{data.gateway.length===0?<p className="text-xs text-slate-500">Payment data မရှိသေးပါ။</p>:data.gateway.map(row=><div key={row.method} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-300">{row.method}</span><span className="text-right text-slate-400">{money(row.total)} · {row.count} tx</span></div>)}</div><div className="mt-5 border-t border-white/[0.06] pt-4 text-xs text-slate-400">Cancellation rate <strong className="ml-2 text-white">{data.cancellation.rate}%</strong><p className="mt-1 text-[10px] text-slate-600">{data.cancellation.cancelled} of {data.cancellation.total} orders</p></div></section></div>
    <p className="mt-4 rounded-xl border border-amber-200/10 bg-amber-200/[0.04] p-3 text-xs leading-5 text-amber-100/80">{data.accountingNote}</p><p className="mt-2 text-[10px] text-slate-600">Updated: {new Date(data.meta.generatedAt).toLocaleString("en-GB")} · All date filters use Myanmar time where applicable.</p></>}
  </section>;
}
