'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { User, RacePrediction } from '@/types';
import { BookOpen, Cpu, BarChart3, AlertCircle } from 'lucide-react';

export default function MethodologyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);

  useEffect(() => {
    fetchWithAuth('/auth/me').then(setUser).catch(console.error);
    fetchWithAuth('/analytics/predictions').then(setPredictions).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#c84b31] font-semibold mb-2">
            Technical Architecture & Sports Science
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1c1c1a]">
            Algorithmic Foundations & Methodology
          </h1>
          <p className="mt-2 text-sm text-[#73726d] leading-relaxed max-w-3xl">
            Documentation of the physiological models, workload calculation algorithms, and statistical uncertainty bands powering STRIDE.
          </p>
        </div>

        {/* Section 1: System Vision */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <BookOpen className="w-5 h-5 text-[#c84b31]" />
            <h2>Adaptive Feedback Architecture</h2>
          </div>
          <p className="text-xs text-[#73726d] leading-relaxed">
            Conventional marathon and endurance training plans enforce rigid static schedules. When an athlete encounters unexpected life fatigue, disrupted sleep, or biological strain, static progression often precipitates overreaching or forced deloads. STRIDE continuously recalculates workload strain via impulse-response modeling, providing adaptive recommendations that balance progressive stimulus against systemic fatigue.
          </p>
        </section>

        {/* Section 2: Mathematical Formulations */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <Cpu className="w-5 h-5 text-[#c84b31]" />
            <h2>Physiological Formulas & Parameters</h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Banister TRIMP */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">1. Banister TRIMP (Training Impulse)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                TRIMP = Duration (min) × ΔHR × 0.64 × e^(1.92 × ΔHR)
              </div>
              <div className="text-[#73726d] text-[11px] font-sans">
                Where ΔHR = (HR_avg - HR_rest) / (HR_max - HR_rest) reflects fractional heart rate reserve utilization. The non-linear exponential weighting accounts for rapid lactate accumulation and glycogen depletion at higher aerobic intensities.
              </div>
            </div>

            {/* EWMA ACWR */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">2. EWMA Acute:Chronic Workload Ratio (Gabbett Formulation)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                Load_today = Load_daily × λ + Load_yesterday × (1 - λ)
              </div>
              <div className="text-[#73726d] text-[11px] font-sans">
                Acute load models 7-day fatigue decay (λ = 2 / (7 + 1) = 0.25). Chronic load models 28-day fitness accumulation (λ = 2 / (28 + 1) = 0.069). Gabbett&apos;s sweet spot is observed between 0.8 ≤ ACWR ≤ 1.3.
              </div>
            </div>

            {/* Jack Daniels VDOT */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">3. Endurance Power Decay (Jack Daniels VDOT & Pete Riegel Formula)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                T2 = T1 × (D2 / D1)^1.06
              </div>
              <div className="text-[#73726d] text-[11px] font-sans">
                Predicts race duration scaling across distances with empirical power fatigue exponent 1.06, combined with bisection root-finding over Daniels&apos; fractional VO2 utilization curves and volume penalties for under-prepared distances.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Safe Usage & Limitations */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <BarChart3 className="w-5 h-5 text-[#c84b31]" />
            <h2>Clinical Disclaimer & Boundaries</h2>
          </div>
          <div className="p-4 rounded bg-[#fbfbfa] border border-[#eae8e4] text-xs text-[#73726d] leading-relaxed">
            STRIDE is an athletic training analytics platform designed for endurance conditioning and performance projections. Training load metrics (such as TRIMP and ACWR) are mathematical heuristics to assist personal workout planning. STRIDE does not diagnose injuries, heart conditions, overtraining syndrome, or any medical disorder. Runners experiencing persistent pain or physiological distress should seek consultation from qualified medical professionals.
          </div>
        </section>
      </main>
    </div>
  );
}
