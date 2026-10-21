import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="status-page flex min-h-screen items-center justify-center px-5 py-10 text-white">
          <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827]/90 p-8 text-center shadow-2xl">
            <h1 className="text-xl font-semibold">စာမျက်နှာကို ဖွင့်၍ မရပါ</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">ပြဿနာဖြစ်ပွားခဲ့ပါသည်။ စာမျက်နှာကို ပြန်လည်စတင်ပါ။</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
            >
              ပြန်လည်စတင်ရန်
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
