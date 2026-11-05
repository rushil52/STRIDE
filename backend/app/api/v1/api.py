from fastapi import APIRouter
from app.api.v1.endpoints import auth, activities, analytics, strava

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Optimization"])
api_router.include_router(strava.router, prefix="/strava", tags=["Strava Integration"])
