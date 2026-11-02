import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import {
  AdminAuthError,
  fetchAdminUser,
  logoutAdmin,
  type AdminUser,
} from "@/lib/adminAuth";
import { Gamepad2, LoaderCircle, RotateCw } from "lucide-react";

type AuthState = "checking" | "signed-out" | "signed-in" | "setup-required" | "unavailable";

function StatusPage({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <main className="status-page flex min-h-screen items-center justify-center px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827]/90 p-8 text-center shadow-2xl">
        <div className="brand-mark mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Gamepad2 size={25} strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <RotateCw size={16} aria-hidden="true" />
            ထပ်မံစစ်ဆေးရန်
          </button>
        )}
      </section>
    </main>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);

  const refreshSession = useCallback(async () => {
    setAuthState("checking");
    try {
      const currentUser = await fetchAdminUser();
      setUser(currentUser);
      setAuthState(currentUser ? "signed-in" : "signed-out");
    } catch (error) {
      setUser(null);
      if (error instanceof AdminAuthError && error.status === 503) {
        setAuthState("setup-required");
      } else {
        setAuthState("unavailable");
      }
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (authState === "signed-in" && location === "/login") {
      setLocation("/dashboard");
    } else if (authState === "signed-out" && (["/dashboard", "/products", "/catalogs", "/orders", "/customers", "/transactions", "/topups", "/staff", "/activity"].includes(location))) {
      setLocation("/login");
    }
  }, [authState, location, setLocation]);

  async function handleLogout() {
    await logoutAdmin();
    setUser(null);
    setAuthState("signed-out");
    setLocation("/login");
  }

  if (authState === "checking") {
    return (
      <main className="status-page flex min-h-screen items-center justify-center text-white">
        <div className="flex items-center gap-3 text-sm text-slate-300" role="status">
          <LoaderCircle size={18} className="animate-spin text-cyan-300" aria-hidden="true" />
          Login အခြေအနေကို စစ်ဆေးနေသည်…
        </div>
      </main>
    );
  }

  if (authState === "setup-required") {
    return (
      <StatusPage
        title="Admin ဝင်ရန်လိုအပ်သော ဆက်တင်များ မပြည့်စုံသေးပါ"
        message="Admin email နှင့် လျှို့ဝှက်ဆက်တင်များကို project ရဲ့ protected environment settings ထဲ ဖြည့်ပြီးမှ ဝင်နိုင်ပါမယ်။"
      />
    );
  }

  if (authState === "unavailable") {
    return (
      <StatusPage
        title="Server သို့ ချိတ်ဆက်၍ မရပါ"
        message="အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။"
        onRetry={() => void refreshSession()}
      />
    );
  }

  const knownPath = ["/", "/login", "/dashboard", "/products", "/catalogs", "/orders", "/customers", "/transactions", "/topups", "/staff", "/activity", "/wallet", "/analytics", "/settings"].includes(location);
  if (!knownPath) {
    return (
      <StatusPage
        title="စာမျက်နှာ မတွေ့ပါ"
        message="ဤ admin စာမျက်နှာ မရှိပါ။"
        onRetry={() => setLocation(authState === "signed-in" ? "/dashboard" : "/login")}
      />
    );
  }

  if (authState === "signed-in" && user) {
    return <Home user={user} onLogout={handleLogout} />;
  }

  return (
    <Login
      onLogin={(authenticatedUser) => {
        setUser(authenticatedUser);
        setAuthState("signed-in");
        setLocation("/dashboard");
      }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
