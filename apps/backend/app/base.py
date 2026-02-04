import os

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .api import health_check, v1_router, RequestIDMiddleware
from .core import (
    settings,
    async_engine,
    setup_logging,
    custom_http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from .models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create demo user if it doesn't exist
    from sqlalchemy.ext.asyncio import AsyncSession
    from .models import User
    from sqlalchemy import select
    
    async with AsyncSession(async_engine) as session:
        result = await session.execute(select(User).where(User.id == 1))
        demo_user = result.scalar_one_or_none()
        
        if not demo_user:
            demo_user = User(
                id=1,
                email="demo@jottit.ai",
                name="Demo User"
            )
            session.add(demo_user)
            await session.commit()
    
    yield
    await async_engine.dispose()


def create_app() -> FastAPI:
    """
    configure and create the FastAPI application instance.
    """
    setup_logging()

    app = FastAPI(
        title=settings.PROJECT_NAME,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY, same_site="lax"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)

    app.add_exception_handler(HTTPException, custom_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    if os.path.exists(settings.FRONTEND_PATH):
        app.mount(
            "/app",
            StaticFiles(directory=settings.FRONTEND_PATH, html=True),
            name=settings.PROJECT_NAME,
        )

    app.include_router(health_check)
    app.include_router(v1_router)

    return app
