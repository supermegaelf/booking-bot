from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import (
    webhook,
    services,
    masters,
    bookings,
    certificates,
    promotions,
    reviews,
    settings as settings_route,
    users
)
import logging
import os
import httpx

logger = logging.getLogger(__name__)

app = FastAPI(title="Booking Bot API", version="1.0.0")

app.include_router(webhook.router)
app.include_router(services.router)
app.include_router(masters.router)
app.include_router(bookings.router)
app.include_router(certificates.router)
app.include_router(promotions.router)
app.include_router(reviews.router)
app.include_router(settings_route.router)
app.include_router(users.router)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    if os.getenv("TELEGRAM_BOT_TOKEN"):
        try:
            from app.routes.webhook import create_bot_application, set_bot_application
            
            bot_app = await create_bot_application()
            set_bot_application(bot_app)
            logger.info("Bot application initialized in FastAPI")
        except Exception as e:
            logger.warning(f"Failed to initialize bot application: {e}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all(request: Request, path: str):
    if path.startswith("api/") or path.startswith("webhook/") or path in ["health", "docs", "openapi.json", "redoc"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    
    async with httpx.AsyncClient() as client:
        url = f"{FRONTEND_URL}/{path}" if path else FRONTEND_URL
        try:
            headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]}
            response = await client.request(
                method=request.method,
                url=url,
                params=dict(request.query_params),
                headers=headers,
                content=await request.body() if request.method in ["POST", "PUT", "PATCH"] else None,
                timeout=30.0,
                follow_redirects=True
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers={k: v for k, v in response.headers.items() if k.lower() not in ["content-encoding", "transfer-encoding"]},
                media_type=response.headers.get("content-type")
            )
        except Exception as e:
            logger.error(f"Error proxying to frontend: {e}")
            return Response(content=f"Frontend unavailable: {str(e)}", status_code=503)

