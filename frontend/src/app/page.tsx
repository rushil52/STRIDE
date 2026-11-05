import Link from 'next/link';
import { Flame, Activity, Zap, TrendingUp, Cpu, ArrowRight, ShieldCheck, Database } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono tracking-wider">STRIDE</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=register"
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            BTech Computer Science Research & Performance Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-100 max-w-4xl mx-auto leading-[1.1]">
            The Adaptive AI Running Coach
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Conventional apps track history with static training plans. STRIDE applies impulse-response physiology, Banister TRIMP, and continuous Bayesian adaptation to predict race outcomes and personalize training microcycles.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?tab=register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-base hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Get Started with STRIDE
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/research"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-medium text-base hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              Read Research Formulation
            </Link>
          </div>
        </div>
      </section>

      {/* Core Research Capabilities */}
      <section className="py-20 border-t border-zinc-900 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Physiological Intelligence Meets Machine Learning
            </h2>
            <p className="mt-3 text-zinc-400 text-sm">
              Formulated around the core research question: Can continuous biological feedback models outperform static training regimens?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">EWMA Acute-Chronic Load</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Applies Gabbett&apos;s Exponentially Weighted Moving Average (EWMA) on Banister TRIMP to model fatigue decay (7-day acute) and fitness accumulation (28-day chronic).
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Calibrated ML Prediction</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Ensemble of Jack Daniels VDOT oxygen kinetics and Pete Riegel formulas, modulated by historical mileage adequacy and 90% uncertainty margins.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Adaptive Microcycle Engine</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Dynamically contracts or expands weekly mileage and workouts based on ACWR sweet spots (0.8 - 1.3) and athlete perceived exertion (RPE).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-900 text-center text-xs text-zinc-600 font-mono">
        STRIDE Running Engine • Research & Software Engineering Project • 2026
      </footer>
    </div>
  );
}
