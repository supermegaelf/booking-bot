from fastapi import FastAPI
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

