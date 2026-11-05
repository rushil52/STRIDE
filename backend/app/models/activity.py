from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Ingestion Source
    source: Mapped[str] = mapped_column(String(50), default="strava") # strava, gpx, fit, manual, synthetic
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True) # Strava activity ID or upload hash
    
    # Metadata
    title: Mapped[str] = mapped_column(String(255), default="Morning Run")
    activity_type: Mapped[str] = mapped_column(String(50), default="Run") # Run, TrailRun, TrackRun, Treadmill
    start_date: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    
    # Performance Metrics
    distance_meters: Mapped[float] = mapped_column(Float, nullable=False) # In meters
    moving_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False) # In seconds
    elapsed_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    elevation_gain_meters: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Derived & Physiological metrics
    average_speed_mps: Mapped[float] = mapped_column(Float, nullable=False) # meters per second
    average_pace_sec_km: Mapped[float] = mapped_column(Float, nullable=False) # seconds per kilometer
    average_heartrate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_heartrate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_cadence: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # steps/strides per min
    
    # Sports Science Calculations
    trimp_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Banister TRIMP
    rpe_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Rate of Perceived Exertion (1-10)
    feeling: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # strong, good, tired, exhausted
    workout_category: Mapped[str] = mapped_column(String(50), default="easy") # easy, tempo, interval, long_run, race, recovery
    
    # Rich time-series data or splits stream stored as JSON
    splits_data: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="activities")
