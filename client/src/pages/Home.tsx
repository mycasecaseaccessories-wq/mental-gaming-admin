import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  Database,
  Gamepad2,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminUser } from "@/lib/adminAuth";
import Products from "@/pages/Products";
import Catalogs from "@/pages/Catalogs";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Transactions from "@/pages/Transactions";
import Topups from "@/pages/Topups";
import StaffAccess from "@/pages/StaffAccess";
import WalletPage from "@/pages/Wallet";
import AnalyticsPage from "@/pages/Analytics";
import SettingsPage from "@/pages/Settings";
import GatewaysPage from "@/pages/Gateways";

function isDashboardRoute(path: string): boolean { return !["/products", "/catalogs", "/orders", "/customers", "/transactions", "/topups", "/staff", "/activity", "/wallet", "/analytics", "/settings", "/gateways"].includes(path); }

type HomeProps = {
  user: AdminUser;
  onLogout: () => Promise<void>;
};

type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  available: boolean;
  permission?: string;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "အထွေထွေ",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, available: true, permission: "dashboard.view" },
      { label: "Orders", href: "/orders", icon: ClipboardList, available: true, permission: "orders.view" },
      { label: "Customers", href: "/customers", icon: Users, available: true, permission: "customers.view" },
    ],
  },
  {
    label: "ဆိုင်စီမံခန့်ခွဲမှု",
    items: [
      { label: "Products", href: "/products", icon: Package, available: true, permission: "products.view" },
      { label: "Catalogs & Images", href: "/catalogs", icon: Layers, available: true, permission: "catalogs.view" },
      { label: "Wallet", href: "/wallet", icon: Wallet, available: true, permission: "wallet.view" },
      { label: "Transactions", href: "/transactions", icon: CircleDollarSign, available: true, permission: "transactions.view" },
      { label: "Top-up Reviews", href: "/topups", icon: CreditCard, available: true, permission: "topups.view" },
    ],
  },
  {
    label: "စနစ်နှင့် လုံခြုံရေး",
    items: [
      { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined, available: true, permission: "analytics.view" },
      { label: "Staff & Roles", href: "/staff", icon: ShieldCheck, available: true, permission: "staff.manage" },
      { label: "Activity Logs", href: "/activity", icon: Activity, available: true, permission: "audit.view" },
      { label: "Payment Gateways", href: "/gateways", icon: CreditCard, available: true, permission: "settings.view" },
      { label: "Settings", href: "/settings", icon: Settings2, available: true, permission: "settings.view" },
    ],
  },
];

function SidebarItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className = `admin-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${active
    ? "is-active"
    : item.available
      ? "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
      : "cursor-not-allowed text-slate-600"}`;

  if (!item.available || !item.href) {
    return (
      <div className={className} aria-disabled="true" title="ဤ Module ကို နောက်အဆင့်တွင် ချိတ်ဆက်ပါမည်။">
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <span className="rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[9px] font-medium text-slate-600">Soon</span>
      </div>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className} aria-current={active ? "page" : undefined}>
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,.7)]" />}
    </Link>
  );
}

function MetricCard({
  label,
  description,
  icon: Icon,
  value,
  status,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  value: string;
  status: "live" | "loading" | "unavailable";
}) {
  return (
    <article className="admin-metric-card rounded-2xl border border-white/[0.07] bg-[#101827]/85 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/10 bg-cyan-200/[0.06] text-cyan-200">
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">{description}</p>
      <div className={`mt-4 flex items-center gap-1.5 text-[10px] ${status === "live" ? "text-lime-200" : "text-amber-200/80"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-lime-300" : "bg-amber-300/80"}`} />
        {status === "live" ? "Live · MongoDB" : status === "loading" ? "ဖတ်ရှုနေသည်…" : "API မရရှိသေးပါ"}
      </div>
    </article>
  );
}

