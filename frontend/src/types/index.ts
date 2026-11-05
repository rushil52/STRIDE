export interface User {
  id: number;
  email: string;
  full_name: string | null;
  max_heart_rate: number;
  resting_heart_rate: number;
  weekly_mileage_goal_km: number;
  target_race_distance: string;
  target_race_date: string | null;
  target_time_seconds: number | null;
  experience_level: string;
  strava_connected: boolean;
  strava_athlete_id: number | null;
}

export interface Activity {
  id: number;
  user_id: number;
  source: string;
  external_id: string | null;
  title: string;
  activity_type: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds: number;
  elevation_gain_meters: number;
  average_speed_mps: number;
  average_pace_sec_km: number;
  pace_formatted: string;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_cadence: number | null;
  trimp_score: number | null;
  rpe_score: number | null;
  feeling: string | null;
  workout_category: string;
  splits_data: any[] | null;
  notes: string | null;
  created_at: string;
}

export interface ActivitySummary {
  total_runs: number;
  total_distance_km: number;
  total_duration_hours: number;
  average_pace_formatted: string;
  average_hr: number | null;
}

export interface DailyMetric {
  id: number;
  metric_date: string;
  total_distance_km: number;
  total_moving_time_minutes: number;
  daily_trimp: number;
  acute_workload_7d: number;
  chronic_workload_28d: number;
  acwr: number | null;
  rolling_7d_distance_km: number;
  rolling_28d_distance_km: number;
  average_rpe: number | null;
}

export interface WorkloadAnalytics {
  current_acwr: number | null;
  acwr_status: 'optimal' | 'under_training' | 'overreaching' | 'high_risk' | 'insufficient_data';
  weekly_distance_km: number;
  weekly_goal_km: number;
  weekly_progress_pct: number;
  monthly_distance_km: number;
  acute_load: number;
  chronic_load: number;
  chart_data: DailyMetric[];
}

export interface RacePrediction {
  id: number;
  target_distance: string;
  predicted_time_seconds: number;
  predicted_time_formatted: string;
  lower_bound_formatted: string | null;
  upper_bound_formatted: string | null;
  confidence_score: number;
  model_name: string;
  prediction_date: string;
  key_factors: Record<string, any> | null;
}

export interface WorkoutScheduleItem {
  date: string;
  day: string;
  workout_type: string;
  distance_km: number;
  target_pace_range: string;
  description: string;
  purpose: string;
}

export interface TrainingPlan {
  id: number;
  name: string;
  target_race_distance: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  current_weekly_km: number;
  peak_weekly_km: number;
  adaptation_reason: string | null;
  schedule: WorkoutScheduleItem[];
}
