'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth, formatErrorMessage } from '@/lib/api';
import { Activity, WorkloadAnalytics, RacePrediction, TrainingPlan, User, ActivitySummary } from '@/types';
import { 
  BarChart3, Activity as ActivityIcon, CalendarDays, 
  ChevronRight, Sparkles, RefreshCw, Link2, Unlink, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [workload, setWorkload] = useState<WorkloadAnalytics | null>(null);
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [stravaStatus, setStravaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [syncingStrava, setSyncingStrava] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showStravaModal, setShowStravaModal] = useState(false);

  const loadDashboardData = async () => {
    try {
      setDashboardError(null);
      const [userData, summaryData, workloadData, predData, planData, actData, sStatus] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/activities/summary'),
        fetchWithAuth('/analytics/workload'),
        fetchWithAuth('/analytics/predictions'),
        fetchWithAuth('/analytics/plan'),
        fetchWithAuth('/activities/?limit=5'),
        fetchWithAuth('/strava/status').catch(() => null),
      ]);

      setUser(userData);
      setSummary(summaryData);
      setWorkload(workloadData);
      setPredictions(predData);
      setPlan(planData);
      setRecentActivities(actData);
      setStravaStatus(sStatus);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setDashboardError(formatErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    setDashboardError(null);
    try {
      await fetchWithAuth('/activities/seed-synthetic?days=60&profile=improving', { method: 'POST' });
      await loadDashboardData();
    } catch (e: any) {
      setDashboardError(formatErrorMessage(e.message || e));
    } finally {
      setSeeding(false);
    }
  };

  const handleConnectStrava = async () => {
    try {
      const res = await fetchWithAuth('/strava/connect-url');
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (e: any) {
      setShowStravaModal(true);
    }
  };

  const handleSyncStrava = async () => {
    setSyncingStrava(true);
    try {
      const res = await fetchWithAuth('/strava/sync', { method: 'POST' });
      alert(`Successfully synchronized ${res.synced_activities || 0} activities from Strava.`);
      await loadDashboardData();
    } catch (e: any) {
      alert(`Strava sync notice: ${formatErrorMessage(e.message || e)}`);
    } finally {
      setSyncingStrava(false);
    }
  };

  const handleDisconnectStrava = async () => {
    if (!confirm('Disconnect your Strava account from STRIDE?')) return;
    try {
      await fetchWithAuth('/strava/disconnect', { method: 'POST' });
      await loadDashboardData();
    } catch (e: any) {
      alert(formatErrorMessage(e.message || e));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex items-center justify-center font-mono">
        <div className="flex items-center gap-3 text-sm text-[#73726d]">
          <RefreshCw className="w-4 h-4 text-[#c84b31] animate-spin" />
          <span>Interpreting physiological telemetry...</span>
        </div>
      </div>
    );
  }

  // Workload status color badge (subtle editorial tones)
  const getAcwrBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return { label: 'Optimal Load Range', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
      case 'overreaching':
        return { label: 'Elevated Overreaching', color: 'text-amber-800 bg-amber-50 border-amber-200' };
      case 'high_risk':
        return { label: 'High Fatigue Spike', color: 'text-rose-800 bg-rose-50 border-rose-200' };
      default:
        return { label: 'Baseline Construction', color: 'text-blue-800 bg-blue-50 border-blue-200' };
    }
  };

  const acwrBadge = getAcwrBadge(workload?.acwr_status || 'optimal');

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#eae8e4]">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1c1c1a]">Training Cockpit</h1>
            <p className="text-xs text-[#73726d] mt-1">
              Impulse-response training loads, physiological VDOT kinetics & continuous microcycle calibration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Strava Integration Controls */}
            {user?.strava_connected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncStrava}
                  disabled={syncingStrava}
                  className="px-3 py-1.5 rounded border border-[#eae8e4] bg-[#ffffff] text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f3ef] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#c84b31] ${syncingStrava ? 'animate-spin' : ''}`} />
                  {syncingStrava ? 'Syncing...' : 'Sync Strava'}
                </button>
                <button
                  onClick={handleDisconnectStrava}
                  className="p-1.5 rounded border border-[#eae8e4] bg-[#ffffff] text-[#73726d] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Disconnect Strava"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectStrava}
                className="px-3 py-1.5 rounded border border-[#eae8e4] bg-[#ffffff] text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f3ef] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-[#c84b31]" />
                Connect Strava
              </button>
            )}

            {(!recentActivities || recentActivities.length === 0) && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#333330] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {seeding ? 'Calibrating...' : 'Load 60-Day Sample Runs'}
              </button>
            )}

            <button
              onClick={() => router.push('/dashboard/activities')}
              className="px-3 py-1.5 rounded border border-[#eae8e4] bg-[#ffffff] text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
            >
              Log Workout
            </button>
          </div>
        </div>

        {dashboardError && (
          <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{dashboardError}</span>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ACWR Workload */}
          <div className="p-5 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#73726d] uppercase tracking-wider">ACWR Workload</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${acwrBadge.color}`}>
                {acwrBadge.label}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-serif font-bold text-[#1c1c1a]">
                {workload?.current_acwr ? workload.current_acwr.toFixed(2) : '--'}
              </div>
              <p className="text-[11px] text-[#73726d] mt-1 font-mono">
                Acute (7d): {workload?.acute_load || 0} vs Chronic (28d): {workload?.chronic_load || 0}
              </p>
            </div>
          </div>

          {/* Card 2: Weekly Mileage */}
          <div className="p-5 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#73726d] uppercase tracking-wider">7-Day Volume</span>
              <span className="text-xs font-mono text-[#c84b31] font-semibold">{workload?.weekly_progress_pct || 0}% goal</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-serif font-bold text-[#1c1c1a]">
                {workload?.weekly_distance_km || 0} <span className="text-sm font-normal text-[#73726d]">km</span>
              </div>
              <div className="w-full bg-[#f4f3ef] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#c84b31] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, workload?.weekly_progress_pct || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: 5K ML Time Prediction */}
          <div className="p-5 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#73726d] uppercase tracking-wider">Projected 5K Pace</span>
              <span className="text-[10px] font-mono text-[#1c1c1a] bg-[#f4f3ef] px-1.5 py-0.5 rounded border border-[#eae8e4]">
                90% Conf
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-serif font-bold text-[#1c1c1a]">
                {predictions[0]?.predicted_time_formatted || '--:--'}
              </div>
              <p className="text-[11px] text-[#73726d] mt-1 font-mono">
                Range: {predictions[0]?.lower_bound_formatted || '--'} - {predictions[0]?.upper_bound_formatted || '--'}
              </p>
            </div>
          </div>

          {/* Card 4: Historical Distance */}
          <div className="p-5 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#73726d] uppercase tracking-wider">Recorded Runs</span>
              <span className="text-xs font-mono text-[#73726d]">Avg: {summary?.average_pace_formatted || '--:--'}</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-serif font-bold text-[#1c1c1a]">
                {summary?.total_runs || 0} <span className="text-sm font-normal text-[#73726d]">activities</span>
              </div>
              <p className="text-[11px] text-[#73726d] mt-1 font-mono">
                Cumulative: {summary?.total_distance_km || 0} km logged
              </p>
            </div>
          </div>
        </div>

        {/* Charts Grid: Training Load EWMA & Mileage Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: ACWR EWMA Timeline */}
          <div className="lg:col-span-2 p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#1c1c1a]">Acute vs Chronic Workload Ratio (EWMA)</h3>
                <p className="text-xs text-[#73726d]">Values between 0.8 and 1.3 represent optimal progressive conditioning</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#73726d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c84b31] inline-block" /> Acute Load (7d)
                </span>
                <span className="flex items-center gap-1.5 text-[#73726d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1c1c1a] inline-block" /> Chronic Base (28d)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {workload?.chart_data && workload.chart_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workload.chart_data}>
                    <defs>
                      <linearGradient id="acuteGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c84b31" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#c84b31" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="chronicGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1c1c1a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1c1c1a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#eae8e4" vertical={false} />
                    <XAxis 
                      dataKey="metric_date" 
                      stroke="#73726d" 
                      fontSize={11} 
                      tickFormatter={(v) => typeof v === 'string' ? v.slice(5) : ''} 
                    />
                    <YAxis stroke="#73726d" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#eae8e4', borderRadius: '6px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                    />
                    <Area type="monotone" dataKey="acute_workload_7d" stroke="#c84b31" strokeWidth={2} fillOpacity={1} fill="url(#acuteGrad)" />
                    <Area type="monotone" dataKey="chronic_workload_28d" stroke="#1c1c1a" strokeWidth={2} fillOpacity={1} fill="url(#chronicGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#73726d] text-xs font-mono gap-2 border border-dashed border-[#eae8e4] rounded">
                  <div>No historical activity data recorded.</div>
                  <button
                    onClick={handleSeedData}
                    disabled={seeding}
                    className="text-[#c84b31] underline hover:text-[#b03e26] cursor-pointer"
                  >
                    Load sample training history
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Race Predictions Matrix */}
          <div className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#eae8e4]">
                <h3 className="text-sm font-serif font-bold text-[#1c1c1a]">Performance Projections</h3>
                <span className="text-[10px] font-mono text-[#73726d]">Daniels & Riegel</span>
              </div>

              <div className="mt-4 space-y-3">
                {predictions.length > 0 ? (
                  predictions.map((p) => (
                    <div key={p.target_distance} className="p-3 rounded border border-[#eae8e4] bg-[#fbfbfa]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#1c1c1a]">{p.target_distance} Target</span>
                        <span className="text-xs font-mono text-[#c84b31] font-bold">{p.predicted_time_formatted}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#73726d] font-mono">
                        <span>Confidence Band:</span>
                        <span>{p.lower_bound_formatted || '--'} - {p.upper_bound_formatted || '--'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#73726d] py-6 text-center font-mono">
                    Log at least 1 run to calculate projections.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#eae8e4] text-[11px] text-[#73726d] leading-relaxed">
              Predictions merge Jack Daniels oxygen uptake formulas with Pete Riegel power decay, weighted by recent consistency and 6-week volume adequacy.
            </div>
          </div>
        </div>

        {/* Current Adaptive Training Microcycle */}
        <div className="p-6 rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e4] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#c84b31]" />
                <h3 className="text-sm font-serif font-bold text-[#1c1c1a]">Current Microcycle Schedule</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#f4f3ef] border border-[#eae8e4] text-[#1c1c1a]">
                  Volume: {plan?.current_weekly_km || 0} km
                </span>
              </div>
              {plan?.adaptation_reason && (
                <p className="text-xs text-[#73726d] mt-1 font-mono">
                  {plan.adaptation_reason}
                </p>
              )}
            </div>

            <button
              onClick={() => router.push('/dashboard/plan')}
              className="text-xs text-[#73726d] hover:text-[#1c1c1a] flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              Adjust Plan & Fatigue <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mt-4">
            {plan?.schedule && plan.schedule.length > 0 ? (
              plan.schedule.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded border text-xs flex flex-col justify-between min-h-[120px] ${
                    item.distance_km === 0 
                      ? 'border-[#eae8e4] bg-[#fbfbfa] text-[#73726d]' 
                      : 'border-[#eae8e4] bg-[#ffffff] text-[#1c1c1a]'
                  }`}
                >
                  <div>
                    <div className="font-mono text-[10px] text-[#73726d] uppercase">{item.day.slice(0, 3)} • {typeof item.date === 'string' ? item.date.slice(5) : ''}</div>
                    <div className="font-semibold text-[#1c1c1a] mt-1 text-xs">{item.workout_type}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#eae8e4] flex items-end justify-between font-mono">
                    <span className="text-[#c84b31] font-bold">{item.distance_km > 0 ? `${item.distance_km} km` : 'Rest'}</span>
                    <span className="text-[10px] text-[#73726d]">{item.target_pace_range !== 'N/A' ? item.target_pace_range.split(' - ')[0] : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-[#73726d] font-mono text-xs">
                Microcycle scheduled when workouts are calibrated.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Strava Configuration Guidance Modal */}
      {showStravaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#ffffff] border border-[#eae8e4] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#c84b31]" />
              <h3 className="text-base font-serif font-bold text-[#1c1c1a]">Strava API Setup Required</h3>
            </div>
            <p className="text-xs text-[#73726d] leading-relaxed">
              To connect your personal Strava athlete account, STRIDE requires your registered application keys from the Strava Developer Portal.
            </p>
            <div className="p-3.5 rounded bg-[#fbfbfa] border border-[#eae8e4] space-y-2 text-xs font-mono">
              <div className="font-bold text-[#1c1c1a]">Required Steps:</div>
              <ol className="list-decimal pl-4 space-y-1 text-[#73726d]">
                <li>Visit <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="text-[#c84b31] underline inline-flex items-center gap-0.5">strava.com/settings/api <ExternalLink className="w-3 h-3" /></a></li>
                <li>Set <strong>Authorization Callback Domain</strong> to: <code className="bg-[#f4f3ef] px-1 py-0.5 rounded text-[#1c1c1a]">localhost:3000</code></li>
                <li>In your STRIDE project, edit <code className="bg-[#f4f3ef] px-1 py-0.5 rounded text-[#1c1c1a]">backend/.env</code> with:
                  <div className="mt-1.5 p-2 bg-[#ffffff] border border-[#eae8e4] rounded text-[11px] text-[#1c1c1a]">
                    STRAVA_CLIENT_ID=&quot;&lt;your_client_id&gt;&quot;<br />
                    STRAVA_CLIENT_SECRET=&quot;&lt;your_client_secret&gt;&quot;<br />
                    STRAVA_REDIRECT_URI=&quot;http://localhost:3000/strava/callback&quot;
                  </div>
                </li>
                <li>Restart backend server.</li>
              </ol>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStravaModal(false)}
                className="px-4 py-2 rounded bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#333330]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
