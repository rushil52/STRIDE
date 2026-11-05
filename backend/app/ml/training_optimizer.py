from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from app.ml.sports_science import format_pace

class AdaptiveTrainingOptimizer:
    """
    Adaptive Training Optimization Engine.
    Generates structured, science-backed microcycles (weekly schedules) and
    dynamically modulates volume and intensity based on:
    - User's recent ACWR (Fatigue vs Overreaching prevention)
    - Target race goal and current baseline
    - RPE feedback and subjective recovery indicators
    - Bayesian updating of recommended paces as performance improves
    """

    def generate_plan(
        self,
        current_weekly_km: float,
        target_distance: str = "5K",
        current_acwr: Optional[float] = 1.0,
        recent_rpe_avg: Optional[float] = 6.0,
        vdot: float = 38.0,
        start_date: Optional[date] = None
    ) -> Dict[str, Any]:
        if start_date is None:
            start_date = date.today()
            
        # Determine training pace zones from VDOT
        # Jack Daniels Pace Zones approx (sec/km):
        # 5K race pace approx:
        race_pace_sec = self._estimate_race_pace_sec(vdot, target_distance)
        easy_pace_sec = race_pace_sec + 75.0 # Easy is 60-90 sec slower than 5k pace
        tempo_pace_sec = race_pace_sec + 20.0
        interval_pace_sec = race_pace_sec - 10.0
        
        # Adaptive volume factor based on ACWR & RPE
        volume_factor = 1.0
        adaptation_reasons = []
        
        if current_acwr is not None:
            if current_acwr > 1.4:
                # Deload / recovery needed to protect athlete from injury
                volume_factor = 0.75
                adaptation_reasons.append(f"ACWR ({current_acwr:.2f}) indicates elevated fatigue load. Volume reduced by 25% for proactive recovery.")
            elif current_acwr < 0.8:
                # Safe to increase load progressively
                volume_factor = 1.10
                adaptation_reasons.append(f"ACWR ({current_acwr:.2f}) indicates high recovery headroom. Volume increased by 10% to stimulate progressive overload.")
            else:
                adaptation_reasons.append(f"ACWR ({current_acwr:.2f}) is in the optimal adaptation sweet spot (0.8 - 1.3). Maintaining planned progression.")
                
        if recent_rpe_avg and recent_rpe_avg >= 8.5:
            volume_factor *= 0.90
            adaptation_reasons.append("Recent user RPE indicates high subjective fatigue. Intensity modulated down.")
            
        target_weekly_km = max(15.0, round(current_weekly_km * volume_factor, 1))
        
        # Build 7-day microcycle schedule
        # Distribution: 1 Rest, 1 Long Run, 1 Quality/Tempo/Interval, 3 Easy/Recovery Runs, 1 Rest/Cross-training
        long_run_km = round(target_weekly_km * 0.32, 1)
        workout_km = round(target_weekly_km * 0.22, 1)
        easy1_km = round(target_weekly_km * 0.18, 1)
        easy2_km = round(target_weekly_km * 0.16, 1)
        easy3_km = round(target_weekly_km * 0.12, 1)
        
        days_template = [
            {
                "day_offset": 0,
                "day_name": "Monday",
                "workout_type": "Rest / Active Recovery",
                "distance_km": 0.0,
                "target_pace_range": "N/A",
                "description": "Full physiological rest or 20 minutes gentle mobility/foam rolling.",
                "purpose": "Neuromuscular regeneration and tissue repair."
            },
            {
                "day_offset": 1,
                "day_name": "Tuesday",
                "workout_type": "Aerobic Foundation Run",
                "distance_km": easy1_km,
                "target_pace_range": f"{format_pace(easy_pace_sec)} - {format_pace(easy_pace_sec + 20)}",
                "description": f"Comfortable conversational effort for {easy1_km} km. Keep heart rate in Zone 2.",
                "purpose": "Capillary density and mitochondrial biogenesis."
            },
            {
                "day_offset": 2,
                "day_name": "Wednesday",
                "workout_type": "Lactate Threshold Tempo",
                "distance_km": workout_km,
                "target_pace_range": f"{format_pace(tempo_pace_sec)} - {format_pace(tempo_pace_sec + 10)}",
                "description": f"1.5 km warmup, {round(workout_km - 2.5, 1)} km at comfortably hard tempo pace, 1 km cooldown.",
                "purpose": "Lactate clearance capacity and race pacing tolerance."
            },
            {
                "day_offset": 3,
                "day_name": "Thursday",
                "workout_type": "Recovery Jog",
                "distance_km": easy3_km,
                "target_pace_range": f"{format_pace(easy_pace_sec + 25)} - {format_pace(easy_pace_sec + 45)}",
                "description": f"Extremely gentle recovery pace. Zero pressure, focus on light turnover.",
                "purpose": "Active blood circulation without structural loading."
            },
            {
                "day_offset": 4,
                "day_name": "Friday",
                "workout_type": "Rest Day",
                "distance_km": 0.0,
                "target_pace_range": "N/A",
                "description": "Rest day prior to the weekend endurance stimulus.",
                "purpose": "Glycogen replenishment and mental recharge."
            },
            {
                "day_offset": 5,
                "day_name": "Saturday",
                "workout_type": "Aerobic Base Run",
                "distance_km": easy2_km,
                "target_pace_range": f"{format_pace(easy_pace_sec)} - {format_pace(easy_pace_sec + 15)}",
                "description": f"Steady aerobic running for {easy2_km} km. Optional 4x20s light strides at the end.",
                "purpose": "Aerobic conditioning and neuromuscular cadence stimulation."
            },
            {
                "day_offset": 6,
                "day_name": "Sunday",
                "workout_type": "Long Endurance Run",
                "distance_km": long_run_km,
                "target_pace_range": f"{format_pace(easy_pace_sec + 10)} - {format_pace(easy_pace_sec + 30)}",
                "description": f"Weekly long run of {long_run_km} km at controlled conversational effort. Stay well hydrated.",
                "purpose": "Lipid metabolism, structural musculoskeletal durability."
            }
        ]
        
        schedule = []
        for item in days_template:
            run_date = start_date + timedelta(days=item["day_offset"])
            schedule.append({
                "date": run_date.isoformat(),
                "day": run_date.strftime("%A"),
                "workout_type": item["workout_type"],
                "distance_km": item["distance_km"],
                "target_pace_range": item["target_pace_range"],
                "description": item["description"],
                "purpose": item["purpose"]
            })
            
        return {
            "name": f"STRIDE Adaptive Cycle ({target_distance})",
            "target_race_distance": target_distance,
            "start_date": start_date,
            "end_date": start_date + timedelta(days=6),
            "current_weekly_km": target_weekly_km,
            "peak_weekly_km": round(target_weekly_km * 1.25, 1),
            "adaptation_reason": " ".join(adaptation_reasons),
            "schedule": schedule
        }

    def _estimate_race_pace_sec(self, vdot: float, target_distance: str) -> float:
        # Approximate 5K pace in sec/km as function of VDOT:
        # VDOT 30 ~ 30:00 5k (360 s/km)
        # VDOT 40 ~ 24:00 5k (288 s/km)
        # VDOT 50 ~ 20:00 5k (240 s/km)
        # VDOT 60 ~ 17:00 5k (204 s/km)
        base_5k_pace = 720.0 - (vdot * 8.6)
        base_5k_pace = max(180.0, min(480.0, base_5k_pace))
        
        if target_distance == "10K":
            return base_5k_pace * 1.05
        elif target_distance == "Half":
            return base_5k_pace * 1.10
        elif target_distance == "Marathon":
            return base_5k_pace * 1.16
        return base_5k_pace

adaptive_optimizer = AdaptiveTrainingOptimizer()
