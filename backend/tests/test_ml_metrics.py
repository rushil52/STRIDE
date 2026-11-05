import pytest
from app.ml.sports_science import calculate_banister_trimp, calculate_pace_sec_km, format_pace, classify_acwr
from app.ml.feature_extraction import riegel_race_prediction, estimate_vdot_from_race
from app.ml.race_predictor import race_predictor
from app.ml.training_optimizer import adaptive_optimizer

def test_pace_calculation():
    # 5000m in 1500s (25 minutes) = 300 s/km = 5:00/km
    pace_sec = calculate_pace_sec_km(5000, 1500)
    assert pace_sec == 300.0
    assert format_pace(pace_sec) == "5:00/km"

def test_banister_trimp():
    # TRIMP should be positive and scale with duration & HR
    trimp_low = calculate_banister_trimp(duration_minutes=30, avg_hr=130, resting_hr=50, max_hr=190)
    trimp_high = calculate_banister_trimp(duration_minutes=30, avg_hr=175, resting_hr=50, max_hr=190)
    assert trimp_low > 0
    assert trimp_high > trimp_low

def test_acwr_classification():
    assert classify_acwr(0.6) == "under_training"
    assert classify_acwr(1.0) == "optimal"
    assert classify_acwr(1.35) == "overreaching"
    assert classify_acwr(1.6) == "high_risk"

def test_riegel_prediction():
    # 5K in 20:00 (1200s) -> 10K should be approx 41:30 - 42:00
    pred_10k_sec = riegel_race_prediction(5000, 1200, 10000)
    assert 2400 < pred_10k_sec < 2600

def test_race_predictor_engine():
    features = {
        "total_runs": 25,
        "weekly_km_avg": 35.0,
        "longest_run_km": 14.0,
        "estimated_vdot": 45.0
    }
    pred_5k = race_predictor.predict(features, target_distance="5K")
    assert "predicted_time_seconds" in pred_5k
    assert pred_5k["confidence_score"] > 0.7
    assert pred_5k["lower_bound_seconds"] < pred_5k["predicted_time_seconds"] < pred_5k["upper_bound_seconds"]

def test_adaptive_optimizer():
    # When ACWR is dangerously high (>1.4), plan should prescribe lower volume
    high_load_plan = adaptive_optimizer.generate_plan(
        current_weekly_km=40.0,
        target_distance="5K",
        current_acwr=1.55,
        vdot=42.0
    )
    assert high_load_plan["current_weekly_km"] < 40.0
    assert "reduced" in high_load_plan["adaptation_reason"].lower()
