from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Profile & Physiological parameters
    max_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=190)
    resting_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=55)
    weekly_mileage_goal_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=30.0)
    target_race_distance: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="5K") # 5K, 10K, Half, Full
    target_race_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    target_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # e.g. 1320s = 22:00
    experience_level: Mapped[str] = mapped_column(String(50), default="intermediate") # beginner, intermediate, advanced

    # Strava Integration Credentials & Tokens
    strava_athlete_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, nullable=True, index=True)
    strava_access_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    strava_refresh_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    strava_token_expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    strava_scope: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    training_metrics: Mapped[List["DailyMetric"]] = relationship("DailyMetric", back_populates="user", cascade="all, delete-orphan")
    predictions: Mapped[List["RacePrediction"]] = relationship("RacePrediction", back_populates="user", cascade="all, delete-orphan")
    training_plans: Mapped[List["TrainingPlan"]] = relationship("TrainingPlan", back_populates="user", cascade="all, delete-orphan")
