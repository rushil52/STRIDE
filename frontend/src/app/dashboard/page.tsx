'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { Activity, WorkloadAnalytics, RacePrediction, TrainingPlan, User, ActivitySummary } from '@/types';
import { 
  TrendingUp, Activity as ActivityIcon, Calendar, Zap, 
  AlertTriangle, CheckCircle2, ChevronRight, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, LineChart, Line, CartesianGrid 
} from 'recharts';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [workload, setWorkload] = useState<WorkloadAnalytics | null>(null);
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [userData, summaryData, workloadData, predData, planData, actData] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/activities/summary'),
        fetchWithAuth('/analytics/workload'),
        fetchWithAuth('/analytics/predictions'),
        fetchWithAuth('/analytics/plan'),
        fetchWithAuth('/activities/?limit=5'),
      ]);

      setUser(userData);
      setSummary(summaryData);
      setWorkload(workloadData);
      setPredictions(predData);
      setPlan(planData);
      setRecentActivities(actData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await fetchWithAuth('/activities/seed-synthetic?days=60&profile=improving', { method: 'POST' });
      await loadDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span>Synchronizing STRIDE Analytics Engine...</span>
        </div>
      </div>
    );
  }

  // Workload status color badge
  const getAcwrBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return { label: 'Optimal Load (Sweet Spot)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
      case 'overreaching':
        return { label: 'Overreaching Strain', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
      case 'high_risk':
        return { label: 'High Fatigue Spike', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' };
      default:
        return { label: 'Baseline Building', color: 'text-blue-400 bg-blue-950/60 border-blue-500/40' };
    }
  };

  const acwrBadge = getAcwrBadge(workload?.acwr_status || 'optimal');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Performance Cockpit
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-normal">
                v1.2 Adaptive
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Impulse-response training loads, physiological VDOT kinetics & continuous Bayesian schedule calibration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(!recentActivities || recentActivities.length === 0) && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {seeding ? 'Calibrating Data...' : 'Seed 60-Day Synthetic Dataset'}
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/activities')}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Log Workout
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ACWR Workload */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">ACWR Workload</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${acwrBadge.color}`}>
                {acwrBadge.label}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold font-mono text-white">
                {workload?.current_acwr ? workload.current_acwr.toFixed(2) : '1.02'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Acute 7d: {workload?.acute_load || 0} vs Chronic 28d: {workload?.chronic_load || 0}
              </p>
            </div>
          </div>

          {/* Card 2: Weekly Mileage */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">7-Day Volume</span>
              <span className="text-xs font-mono text-emerald-400">{workload?.weekly_progress_pct || 0}% goal</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold font-mono text-white">
                {workload?.weekly_distance_km || 0} <span className="text-base font-normal text-zinc-400">km</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, workload?.weekly_progress_pct || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: 5K ML Time Prediction */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Predicted 5K Time</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                90% Conf
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold font-mono text-white">
                {predictions[0]?.predicted_time_formatted || '--:--'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                Range: {predictions[0]?.lower_bound_formatted} - {predictions[0]?.upper_bound_formatted}
              </p>
            </div>
          </div>

          {/* Card 4: Historical Distance */}
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Total Workouts</span>
              <span className="text-xs font-mono text-zinc-500">Pace: {summary?.average_pace_formatted || '--:--'}</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold font-mono text-white">
                {summary?.total_runs || 0} <span className="text-base font-normal text-zinc-400">runs</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Cumulative: {summary?.total_distance_km || 0} km logged
              </p>
            </div>
          </div>
        </div>

        {/* Charts Grid: Training Load EWMA & Mileage Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: ACWR EWMA Timeline */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Acute vs Chronic Workload Ratio (EWMA)</h3>
                <p className="text-xs text-zinc-400">Green zone (0.8 - 1.3) represents optimal training stimulus</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Acute (7d)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Chronic (28d)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {workload?.chart_data && workload.chart_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workload.chart_data}>
                    <defs>
                      <linearGradient id="acuteGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="chronicGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="metric_date" 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickFormatter={(v) => v.slice(5)} 
                    />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }} 
                    />
                    <Area type="monotone" dataKey="acute_workload_7d" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#acuteGrad)" />
                    <Area type="monotone" dataKey="chronic_workload_28d" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#chronicGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                  Log runs or click Seed Synthetic Data to generate EWMA workload curve.
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Race Predictions Matrix */}
          <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-950 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">ML Race Predictor</h3>
                <span className="text-[10px] font-mono text-zinc-400">Calibrated VDOT</span>
              </div>

              <div className="mt-4 space-y-4">
                {predictions.map((p) => (
                  <div key={p.target_distance} className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-300">{p.target_distance} Target</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{p.predicted_time_formatted}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>Conf Range:</span>
                      <span>{p.lower_bound_formatted} - {p.upper_bound_formatted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 leading-relaxed">
              Predictions combine Jack Daniels oxygen utilization curves with Pete Riegel power-decay exponents and your historical training density.
            </div>
          </div>
        </div>

        {/* Current Adaptive Training Microcycle */}
        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Current Adaptive Microcycle</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Target: {plan?.current_weekly_km || 0} km
                </span>
              </div>
              {plan?.adaptation_reason && (
                <p className="text-xs text-emerald-400/90 mt-1 font-mono">
                  Adaptation Logic: {plan.adaptation_reason}
                </p>
              )}
            </div>

            <button
              onClick={() => router.push('/dashboard/plan')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              Modify Plan Preferences <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mt-4">
            {plan?.schedule.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between min-h-[120px] ${
                  item.distance_km === 0 
                    ? 'border-zinc-800/50 bg-zinc-900/30 text-zinc-500' 
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-200'
                }`}
              >
                <div>
                  <div className="font-mono text-[10px] text-zinc-500 uppercase">{item.day.slice(0, 3)} • {item.date.slice(5)}</div>
                  <div className="font-semibold text-white mt-1 text-xs">{item.workout_type}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-end justify-between font-mono">
                  <span className="text-emerald-400 font-bold">{item.distance_km > 0 ? `${item.distance_km} km` : 'Rest'}</span>
                  <span className="text-[10px] text-zinc-400">{item.target_pace_range !== 'N/A' ? item.target_pace_range.split(' - ')[0] : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
