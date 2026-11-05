'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { fetchWithAuth, formatErrorMessage } from '@/lib/api';
import { Activity, User } from '@/types';
import { Activity as ActivityIcon, Upload, Plus, Sparkles, Heart, AlertCircle, Info } from 'lucide-react';

export default function ActivitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Manual Run Form State
  const [title, setTitle] = useState('Easy Morning Run');
  const [distanceKm, setDistanceKm] = useState('5.0');
  const [durationMin, setDurationMin] = useState('25.0');
  const [avgHr, setAvgHr] = useState('152');
  const [rpe, setRpe] = useState('6');
  const [workoutCat, setWorkoutCat] = useState('easy');

  const loadData = async () => {
    try {
      setErrorMessage(null);
      const [u, acts] = await Promise.all([
        fetchWithAuth('/auth/me'),
        fetchWithAuth('/activities/?limit=100'),
      ]);
      setUser(u);
      setActivities(acts);
    } catch (e: any) {
      setErrorMessage(formatErrorMessage(e.message || e));
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

      if (distMeters <= 0 || durationSec <= 0) {
        alert('Distance and duration must be greater than zero.');
        return;
      }
      
      await fetchWithAuth('/activities/manual', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || 'Running Workout',
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
      alert(`Error saving run: ${formatErrorMessage(err.message || err)}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      await fetchWithAuth('/activities/upload', {
        method: 'POST',
        body: formData,
      });

      await loadData();
    } catch (err: any) {
      alert(`File upload failed: ${formatErrorMessage(err.message || err)}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1c1c1a] flex flex-col">
      <Navigation user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e4] gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1c1c1a]">Your Running History</h1>
            <p className="text-xs text-[#73726d] mt-1">
              All your runs synced from Strava, uploaded from watch files (GPX/FIT), or entered manually.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="px-3.5 py-1.5 rounded border border-[#eae8e4] bg-[#ffffff] text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#c84b31]" />
              {uploading ? 'Reading file...' : 'Upload Run File'}
              <input type="file" accept=".gpx,.fit" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#c84b31] text-white text-xs font-medium hover:bg-[#b03e26] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add a Run Manually
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Activity Table */}
        <div className="rounded-lg border border-[#eae8e4] bg-[#ffffff] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbfbfa] border-b border-[#eae8e4] text-[#73726d] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-normal">Workout Name</th>
                  <th className="py-3 px-4 font-normal">Date</th>
                  <th className="py-3 px-4 font-normal">Distance</th>
                  <th className="py-3 px-4 font-normal">Average Pace</th>
                  <th className="py-3 px-4 font-normal">Heart Rate</th>
                  <th className="py-3 px-4 font-normal">Training Effort</th>
                  <th className="py-3 px-4 font-normal">Type</th>
                  <th className="py-3 px-4 font-normal">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae8e4] font-mono">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#fbfbfa] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-[#1c1c1a]">{act.title}</td>
                      <td className="py-3.5 px-4 text-[#73726d]">{act.start_date.slice(0, 10)}</td>
                      <td className="py-3.5 px-4 text-[#c84b31] font-bold">{(act.distance_meters / 1000.0).toFixed(2)} km</td>
                      <td className="py-3.5 px-4 text-[#1c1c1a]">{act.pace_formatted}</td>
                      <td className="py-3.5 px-4 text-[#73726d]">
                        {act.average_heartrate ? (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-[#c84b31]" />
                            {Math.round(act.average_heartrate)} bpm
                          </span>
                        ) : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-[#73726d]">
                        {act.trimp_score ? `${Math.round(act.trimp_score)} pts` : '--'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-sans font-medium bg-[#f4f3ef] text-[#1c1c1a] border border-[#eae8e4]">
                          {act.workout_category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#73726d] capitalize">{act.source}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#73726d] font-sans">
                      {loading ? 'Retrieving your runs...' : 'No runs logged yet. Connect Strava or upload a GPX/FIT file above to begin.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#ffffff] border border-[#eae8e4] rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-serif font-bold text-[#1c1c1a] mb-4">Enter a Completed Run</h2>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Workout Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] focus:outline-none focus:border-[#c84b31]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Distance (KM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] font-mono focus:outline-none focus:border-[#c84b31]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Time (Minutes)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] font-mono focus:outline-none focus:border-[#c84b31]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Avg Heart Rate (Optional)</label>
                    <input
                      type="number"
                      min="40"
                      max="230"
                      value={avgHr}
                      onChange={(e) => setAvgHr(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] font-mono focus:outline-none focus:border-[#c84b31]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">How Hard Did It Feel? (1–10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rpe}
                      onChange={(e) => setRpe(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] font-mono focus:outline-none focus:border-[#c84b31]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#73726d] mb-1">Workout Type</label>
                  <select
                    value={workoutCat}
                    onChange={(e) => setWorkoutCat(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#ffffff] border border-[#eae8e4] text-sm text-[#1c1c1a] focus:outline-none focus:border-[#c84b31]"
                  >
                    <option value="easy">Easy Aerobic Run</option>
                    <option value="tempo">Faster Pace (Tempo)</option>
                    <option value="interval">Fast Repeats (Intervals)</option>
                    <option value="long_run">Long Endurance Run</option>
                    <option value="recovery">Gentle Recovery Jog</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eae8e4]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded border border-[#eae8e4] text-xs font-medium text-[#73726d] hover:text-[#1c1c1a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-[#c84b31] text-white text-xs font-medium hover:bg-[#b03e26]"
                  >
                    Save Run
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
