'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { TrainingPlan, User } from '@/types';
import { Calendar, RefreshCw, Sliders, AlertCircle, CheckCircle, Zap } from 'lucide-react';

export default function PlanPage() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [fatigueScore, setFatigueScore] = useState(7);

  const loadData = async () => {
    try {
      const [u, p] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/analytics/plan'),
      ]);
      setUser(u);
      setPlan(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdapt = async () => {
    setAdapting(true);
    try {
      const adapted = await fetchWithAuth(`/analytics/plan/adapt?perceived_fatigue_score=${fatigueScore}`, {
        method: 'POST',
      });
      setPlan(adapted);
    } catch (e) {
      console.error(e);
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Adaptive Microcycle Optimizer
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Dynamic 7-day training schedule generated from physiological load metrics and Bayesian feedback calibration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Target Distance:</span>
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono text-xs font-bold">
              {plan?.target_race_distance || '5K'}
            </span>
          </div>
        </div>

        {/* Bayesian Fatigue Feedback Re-optimizer */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Bayesian Feedback Tuning (Athlete Subjective State)
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              If feeling unusually fatigued, overtrained or primed for high load, adjust your perceived exertion. The constrained optimizer recalculates volume and modulates intervals.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Fatigue:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueScore}
                onChange={(e) => setFatigueScore(parseInt(e.target.value))}
                className="w-32 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white w-6">{fatigueScore}/10</span>
            </div>

            <button
              onClick={handleAdapt}
              disabled={adapting}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${adapting ? 'animate-spin' : ''}`} />
              {adapting ? 'Optimizing...' : 'Adapt Schedule'}
            </button>
          </div>
        </div>

        {/* Plan Overview Banner */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs text-emerald-300 font-mono flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Active Microcycle: {plan?.name}. Total Weekly Volume: {plan?.current_weekly_km} km.</span>
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plan?.schedule.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border flex flex-col justify-between ${
                item.distance_km === 0
                  ? 'border-zinc-800/40 bg-zinc-950/40 text-zinc-500'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="font-mono text-xs font-bold text-zinc-400 uppercase">{item.day}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{item.date}</span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-white">{item.workout_type}</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-900/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Volume:</span>
                  <span className="text-emerald-400 font-bold">{item.distance_km > 0 ? `${item.distance_km} km` : '0 km (Rest)'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Pace Target:</span>
                  <span className="text-zinc-300">{item.target_pace_range}</span>
                </div>
                <div className="text-[10px] text-zinc-500 italic pt-1">
                  Stimulus: {item.purpose}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
