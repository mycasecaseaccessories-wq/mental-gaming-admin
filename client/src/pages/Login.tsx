import { useState, type FormEvent } from "react";
import { Gamepad2, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AdminAuthError, loginAdmin, type AdminUser } from "@/lib/adminAuth";

type LoginProps = {
  onLogin: (user: AdminUser) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await loginAdmin(email, password);
      setPassword("");
      onLogin(user);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        setError(err.message);
      } else {
        setError("ချိတ်ဆက်မှု မအောင်မြင်ပါ။ ခဏစောင့်ပြီး ပြန်ကြိုးစားပါ။");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page min-h-screen px-5 py-10 text-white">
      <div className="login-grid" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <section className="login-card w-full max-w-[430px] rounded-[28px] border border-white/10 bg-[#111827]/90 p-7 shadow-2xl shadow-black/40 sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Gamepad2 size={25} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">MENTAL GAMING</p>
              <p className="mt-1 text-sm text-slate-400">Admin စီမံခန့်ခွဲမှု</p>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs text-lime-200">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              လုံခြုံသော Admin ဝင်ပေါက်
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin အကောင့်ဝင်ရန်</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              သတ်မှတ်ထားသော Gmail လိပ်စာနှင့် ဒီ website အတွက် သီးခြား password ကိုသုံးပါ။
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-200">Gmail လိပ်စာ</label>
              <div className="input-shell flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 focus-within:border-cyan-300/70 focus-within:ring-2 focus-within:ring-cyan-300/10">
                <Mail size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@gmail.com"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-200">Website password</label>
              <div className="input-shell flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 focus-within:border-cyan-300/70 focus-within:ring-2 focus-within:ring-cyan-300/10">
                <LockKeyhole size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
                <input
                  id="admin-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="သီးခြားသတ်မှတ်ထားသော password"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Gmail account ရဲ့ မူရင်း password မဟုတ်ပါ။</p>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-5 text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition duration-200 hover:bg-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
              {busy ? "စစ်ဆေးနေသည်…" : "Admin အဖြစ် ဝင်မည်"}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-white/8 pt-5 text-xs leading-5 text-slate-500">
            <LockKeyhole size={15} className="mt-0.5 shrink-0 text-cyan-300/70" aria-hidden="true" />
            <p>ခွင့်ပြုထားသော admin အကောင့်သာ ဝင်နိုင်သည်။ Gmail password ကို ဒီ website မသုံးပါ။</p>
          </div>
        </section>
      </div>
    </main>
  );
}
