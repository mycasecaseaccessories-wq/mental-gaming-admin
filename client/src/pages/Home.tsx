import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CircleUserRound,
  Database,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
} from "lucide-react";
import type { AdminUser } from "@/lib/adminAuth";
import Products from "@/pages/Products";

type HomeProps = {
  user: AdminUser;
  onLogout: () => Promise<void>;
};

export default function Home({ user, onLogout }: HomeProps) {
  const [location] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const isProductsPage = location === "/products";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await onLogout();
    } catch {
      setLogoutError("ထွက်ခွာမှု မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။");
    } finally {
      setLoggingOut(false);
    }
  }

  const navLinkClass = (active: boolean) =>
    `nav-entry flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${active
      ? "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100"
      : "border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.035] hover:text-slate-200"}`;

  return (
    <div className="dashboard-shell min-h-screen text-slate-100">
      <aside className="dashboard-sidebar flex flex-col border-r border-white/8 bg-[#0b101c] px-4 py-5">
        <div className="flex items-center gap-3 px-2">
          <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Gamepad2 size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">MENTAL GAMING</p>
            <p className="mt-1 text-xs text-slate-500">Admin စီမံခန့်ခွဲမှု</p>
          </div>
        </div>

        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">စနစ်</div>
        <nav className="mt-3 space-y-1" aria-label="ပင်မမီနူး">
          <Link href="/dashboard" className={navLinkClass(!isProductsPage)} aria-current={!isProductsPage ? "page" : undefined}>
            <LayoutDashboard size={17} aria-hidden="true" />
            အနှစ်ချုပ်
            {!isProductsPage && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-200" />}
          </Link>
          <Link href="/products" className={navLinkClass(isProductsPage)} aria-current={isProductsPage ? "page" : undefined}>
            <Package size={17} aria-hidden="true" />
            ကုန်ပစ္စည်းများ
            {isProductsPage && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-200" />}
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.45)]" />
            စီမံခန့်ခွဲသူ အကောင့်အသုံးပြုနေသည်
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">ကြိုတင်ခွင့်ပြုထားသော အကောင့်အတွက်သာ။</p>
        </div>
      </aside>

      <main className="dashboard-main min-w-0">
        <header className="dashboard-topbar flex min-h-[76px] items-center justify-between border-b border-white/8 px-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {isProductsPage ? <Package size={16} className="text-cyan-200" aria-hidden="true" /> : <LayoutDashboard size={16} className="text-cyan-200" aria-hidden="true" />}
            <span>{isProductsPage ? "ကုန်ပစ္စည်းများ" : "အနှစ်ချုပ်"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[220px] truncate text-sm font-medium text-slate-200">{user.email}</p>
              <p className="mt-1 text-[11px] text-slate-500">စီမံခန့်ခွဲသူ</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/15 bg-cyan-200/10 text-cyan-100">
              <CircleUserRound size={18} aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:border-rose-300/30 hover:bg-rose-300/5 hover:text-rose-200 disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut size={15} aria-hidden="true" />
              <span className="hidden sm:inline">ထွက်ရန်</span>
            </button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          {isProductsPage ? (
            <Products />
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-cyan-200/80">စီမံခန့်ခွဲမှု အနှစ်ချုပ်</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Mental Gaming</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">စီမံခန့်ခွဲသူအဖြစ် ဝင်ရောက်ခွင့် အတည်ပြုပြီးပါပြီ။ ဤစာမျက်နှာသည် ဆိုင်မျက်နှာစာနှင့် သီးခြားစီမံခန့်ခွဲရေးနေရာ ဖြစ်သည်။</p>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-full border border-lime-300/15 bg-lime-300/[0.06] px-3 py-2 text-xs font-medium text-lime-200">
                  <ShieldCheck size={15} aria-hidden="true" />
                  ဝင်ခွင့် အတည်ပြုပြီး
                </div>
              </div>

              <section className="grid gap-4 md:grid-cols-2" aria-label="စနစ်အခြေအနေ">
                <article className="overview-card rounded-2xl border border-white/8 bg-[#111827]/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-300">ဝင်ထားသော စီမံခန့်ခွဲသူအကောင့်</p>
                      <p className="mt-3 break-all text-lg font-semibold text-white">{user.email}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">လက်ရှိ session အတွက် ခွင့်ပြုထားသော အကောင့်။</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/10 text-cyan-200">
                      <CircleUserRound size={18} aria-hidden="true" />
                    </span>
                  </div>
                </article>

                <article className="overview-card rounded-2xl border border-white/8 bg-[#111827]/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-300">ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု</p>
                      <p className="mt-3 text-lg font-semibold text-lime-200">ချိတ်ဆက်ပြီး</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">ထုတ်ကုန်များကို စာရင်းကြည့်ရှုခြင်း၊ ထည့်သွင်းခြင်းနှင့် ပြင်ဆင်ခြင်းတို့ကို ဆောင်ရွက်နိုင်ပါသည်။</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/15 bg-violet-200/10 text-violet-200">
                      <Database size={18} aria-hidden="true" />
                    </span>
                  </div>
                </article>
              </section>

              {logoutError && (
                <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
                  {logoutError}
                </p>
              )}

              <section className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.018] px-5 py-7 sm:px-6">
                <p className="text-sm font-medium text-slate-200">ချိတ်ဆက်ထားသော စီမံခန့်ခွဲမှု</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">ကုန်ပစ္စည်းများကို ဘေးဘက်မီနူးမှ စီမံနိုင်ပါသည်။ Orders နှင့် users စာရင်းများကို မချိတ်ဆက်ရသေးသောကြောင့် ၎င်းတို့၏ အချက်အလက်များကို ဤနေရာတွင် ပြသမည်မဟုတ်ပါ။</p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
