from fastapi import APIRouter

from .journal import router as journal_router
from .insights import router as insights_router
from .goals import router as goals_router
from .analytics import router as analytics_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(journal_router, prefix="/journal", tags=["journal"])
v1_router.include_router(insights_router, prefix="/insights", tags=["insights"])
v1_router.include_router(goals_router, prefix="/goals", tags=["goals"])
v1_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])


__all__ = ["v1_router"]
