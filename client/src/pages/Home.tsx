import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Bell,
  ChevronDown,
  CircleUserRound,
  Database,
  Gamepad2,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AdminUser } from "@/lib/adminAuth";
import Products from "@/pages/Products";
import Catalogs from "@/pages/Catalogs";

type HomeProps = {
  user: AdminUser;
  onLogout: () => Promise<void>;
};

const navigation = [
  { href: "/dashboard", label: "အနှစ်ချုပ်", en: "Overview", icon: LayoutDashboard, key: "dashboard" },
  { href: "/products", label: "ကုန်ပစ္စည်းများ", en: "Products", icon: Package, key: "products" },
  { href: "/catalogs", label: "အုပ်စုနှင့် ပုံများ", en: "Catalogs & Media", icon: Layers, key: "catalogs" },
];

export default function Home({ user, onLogout }: HomeProps) {
  const [location] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isProductsPage = location === "/products";
  const isCatalogsPage = location === "/catalogs";
  const activeKey = isProductsPage ? "products" : isCatalogsPage ? "catalogs" : "dashboard";
  const pageTitle = navigation.find((item) => item.key === activeKey)?.label ?? "အနှစ်ချုပ်";

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
    `mg-nav-entry group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
      active
        ? "border-amber-300/20 bg-amber-300/[0.09] text-amber-100 shadow-[inset_3px_0_0_#d6ad55]"
        : "border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-slate-100"
    }`;

  const navItems = navigation.map((item) => {
    const Icon = item.icon;
    const active = activeKey === item.key;
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={navLinkClass(active)}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="min-w-0 flex-1">{item.label}</span>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(214,173,85,.7)]" />}
      </Link>
    );
  });

  return (
    <div className="mg-admin-shell min-h-screen text-slate-100">
      <aside className="mg-sidebar hidden lg:flex">
        <div className="mg-brand-lockup">
          <div className="mg-brand-icon"><Gamepad2 size={23} strokeWidth={1.7} /></div>
          <div className="min-w-0">
            <p className="mg-brand-name">MENTAL GAMING</p>
            <p className="mg-brand-subtitle">ADMIN CONTROL CENTER</p>
          </div>
        </div>

        <div className="mg-nav-caption">WORKSPACE</div>
        <nav className="mg-sidebar-nav" aria-label="Admin navigation">{navItems}</nav>

        <div className="mg-sidebar-bottom">
          <div className="mg-security-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
              <ShieldCheck size={16} /> Secure admin session
            </div>
            <p>ခွင့်ပြုထားသော စီမံခန့်ခွဲသူအကောင့်ဖြင့် ဝင်ထားပါသည်။</p>
          </div>
          <div className="mg-sidebar-version"><span className="mg-live-dot" /> ADMIN PORTAL</div>
        </div>
      </aside>

      <main className="mg-main min-w-0">
        <header className="mg-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <div className="mg-mobile-brand lg:hidden">
              <span className="mg-brand-icon"><Gamepad2 size={19} /></span>
              <span className="mg-brand-name">MENTAL GAMING</span>
            </div>
            <div className="hidden lg:block">
              <p className="mg-breadcrumb">WORKSPACE <span>/</span> <strong>{pageTitle}</strong></p>
              <p className="mg-topbar-title">{pageTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="mg-session-chip hidden sm:flex"><span className="mg-live-dot" /> Session active</div>
            <button type="button" className="mg-icon-button" aria-label="Notifications" title="Notifications">
              <Bell size={17} />
              <span className="mg-notification-dot" />
            </button>
            <div className="mg-user-chip">
              <span className="mg-avatar"><CircleUserRound size={18} /></span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block max-w-[170px] truncate text-xs font-semibold text-slate-100">{user.email}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">Administrator</span>
              </span>
              <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
            </div>
            <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="mg-logout-button" aria-label="Logout">
              <LogOut size={16} /><span className="hidden sm:inline">ထွက်ရန်</span>
            </button>
          </div>
        </header>

        <div className="mg-mobile-page-title lg:hidden">
          <p className="mg-breadcrumb">WORKSPACE <span>/</span> <strong>{pageTitle}</strong></p>
          <h1>{pageTitle}</h1>
        </div>

        <div className="mg-content">
          {isProductsPage ? (
            <Products />
          ) : isCatalogsPage ? (
            <Catalogs />
          ) : (
            <>
              <section className="mg-welcome-panel">
                <div className="mg-welcome-orb" aria-hidden="true" />
                <div className="relative z-[1]">
                  <div className="mg-eyebrow"><Activity size={13} /> MANAGEMENT OVERVIEW</div>
                  <h1>Welcome back<span>.</span></h1>
                  <p>သင့်ရဲ့ Mental Gaming Store ကို တစ်နေရာတည်းမှ စီမံခန့်ခွဲနိုင်ပါပြီ။</p>
                </div>
                <div className="mg-welcome-status"><span className="mg-live-dot" /> SYSTEM ACCESS VERIFIED</div>
              </section>

              <section className="mg-section-heading">
                <div><h2>စနစ်အခြေအနေ</h2><p>လက်ရှိချိတ်ဆက်ထားသော ဝန်ဆောင်မှုများ</p></div>
                <span className="mg-updated-label">LIVE CONNECTION STATUS</span>
              </section>

              <section className="grid gap-4 md:grid-cols-2" aria-label="System status">
                <article className="mg-status-card">
                  <div className="mg-status-card-top">
                    <span className="mg-status-icon gold"><CircleUserRound size={19} /></span>
                    <span className="mg-status-pill"><span className="mg-live-dot" /> VERIFIED</span>
                  </div>
                  <p className="mg-card-label">စီမံခန့်ခွဲသူအကောင့်</p>
                  <p className="mg-card-value break-all">{user.email}</p>
                  <p className="mg-card-description">လက်ရှိအသုံးပြုနေသော ခွင့်ပြုထားသည့် Admin Session</p>
                </article>
                <article className="mg-status-card">
                  <div className="mg-status-card-top">
                    <span className="mg-status-icon blue"><Database size={19} /></span>
                    <span className="mg-status-pill"><span className="mg-live-dot" /> CONNECTED</span>
                  </div>
                  <p className="mg-card-label">Product API ချိတ်ဆက်မှု</p>
                  <p className="mg-card-value">Ready to manage</p>
                  <p className="mg-card-description">Product နှင့် Catalog စီမံခန့်ခွဲမှုစာမျက်နှာများကို အသုံးပြုနိုင်ပါသည်။</p>
                </article>
              </section>

              {logoutError && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{logoutError}</p>}

              <section className="mg-section-heading mt-9">
                <div><h2>Quick access</h2><p>နေ့စဉ်စီမံခန့်ခွဲမှုအတွက် အမြန်ဝင်ရောက်ရန်</p></div>
              </section>
              <section className="grid gap-3 sm:grid-cols-2">
                <Link href="/products" className="mg-quick-link">
                  <span className="mg-quick-icon"><Package size={20} /></span>
                  <span className="min-w-0 flex-1"><strong>ကုန်ပစ္စည်းများ</strong><small>Product စာရင်း၊ ဈေးနှုန်းနှင့် Stock</small></span>
                  <span className="mg-quick-arrow">↗</span>
                </Link>
                <Link href="/catalogs" className="mg-quick-link">
                  <span className="mg-quick-icon"><Layers size={20} /></span>
                  <span className="min-w-0 flex-1"><strong>အုပ်စုနှင့် ပုံများ</strong><small>Catalog နှင့် Media စီမံခန့်ခွဲမှု</small></span>
                  <span className="mg-quick-arrow">↗</span>
                </Link>
              </section>
              <p className="mg-honesty-note"><ShieldCheck size={15} /> Orders, Customers, Payments နှင့် Telegram Bot စာမျက်နှာများကို API ချိတ်ဆက်မှု အတည်ပြုပြီးမှ ဖွင့်ပေးပါမည်။</p>
            </>
          )}
        </div>
      </main>

      <nav className="mg-mobile-nav lg:hidden" aria-label="Mobile admin navigation">
        <Link href="/dashboard" className={activeKey === "dashboard" ? "active" : ""}><LayoutDashboard size={19} /><span>Dashboard</span></Link>
        <Link href="/products" className={activeKey === "products" ? "active" : ""}><Package size={19} /><span>Products</span></Link>
        <Link href="/catalogs" className={activeKey === "catalogs" ? "active" : ""}><Layers size={19} /><span>Catalogs</span></Link>
        <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className={mobileMenuOpen ? "active" : ""}><Menu size={19} /><span>More</span></button>
      </nav>
      {mobileMenuOpen && (
        <div className="mg-mobile-drawer lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(false)} className="mg-drawer-close"><X size={17} /> ပိတ်ရန်</button>
          <p className="mg-drawer-email">{user.email}</p>
          <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="mg-drawer-logout"><LogOut size={16} /> အကောင့်မှ ထွက်ရန်</button>
        </div>
      )}
    </div>
  );
}
