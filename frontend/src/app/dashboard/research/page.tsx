'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { User, RacePrediction } from '@/types';
import { BookOpen, Cpu, BarChart3, HelpCircle } from 'lucide-react';

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
            Behind the Scenes
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1c1c1a]">
            How STRIDE Works
          </h1>
          <p className="mt-2 text-sm text-[#73726d] leading-relaxed max-w-3xl">
            We keep the main dashboard simple so you know exactly what to do. For those who enjoy the science and numbers, here is how STRIDE calculates your training balance, predicts your race times, and builds your plan.
          </p>
        </div>

        {/* Section 1: The Core Philosophy */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <BookOpen className="w-5 h-5 text-[#c84b31]" />
            <h2>Why Static Plans Don&apos;t Work</h2>
          </div>
          <p className="text-xs text-[#73726d] leading-relaxed">
            Standard training plans assume every week is identical. But in real life, a poor night&apos;s sleep, a busy work schedule, or minor muscle tightness changes how much you can handle. If a static plan tells you to run fast intervals on a day your body is exhausted, you risk injury or burnout. STRIDE continuously recalculates your training stress from your real runs and lets you adapt the plan whenever you need extra recovery.
          </p>
        </section>

        {/* Section 2: Mathematical Formulations */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <Cpu className="w-5 h-5 text-[#c84b31]" />
            <h2>The Mathematics Behind the Platform</h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Banister TRIMP */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">1. Training Load (Banister TRIMP)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                Load Points = Minutes Run × Heart Rate Reserve Fraction × 0.64 × e^(1.92 × HR Fraction)
              </div>
              <div className="text-[#73726d] text-[11px] font-sans leading-relaxed">
                A 30-minute easy jog does not produce the same fatigue as a 30-minute race. The TRIMP formula (Training Impulse) weights minutes run by your heart rate, properly accounting for the exponentially higher energy cost of hard, fast running.
              </div>
            </div>

            {/* EWMA ACWR */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">2. Training Balance (Acute-to-Chronic Ratio via Exponential Decay)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                Today&apos;s Weight = New Workout × λ + Previous Base × (1 - λ)
              </div>
              <div className="text-[#73726d] text-[11px] font-sans leading-relaxed">
                We compare your recent training (past 7 days) against your long-term fitness base (past 28 days). Research in sports medicine shows that keeping this ratio between 0.8 and 1.3 provides progressive overload while minimizing injury risk.
              </div>
            </div>

            {/* Jack Daniels VDOT */}
            <div className="p-4 rounded border border-[#eae8e4] bg-[#fbfbfa]">
              <div className="font-bold text-[#1c1c1a] mb-1">3. Race Predictions (Daniels Oxygen Curves & Pete Riegel Exponents)</div>
              <div className="text-[#c84b31] py-2 font-bold">
                Predicted Time = Known Time × (Target Distance / Known Distance)^1.06
              </div>
              <div className="text-[#73726d] text-[11px] font-sans leading-relaxed">
                Rather than using a single optimistic guess, STRIDE estimates your current aerobic capacity (VDOT) from your best recent efforts, applies endurance decay for longer distances, and checks whether your weekly mileage and long runs genuinely support the target distance.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Safe Usage & Limitations */}
        <section className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#1c1c1a] font-serif font-bold">
            <BarChart3 className="w-5 h-5 text-[#c84b31]" />
            <h2>Important Note on Health & Safety</h2>
          </div>
          <div className="p-4 rounded bg-[#fbfbfa] border border-[#eae8e4] text-xs text-[#73726d] leading-relaxed">
            STRIDE is designed to assist your running consistency and pacing. Training balance calculations are mathematical guidelines, not medical diagnostics. STRIDE cannot diagnose injuries, heart conditions, or medical disorders. Always listen to your body and consult a healthcare professional if you experience sharp pain or persistent discomfort.
          </div>
        </section>
      </main>
    </div>
  );
}