export default function Home({ user, onLogout }: HomeProps) {
  const [location] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [summary, setSummary] = useState<{
    pendingOrders: number; processingOrders: number; pendingTopups: number;
    ordersToday: number; salesToday: number; totalUsers: number; walletKS: number; walletCoin: number;
  } | null>(null);
  const [summaryState, setSummaryState] = useState<"loading" | "live" | "unavailable">("loading");

  useEffect(() => {
    if (!isDashboardRoute(location)) return;
    let active = true;
    fetch("/api/admin/summary", { credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Summary unavailable");
        return await response.json() as NonNullable<typeof summary>;
      })
      .then((data) => { if (active) { setSummary(data); setSummaryState("live"); } })
      .catch(() => { if (active) { setSummary(null); setSummaryState("unavailable"); } });
    return () => { active = false; };
  }, [location]);

  const isProductsPage = location === "/products";
  const isCatalogsPage = location === "/catalogs";
  const isOrdersPage = location === "/orders";
  const isCustomersPage = location === "/customers";
  const isTransactionsPage = location === "/transactions";
  const isTopupsPage = location === "/topups";
  const isStaffPage = location === "/staff";
  const isActivityPage = location === "/activity";
  const isWalletPage = location === "/wallet";
  const isAnalyticsPage = location === "/analytics";
  const isSettingsPage = location === "/settings";
  const isGatewaysPage = location === "/gateways";
  const isDashboardPage = isDashboardRoute(location);
  const pageTitle = isProductsPage ? "Products" : isCatalogsPage ? "Catalogs & Images" : isOrdersPage ? "Orders" : isCustomersPage ? "Customers" : isTransactionsPage ? "Transactions" : isTopupsPage ? "Pending Top-ups" : isStaffPage ? "Staff & Roles" : isActivityPage ? "Activity Logs" : isWalletPage ? "Wallet" : isAnalyticsPage ? "Analytics" : isSettingsPage ? "Settings" : isGatewaysPage ? "Payment Gateways" : "Dashboard";

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

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <div className="admin-layout min-h-screen text-slate-100">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="မီနူးပိတ်ရန်"
          className="admin-mobile-backdrop fixed inset-0 z-30 bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={closeMobileNav}
        />
      )}

      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/[0.07] bg-[#0b111d] px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Gamepad2 size={21} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">MENTAL GAMING</p>
              <p className="mt-1 text-[11px] text-slate-500">Control Center</p>
            </div>
          </div>
          <button type="button" onClick={closeMobileNav} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white lg:hidden" aria-label="မီနူးပိတ်ရန်">
            <X size={18} />
          </button>
        </div>

        <div className="mt-9 rounded-xl border border-cyan-200/[0.09] bg-cyan-200/[0.035] px-3 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            ADMIN WORKSPACE
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-500">Store operations · Staff access</p>
        </div>

        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto pb-4" aria-label="Main navigation">
          {navGroups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-slate-600">{group.label}</h2>
              <div className="space-y-1">
                {group.items.filter((item) => !item.permission || user.permissions?.includes(item.permission)).map((item) => (
                  <SidebarItem
                    key={item.label}
                    item={item}
                    active={item.href === location || (item.href === "/dashboard" && isDashboardPage)}
                    onNavigate={closeMobileNav}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-300/[0.08] text-lime-200">
              <ShieldCheck size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-200">Secure session</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Email & Password</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main min-h-screen min-w-0 lg:pl-[264px]">
        <header className="admin-topbar sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.07] px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 hover:bg-white/5 lg:hidden" aria-label="မီနူးဖွင့်ရန်">
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">MENTAL GAMING / ADMIN</p>
              <h1 className="mt-0.5 truncate text-sm font-semibold text-slate-100">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 md:flex">
              <Search size={14} className="text-slate-600" />
              <span className="text-[11px] text-slate-600">Search modules</span>
              <kbd className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-slate-600">⌘ K</kbd>
            </div>
            <button type="button" disabled aria-label="အသိပေးချက်များ မကြာမီရရှိမည်" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] text-slate-500">
              <Bell size={16} />
            </button>
            <div className="hidden max-w-[190px] text-right sm:block">
              <p className="truncate text-xs font-medium text-slate-200">{user.email}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Administrator</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/15 bg-cyan-200/[0.08] text-cyan-100">
              <CircleUserRound size={17} />
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-2.5 text-xs font-medium text-slate-300 transition hover:border-rose-300/25 hover:bg-rose-300/[0.05] hover:text-rose-200 disabled:cursor-wait disabled:opacity-60 sm:px-3"
            >
              <LogOut size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{loggingOut ? "ထွက်နေသည်…" : "ထွက်ရန်"}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 xl:px-9">
          {isProductsPage ? (
            <Products />
          ) : isCatalogsPage ? (
            <Catalogs />
          ) : isOrdersPage ? (
            <Orders />
          ) : isCustomersPage ? (
            <Customers />
          ) : isTransactionsPage ? (
            <Transactions />
          ) : isTopupsPage ? (
            <Topups />
          ) : isStaffPage ? (
            <StaffAccess initialTab="staff" />
          ) : isActivityPage ? (
            <StaffAccess initialTab="activity" />
          ) : isWalletPage ? (
            <WalletPage />
          ) : isAnalyticsPage ? (
            <AnalyticsPage />
          ) : isSettingsPage ? (
            <SettingsPage />
          ) : isGatewaysPage ? (
            <GatewaysPage />
          ) : (
            <>
              <section className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200/70">OVERVIEW</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">မင်္ဂလာပါ၊ Admin</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Mental Gaming Store ရဲ့ လုပ်ငန်းဆောင်ရွက်မှုများကို ဒီနေရာမှ စီမံနိုင်ပါသည်။</p>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-lg border border-lime-300/[0.12] bg-lime-300/[0.045] px-3 py-2 text-[11px] text-lime-200">
                  <ShieldCheck size={14} />
                  လုံခြုံသော Admin Session
                </div>
              </section>

              <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store overview metrics">
                <MetricCard label="Orders Today" value={summary ? summary.ordersToday.toLocaleString("en-US") : "—"} description={summary ? `Pending ${summary.pendingOrders} · Processing ${summary.processingOrders}` : "Store API မှ ဖတ်ရှုသော အချက်အလက်"} icon={ShoppingBag} status={summaryState} />
                <MetricCard label="Customers" value={summary ? summary.totalUsers.toLocaleString("en-US") : "—"} description="MongoDB customer စုစုပေါင်း" icon={Users} status={summaryState} />
                <MetricCard label="Wallet Balance" value={summary ? `${summary.walletKS.toLocaleString("en-US")} Ks` : "—"} description={summary ? `${summary.walletCoin.toLocaleString("en-US")} Coins` : "KS နှင့် Coin လက်ကျန် စုစုပေါင်း"} icon={Wallet} status={summaryState} />
                <MetricCard label="Pending Top-ups" value={summary ? summary.pendingTopups.toLocaleString("en-US") : "—"} description="Read-only queue · Approve/Reject မဖွင့်ရသေးပါ" icon={CreditCard} status={summaryState} />
              </section>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
                <section className="admin-panel rounded-2xl border border-white/[0.07] bg-[#101827]/75 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">စနစ်အခြေအနေ</h3>
                      <p className="mt-1 text-[11px] text-slate-500">ချိတ်ဆက်မှုအခြေအနေကို အတည်ပြုပြီးမှ Live ဟု ပြသပါမည်။</p>
                    </div>
                    <span className="rounded-md border border-amber-300/[0.14] bg-amber-300/[0.05] px-2 py-1 text-[10px] text-amber-200">Setup in progress</span>
                  </div>
                  <div className="mt-5 divide-y divide-white/[0.055]">
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-200/[0.06] text-cyan-200"><Database size={15} /></span>
                        <div><p className="text-xs font-medium text-slate-200">Store API / MongoDB</p><p className="mt-1 text-[10px] text-slate-500">Orders, customers, wallets, transactions</p></div>
                      </div>
                      <span className="text-[10px] text-amber-200">ချိတ်ဆက်ရန်ကျန်</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-200/[0.06] text-violet-200"><ShieldCheck size={15} /></span>
                        <div><p className="text-xs font-medium text-slate-200">Admin permissions</p><p className="mt-1 text-[10px] text-slate-500">Staff roles and access control</p></div>
                      </div>
                      <span className="text-[10px] text-amber-200">UI ချိတ်ဆက်ရန်ကျန်</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-200/[0.06] text-lime-200"><Package size={15} /></span>
                        <div><p className="text-xs font-medium text-slate-200">Products & Catalogs</p><p className="mt-1 text-[10px] text-slate-500">Existing product management</p></div>
                      </div>
                      <span className="text-[10px] text-lime-200">လက်ရှိချိတ်ဆက်ထား</span>
                    </div>
                  </div>
                </section>

                <section className="admin-panel rounded-2xl border border-white/[0.07] bg-[#101827]/75 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">Admin Account</h3>
                      <p className="mt-1 text-[11px] text-slate-500">လက်ရှိဝင်ရောက်ထားသော အကောင့်</p>
                    </div>
                    <CircleUserRound size={18} className="text-cyan-200" />
                  </div>
                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#0b111d] p-3">
                    <p className="text-[10px] text-slate-500">EMAIL ADDRESS</p>
                    <p className="mt-1.5 break-all text-xs font-medium text-slate-200">{user.email}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                      <span className="text-[10px] text-slate-400">Session authenticated</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-5 text-slate-500">လက်ရှိ Email/Password Login ကို ဆက်လက်အသုံးပြုထားသည်။ Login စနစ်ကို မပြောင်းလဲထားပါ။</p>
                </section>
              </div>

              {logoutError && (
                <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">
                  {logoutError}
                </p>
              )}
              <p className="mt-6 text-center text-[10px] text-slate-700">MENTAL GAMING ADMIN · Phase 2 UI foundation</p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
