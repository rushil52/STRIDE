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
              Running
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
              Personalized Training for Everyday Runners
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-normal tracking-tight text-[#1c1c1a] leading-[1.15]">
              Train with a clearer picture of what&apos;s ahead.
            </h1>

            <p className="text-lg sm:text-xl text-[#73726d] font-normal leading-relaxed max-w-2xl">
              Traditional training plans are static and don&apos;t know when you&apos;re tired. STRIDE learns from your past runs, predicts your next race time, and automatically adjusts your weekly plan so you stay consistent and healthy.
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
                How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* Live System Preview Teaser */}
        <section className="px-6 max-w-6xl mx-auto pb-20">
          <div className="rounded-xl border border-[#eae8e4] bg-[#ffffff] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#eae8e4] gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#73726d]">At a Glance</span>
                <h3 className="text-xl font-serif font-bold text-[#1c1c1a] mt-0.5">Your Training, Understood</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#73726d]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Balanced Training</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c84b31]" /> Race Projections</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">Training Balance</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">Optimal Balance</div>
                <div className="text-xs text-[#10b981] font-medium mt-1">Healthy Training Zone</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  Compares how much you&apos;ve run in the past week to your last month of training to make sure you don&apos;t do too much too soon.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">Predicted 5K Time</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">21:42</div>
                <div className="text-xs text-[#73726d] font-mono mt-1">Likely Range: 21:05 – 22:15</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  Calculated from your recent paces, workout frequency, and longest runs so you know exactly where your fitness stands.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#fbfbfa] border border-[#eae8e4]">
                <div className="text-xs font-mono text-[#73726d] uppercase">This Week&apos;s Plan</div>
                <div className="text-2xl font-bold font-serif text-[#1c1c1a] mt-2">38.5 km planned</div>
                <div className="text-xs text-[#c84b31] font-medium mt-1">Adapts when you&apos;re tired</div>
                <p className="text-xs text-[#73726d] mt-3 leading-relaxed">
                  When life happens or your legs feel heavy, STRIDE adjusts your upcoming runs so you don&apos;t burn out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Narrative Grid */}
        <section className="border-t border-[#eae8e4] bg-[#ffffff] py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#1c1c1a]">Designed for real runners.</h2>
              <p className="text-sm text-[#73726d] mt-2">Simple guidance on the surface. Real training science underneath.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Sync from Strava or Files</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Link your Strava account with one click or upload standard GPX/FIT watch files. We automatically read your distance, pace, and heart rate.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Honest Race Predictions</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Instead of one rigid number, STRIDE gives you a realistic target time with a confidence range based on your recent long runs and consistency.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-9 h-9 rounded bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#c84b31]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-base text-[#1c1c1a]">Flexible Weekly Schedules</h4>
                <p className="text-xs text-[#73726d] leading-relaxed">
                  Tell STRIDE how tired you feel after tough days. Your schedule recalculates to protect your recovery and keep you progressing safely.
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
            <span>• Built for runners who want to train smarter.</span>
          </div>
          <div>
            Clear guidance. Measured progression. No guesswork.
          </div>
        </div>
      </footer>
    </div>
  );
}
