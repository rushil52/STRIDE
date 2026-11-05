'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth, formatErrorMessage } from '@/lib/api';
import { TrainingPlan, User } from '@/types';
import { CalendarDays, RefreshCw, Sliders, CheckCircle, Info } from 'lucide-react';

export default function PlanPage() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [fatigueScore, setFatigueScore] = useState(7);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [u, p] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/analytics/plan'),
      ]);
      setUser(u);
      setPlan(p);
    } catch (e: any) {
      console.error(e);
      setFeedbackMsg(formatErrorMessage(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdapt = async () => {
    setAdapting(true);
    setFeedbackMsg(null);
    try {
      const adapted = await fetchWithAuth(`/analytics/plan/adapt?perceived_fatigue_score=${fatigueScore}`, {
        method: 'POST',
      });
      setPlan(adapted);
      setFeedbackMsg(`Schedule adapted for subjective exertion score ${fatigueScore}/10.`);
    } catch (e: any) {
      setFeedbackMsg(formatErrorMessage(e.message || e));
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e4] gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1c1c1a]">Adaptive Microcycle</h1>
            <p className="text-xs text-[#73726d] mt-1">
              Dynamic 7-day training schedule generated from physiological workload and subjective recovery feedback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#73726d]">Target Distance:</span>
            <span className="px-2.5 py-1 rounded bg-[#ffffff] border border-[#eae8e4] text-[#c84b31] font-mono text-xs font-semibold">
              {plan?.target_race_distance || '5K'}
            </span>
          </div>
        </div>

        {/* Bayesian Fatigue Feedback Re-optimizer */}
        <div className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1c1c1a]">
              <Sliders className="w-4 h-4 text-[#c84b31]" />
              Subjective Exertion & Fatigue Feedback
            </div>
            <p className="text-xs text-[#73726d] mt-1.5 leading-relaxed">
              When encountering heightened life fatigue, heavy legs, or elevated stress, inform the optimizer. STRIDE reduces volume or shifts intensity to prevent overreaching.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-[#73726d]">Fatigue:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueScore}
                onChange={(e) => setFatigueScore(parseInt(e.target.value))}
                className="w-32 accent-[#c84b31] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[#1c1c1a] w-7">{fatigueScore}/10</span>
            </div>

            <button
              onClick={handleAdapt}
              disabled={adapting}
              className="px-4 py-2 rounded bg-[#c84b31] text-white text-xs font-medium hover:bg-[#b03e26] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${adapting ? 'animate-spin' : ''}`} />
              {adapting ? 'Optimizing...' : 'Adapt Schedule'}
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-4 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Plan Overview Banner */}
        <div className="p-4 rounded-lg border border-[#eae8e4] bg-[#ffffff] text-xs text-[#1c1c1a] font-mono flex items-center justify-between">
          <div>
            <span className="text-[#c84b31] font-semibold">Active Cycle:</span> {plan?.name || 'Weekly Microcycle'}. Planned Mileage: <span className="font-bold">{plan?.current_weekly_km || 0} km</span>.
          </div>
          {plan?.adaptation_reason && (
            <div className="text-[#73726d] text-[11px] max-w-md text-right hidden sm:block truncate">
              {plan.adaptation_reason}
            </div>
          )}
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plan?.schedule && plan.schedule.length > 0 ? (
            plan.schedule.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-lg border shadow-xs flex flex-col justify-between ${
                  item.distance_km === 0
                    ? 'border-[#eae8e4] bg-[#fbfbfa] text-[#73726d]'
                    : 'border-[#eae8e4] bg-[#ffffff] text-[#1c1c1a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#eae8e4]">
                    <span className="font-mono text-xs font-bold text-[#1c1c1a] uppercase">{item.day}</span>
                    <span className="font-mono text-[10px] text-[#73726d]">{item.date}</span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-serif font-bold text-sm text-[#1c1c1a]">{item.workout_type}</h3>
                    <p className="mt-2 text-xs text-[#73726d] leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#eae8e4] space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#73726d]">Volume:</span>
                    <span className="text-[#c84b31] font-bold">{item.distance_km > 0 ? `${item.distance_km} km` : '0 km (Rest)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#73726d]">Pace Target:</span>
                    <span className="text-[#1c1c1a]">{item.target_pace_range}</span>
                  </div>
                  <div className="text-[10px] text-[#73726d] italic pt-1 font-sans">
                    Stimulus: {item.purpose}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-[#73726d] font-mono text-xs">
              {loading ? 'Generating schedule...' : 'No schedule generated yet.'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
