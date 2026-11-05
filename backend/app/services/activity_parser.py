import io
from datetime import datetime, timezone
from typing import Dict, Any, List
import gpxpy
from fitparse import FitFile
from app.ml.sports_science import calculate_pace_sec_km

def parse_gpx_content(xml_bytes: bytes) -> Dict[str, Any]:
    """
    Parses GPX file binary content, extracting summary metrics and trackpoint samples.
    """
    gpx = gpxpy.parse(xml_bytes.decode("utf-8", errors="ignore"))
    
    total_distance_m = 0.0
    total_elevation_gain = 0.0
    start_time = None
    end_time = None
    points_count = 0
    hr_samples = []
    
    for track in gpx.tracks:
        for segment in track.segments:
            points = segment.points
            points_count += len(points)
            if not points:
                continue
            if start_time is None:
                start_time = points[0].time
            end_time = points[-1].time
            
            # Distance and elevation
            seg_dist = segment.length_3d() or segment.length_2d()
            if seg_dist:
                total_distance_m += seg_dist
                
            uphill, _ = segment.get_uphill_downhill()
            if uphill:
                total_elevation_gain += uphill
                
            for pt in points:
                # GPX extensions (Garmin TrackPointExtension)
                for ext in pt.extensions:
                    for child in ext:
                        if "hr" in child.tag.lower() or "heartrate" in child.tag.lower():
                            try:
                                hr_samples.append(float(child.text))
                            except (ValueError, TypeError):
                                pass
                                
    if start_time is None:
        start_time = datetime.now(timezone.utc)
    if end_time is None or end_time <= start_time:
        duration_sec = int(total_distance_m / 3.0) if total_distance_m > 0 else 1800
    else:
        duration_sec = int((end_time - start_time).total_seconds())
        
    duration_sec = max(1, duration_sec)
    avg_speed = total_distance_m / duration_sec
    avg_pace = calculate_pace_sec_km(total_distance_m, duration_sec)
    avg_hr = float(sum(hr_samples) / len(hr_samples)) if hr_samples else None
    max_hr = float(max(hr_samples)) if hr_samples else None
    
    return {
        "title": gpx.name or "Imported GPX Run",
        "activity_type": "Run",
        "start_date": start_time,
        "distance_meters": round(total_distance_m, 1),
        "moving_time_seconds": duration_sec,
        "elapsed_time_seconds": duration_sec,
        "elevation_gain_meters": round(total_elevation_gain, 1),
        "average_speed_mps": round(avg_speed, 2),
        "average_pace_sec_km": round(avg_pace, 1),
        "average_heartrate": avg_hr,
        "max_heartrate": max_hr,
        "source": "gpx"
    }

def parse_fit_content(fit_bytes: bytes) -> Dict[str, Any]:
    """
    Parses Garmin/Wahoo FIT file binary data using fitparse.
    """
    fitfile = FitFile(io.BytesIO(fit_bytes))
    
    total_distance_m = 0.0
    total_timer_time = 0
    total_elapsed_time = 0
    total_elevation_gain = 0.0
    avg_hr = None
    max_hr = None
    start_time = None
    
    # Check session messages first for exact summary
    for record in fitfile.get_messages("session"):
        data = record.get_values()
        if "total_distance" in data and data["total_distance"] is not None:
            total_distance_m = float(data["total_distance"])
        if "total_timer_time" in data and data["total_timer_time"] is not None:
            total_timer_time = int(data["total_timer_time"])
        if "total_elapsed_time" in data and data["total_elapsed_time"] is not None:
            total_elapsed_time = int(data["total_elapsed_time"])
        if "total_ascent" in data and data["total_ascent"] is not None:
            total_elevation_gain = float(data["total_ascent"])
        if "avg_heart_rate" in data and data["avg_heart_rate"] is not None:
            avg_hr = float(data["avg_heart_rate"])
        if "max_heart_rate" in data and data["max_heart_rate"] is not None:
            max_hr = float(data["max_heart_rate"])
        if "start_time" in data and data["start_time"] is not None:
            start_time = data["start_time"]
            
    if start_time is None:
        start_time = datetime.now(timezone.utc)
    if total_timer_time <= 0:
        total_timer_time = total_elapsed_time if total_elapsed_time > 0 else 1800
    if total_elapsed_time <= 0:
        total_elapsed_time = total_timer_time
        
    avg_speed = total_distance_m / max(1, total_timer_time)
    avg_pace = calculate_pace_sec_km(total_distance_m, total_timer_time)
    
    return {
        "title": "Imported FIT Workout",
        "activity_type": "Run",
        "start_date": start_time,
        "distance_meters": round(total_distance_m, 1),
        "moving_time_seconds": total_timer_time,
        "elapsed_time_seconds": total_elapsed_time,
        "elevation_gain_meters": round(total_elevation_gain, 1),
        "average_speed_mps": round(avg_speed, 2),
        "average_pace_sec_km": round(avg_pace, 1),
        "average_heartrate": avg_hr,
        "max_heartrate": max_hr,
        "source": "fit"
    }
