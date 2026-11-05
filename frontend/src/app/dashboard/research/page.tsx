'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { User, RacePrediction } from '@/types';
import { Compass, BookOpen, Cpu, BarChart, CheckCircle2, Award, Zap } from 'lucide-react';

export default function ResearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);

  useEffect(() => {
    fetchWithAuth('/auth/me').then(setUser).catch(console.error);
    fetchWithAuth('/analytics/predictions').then(setPredictions).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono mb-4">
            BTech Computer Science Capstone Research
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Algorithmic Architecture & Research Methodology
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-3xl">
            Investigation of continuous physiological feedback loops vs static running plans. Documenting mathematical formulas, training load models, and performance evaluation metrics.
          </p>
        </div>

        {/* Section 1: Research Question & Hypothesis */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2>Central Research Question</h2>
          </div>
          <blockquote className="p-4 rounded-lg bg-zinc-900 border-l-4 border-emerald-500 text-sm text-zinc-200 italic font-mono">
            &quot;Can an individually adaptive training system produce more accurate performance predictions and better personalised training recommendations than conventional static running plans?&quot;
          </blockquote>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Conventional marathon and 5K plans assign predetermined weekly volume irrespective of biological recovery states. When an athlete faces unforeseen fatigue or elevated stress, static schedules induce overreaching or injuries. STRIDE tests the hypothesis that dynamic impulse-response modeling (Banister TRIMP) paired with Bayesian updating minimizes training strain while maintaining progressive overload.
          </p>
        </section>

        {/* Section 2: Mathematical Formulations */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2>Core Mathematical Formulations</h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Banister TRIMP */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <div className="font-bold text-emerald-400 mb-1">1. Banister TRIMP (Training Impulse)</div>
              <div className="text-zinc-300 py-2">
                TRIMP = Duration (min) × ΔHR × 0.64 × e^(1.92 × ΔHR)
              </div>
              <div className="text-zinc-500 text-[11px] font-sans">
                Where ΔHR = (HR_avg - HR_rest) / (HR_max - HR_rest) reflects fractional heart rate reserve utilization. Exponential weighting accounts for non-linear glycogen depletion at lactate threshold.
              </div>
            </div>

            {/* EWMA ACWR */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <div className="font-bold text-cyan-400 mb-1">2. EWMA Acute:Chronic Workload Ratio (Gabbett Formulation)</div>
              <div className="text-zinc-300 py-2">
                Load_today = Load_daily × λ + Load_yesterday × (1 - λ)
              </div>
              <div className="text-zinc-500 text-[11px] font-sans">
                Acute load models 7-day fatigue decay (λ = 2 / (7 + 1) = 0.25). Chronic load models 28-day fitness accumulation (λ = 2 / (28 + 1) = 0.069). Sweet spot is 0.8 ≤ ACWR ≤ 1.3.
              </div>
            </div>

            {/* Jack Daniels VDOT */}
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <div className="font-bold text-purple-400 mb-1">3. Oxygen Kinetics (Daniels VDOT & Pete Riegel Formula)</div>
              <div className="text-zinc-300 py-2">
                T2 = T1 × (D2 / D1)^1.06
              </div>
              <div className="text-zinc-500 text-[11px] font-sans">
                Predicts race duration scaling across distances with empirical power fatigue exponent 1.06, combined with bisection root-finding over Daniels&apos; fractional VO2 utilization curves.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Model Evaluation Protocol */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <BarChart className="w-5 h-5 text-emerald-400" />
            <h2>Evaluation & Verification Framework</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="font-bold text-zinc-200 mb-1 font-mono">Prediction Accuracy Metrics</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Evaluated using Mean Absolute Error (MAE in seconds) and Root Mean Squared Error (RMSE) against ground-truth race efforts. Incorporates 90% confidence bands based on sample density.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="font-bold text-zinc-200 mb-1 font-mono">Research Ethics & Safety Disclaimer</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                STRIDE calculates workload indicators for performance conditioning. It does NOT diagnose clinical conditions, cardiac anomalies, or medical injuries.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
