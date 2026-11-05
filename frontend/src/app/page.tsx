import Link from 'next/link';
import { ArrowRight, Activity, TrendingUp, Calendar, Compass, ShieldCheck, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col justify-between selection:bg-[#c84b31]/10 selection:text-[#c84b31]">
      {/* Editorial Header */}
      <header className="border-b border-[#eae8e4] bg-[#ffffff]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-serif tracking-tight text-[#1c1c1a]">STRIDE</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#f4f3ef] text-[#73726d] font-semibold">
              Performance Platform
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm font-medium text-[#73726d] hover:text-[#1c1c1a] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=register"
              className="px-4 py-2 rounded bg-[#1c1c1a] text-[#ffffff] text-sm font-medium hover:bg-[#333330] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Editorial Hero */}
      <main className="flex-1">
        <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
          <div className="space-y-6 max-w-3xl">
            <div className="text-xs font-mono tracking-widest uppercase text-[#c84b31] font-semibold">
              Adaptive Intelligence for Endurance Runners
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-normal tracking-tight text-[#1c1c1a] leading-[1.15]">
              Train with a clearer picture of what&apos;s ahead.
            </h1>

            <p className="text-lg sm:text-xl text-[#73726d] font-normal leading-relaxed max-w-2xl">
              Static training schedules assume everyday consistency. STRIDE continuously interprets your training load, evaluates physiological adaptation, and predicts your next race outcome with calculated confidence.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/login?tab=register"
                className="px-6 py-3 rounded bg-[#c84b31] text-[#ffffff] font-medium text-sm hover:bg-[#b03e26] transition-all flex items-center justify-center gap-2"
              >
                Start Training with STRIDE
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/research"
                className="px-6 py-3 rounded border border-[#eae8e4] bg-[#ffffff] text-[#1c1c1a] font-medium text-sm hover:bg-[#f4f3ef] transition-all flex items-center justify-center"
              >
                Methodology & Model Architecture
              </Link>
            </div>
          </div>
        </section>

        {/* Live System Preview Teaser */}
        <section className="px-6 max-w-6xl mx-auto pb-20">
          <div className="rounded-xl border border-[#eae8e4] bg-[#ffffff] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#eae8e4] gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#73726d]">Platform Cockpit</span>
                <h3 className="text-xl font-serif font-bold text-[#1c1c1a] mt-0.5">Continuous Training Architecture</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#73726d]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Gabbett EWMA</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c84b31]" /> Daniels VDOT Kinetics</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">Fatigue vs Fitness</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">1.05 ACWR</div>
                <div className="text-xs text-[#10b981] font-medium mt-1">Optimal Progressive Overload</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  Decays acute fatigue across 7 days while tracking 28-day fitness accumulation via exponential moving averages.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">5K Target Projection</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">21:42</div>
                <div className="text-xs text-[#73726d] font-mono mt-1">90% Range: 21:05 - 22:15</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  Blends oxygen utilization curves with Pete Riegel power decay, calibrated to recent mileage adequacy.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">Adaptive Microcycle</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">38.5 km / wk</div>
                <div className="text-xs text-[#c84b31] font-medium mt-1">Constrained Pacing Modulations</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  Restructures upcoming workouts automatically whenever acute strain exceeds recovery thresholds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Narrative Grid */}
        <section className="border-t border-[#eae8e4] bg-[#ffffff] py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#1c1c1a]">Designed for intentional training.</h2>
              <p className="text-sm text-[#73726d] mt-2">Every feature serves athlete longevity and progressive conditioning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Strava & File Telemetry</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Connect your Strava athlete profile via OAuth 2.0 or upload GPX/FIT track files directly. Heart rate, cadence, and splits are normalized immediately.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Calibrated Projections</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Performance predictions are presented with statistical confidence intervals based on your consistency and long-run foundation.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Adaptive Microcycles</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Plans dynamically adjust volume and target paces when your subjective fatigue (RPE) or workload ratio flags elevated strain.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Understated Editorial Footer */}
      <footer className="border-t border-[#eae8e4] bg-[#fbfbfa] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#73726d]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1c1c1a]">STRIDE</span>
            <span>• Personal Running Performance Platform</span>
          </div>
          <div>
            Built with rigorous exercise physiology and machine learning principles.
          </div>
        </div>
      </footer>
    </div>
  );
}
