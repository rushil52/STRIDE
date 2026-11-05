'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth } from '@/lib/api';
import { Activity, User } from '@/types';
import { Activity as ActivityIcon, Upload, Plus, Sparkles, Filter, ChevronRight, Heart, Timer } from 'lucide-react';

export default function ActivitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Manual Run Form State
  const [title, setTitle] = useState('Morning Run');
  const [distanceKm, setDistanceKm] = useState('5.0');
  const [durationMin, setDurationMin] = useState('25.0');
  const [avgHr, setAvgHr] = useState('155');
  const [rpe, setRpe] = useState('6');
  const [workoutCat, setWorkoutCat] = useState('easy');

  const loadData = async () => {
    try {
      const [u, acts] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/activities/?limit=100'),
      ]);
      setUser(u);
      setActivities(acts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const distMeters = parseFloat(distanceKm) * 1000.0;
      const durationSec = Math.round(parseFloat(durationMin) * 60.0);
      
      await fetchWithAuth('/activities/manual', {
        method: 'POST',
        body: JSON.stringify({
          title,
          start_date: new Date().toISOString(),
          distance_meters: distMeters,
          moving_time_seconds: durationSec,
          elapsed_time_seconds: durationSec,
          average_heartrate: avgHr ? parseFloat(avgHr) : null,
          rpe_score: rpe ? parseInt(rpe) : null,
          workout_category: workoutCat,
        }),
      });

      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Error saving run: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const token = localStorage.getItem('stride_token');
      const res = await fetch('http://127.0.0.1:8000/api/v1/activities/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      await loadData();
    } catch (err: any) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-emerald-400" />
              Activity Stream
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Historical running log imported via Strava API, GPX/FIT uploads or manual telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Processing...' : 'Upload GPX / FIT'}
              <input type="file" accept=".gpx,.fit" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Manual Workout
            </button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Workout</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Avg Pace</th>
                  <th className="py-3 px-4">Avg HR</th>
                  <th className="py-3 px-4">TRIMP Load</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-mono">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <tr key={act.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-white">{act.title}</td>
                      <td className="py-3.5 px-4 text-zinc-400">{act.start_date.slice(0, 10)}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">{(act.distance_meters / 1000.0).toFixed(2)} km</td>
                      <td className="py-3.5 px-4 text-zinc-200">{act.pace_formatted}</td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {act.average_heartrate ? (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" />
                            {Math.round(act.average_heartrate)} bpm
                          </span>
                        ) : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">{act.trimp_score ? act.trimp_score.toFixed(1) : '--'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-sans font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {act.workout_category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 capitalize">{act.source}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                      No activities recorded yet. Import GPX files or log a workout above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-4">Log Running Activity</h2>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">RUN TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">DISTANCE (KM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">DURATION (MINUTES)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">AVG HEART RATE</label>
                    <input
                      type="number"
                      value={avgHr}
                      onChange={(e) => setAvgHr(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">RPE EFFORT (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rpe}
                      onChange={(e) => setRpe(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">WORKOUT CATEGORY</label>
                  <select
                    value={workoutCat}
                    onChange={(e) => setWorkoutCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white"
                  >
                    <option value="easy">Easy Aerobic</option>
                    <option value="tempo">Threshold Tempo</option>
                    <option value="interval">Interval VO2max</option>
                    <option value="long_run">Endurance Long Run</option>
                    <option value="recovery">Active Recovery</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
