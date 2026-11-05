from datetime import date
from typing import Optional
from sqlalchemy import Integer, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class DailyMetric(Base, TimestampMixin):
    """
    Tracks daily training load, volume, acute-to-chronic workload ratio (ACWR),
    and fatigue states according to Bannister Impulse-Response & EWMA models.
    """
    __tablename__ = "daily_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    metric_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    
    # Volume metrics for the day
    total_distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    total_moving_time_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    daily_trimp: Mapped[float] = mapped_column(Float, default=0.0) # Sum of TRIMP for the day
    
    # Rolling Workloads (EWMA / rolling sum)
    acute_workload_7d: Mapped[float] = mapped_column(Float, default=0.0) # Fatigue indicator (~7 days)
    chronic_workload_28d: Mapped[float] = mapped_column(Float, default=0.0) # Fitness indicator (~28 days)
    acwr: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Acute:Chronic Workload Ratio
    
    # Rolling 7-day mileage
    rolling_7d_distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    rolling_28d_distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Qualitative / Recovery indicators
    average_rpe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="training_metrics")
