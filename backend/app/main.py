from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
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

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:5173")


class FrontendProxyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        if path.startswith("/api/") or path.startswith("/webhook/") or path in ["/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)
        
        if request.method in ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]:
            async with httpx.AsyncClient() as client:
                url = f"{FRONTEND_URL}{path}" if path else FRONTEND_URL
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
        
        return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(FrontendProxyMiddleware)

app.include_router(webhook.router)
app.include_router(services.router)
app.include_router(masters.router)
app.include_router(bookings.router)
app.include_router(certificates.router)
app.include_router(promotions.router)
app.include_router(reviews.router)
app.include_router(settings_route.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    try:
        from app.database import SessionLocal
        from app.models import Service, Master
        from app.models.master import master_service_association
        from decimal import Decimal
        
        db = SessionLocal()
        try:
            existing_services = db.query(Service).count()
            if existing_services == 0:
                test_services = [
                    Service(
                        name="Маникюр",
                        category="Маникюр",
                        description="Классический маникюр с покрытием гель-лак",
                        price=Decimal("1500.00"),
                        duration_minutes=90,
                        is_active=True
                    ),
                    Service(
                        name="Брови",
                        category="Брови",
                        description="Коррекция и окрашивание бровей",
                        price=Decimal("1200.00"),
                        duration_minutes=60,
                        is_active=True
                    ),
                    Service(
                        name="Педикюр",
                        category="Педикюр",
                        description="Классический педикюр с покрытием гель-лак",
                        price=Decimal("1800.00"),
                        duration_minutes=90,
                        is_active=True
                    ),
                    Service(
                        name="Мейк",
                        category="Макияж",
                        description="Дневной макияж",
                        price=Decimal("2500.00"),
                        duration_minutes=60,
                        is_active=True
                    ),
                    Service(
                        name="Шугаринг",
                        category="Депиляция",
                        description="Шугаринг ног",
                        price=Decimal("800.00"),
                        duration_minutes=30,
                        is_active=True
                    ),
                    Service(
                        name="Массаж",
                        category="Массаж",
                        description="Расслабляющий массаж тела",
                        price=Decimal("2000.00"),
                        duration_minutes=60,
                        is_active=True
                    ),
                    Service(
                        name="Укладка",
                        category="Прическа",
                        description="Укладка волос",
                        price=Decimal("1500.00"),
                        duration_minutes=45,
                        is_active=True
                    )
                ]
                
                for service in test_services:
                    db.add(service)
                db.commit()
                logger.info(f"Added {len(test_services)} test services")
            else:
                logger.info(f"Database already has {existing_services} services")
            
            existing_masters = db.query(Master).count()
            if existing_masters == 0:
                services = db.query(Service).all()
                service_map = {s.name: s.id for s in services}
                
                test_masters = [
                    {
                        "name": "Анна М.",
                        "specialization": "Мастер маникюра и педикюра",
                        "services": ["Маникюр", "Педикюр"],
                        "work_schedule": {
                            "monday": {"start": "09:00", "end": "18:00"},
                            "tuesday": {"start": "09:00", "end": "18:00"},
                            "wednesday": {"start": "09:00", "end": "18:00"},
                            "thursday": {"start": "09:00", "end": "18:00"},
                            "friday": {"start": "09:00", "end": "18:00"},
                            "saturday": {"start": "10:00", "end": "16:00"}
                        }
                    },
                    {
                        "name": "Диана М.",
                        "specialization": "Массажист",
                        "services": ["Массаж"],
                        "work_schedule": {
                            "monday": {"start": "10:00", "end": "19:00"},
                            "tuesday": {"start": "10:00", "end": "19:00"},
                            "wednesday": {"start": "10:00", "end": "19:00"},
                            "thursday": {"start": "10:00", "end": "19:00"},
                            "friday": {"start": "10:00", "end": "19:00"},
                            "saturday": {"start": "11:00", "end": "17:00"}
                        }
                    },
                    {
                        "name": "Елена К.",
                        "specialization": "Визажист и бровист",
                        "services": ["Мейк", "Брови"],
                        "work_schedule": {
                            "monday": {"start": "09:00", "end": "18:00"},
                            "tuesday": {"start": "09:00", "end": "18:00"},
                            "wednesday": {"start": "09:00", "end": "18:00"},
                            "thursday": {"start": "09:00", "end": "18:00"},
                            "friday": {"start": "09:00", "end": "18:00"},
                            "saturday": {"start": "10:00", "end": "16:00"}
                        }
                    },
                    {
                        "name": "Мария С.",
                        "specialization": "Парикмахер",
                        "services": ["Укладка"],
                        "work_schedule": {
                            "monday": {"start": "09:00", "end": "18:00"},
                            "tuesday": {"start": "09:00", "end": "18:00"},
                            "wednesday": {"start": "09:00", "end": "18:00"},
                            "thursday": {"start": "09:00", "end": "18:00"},
                            "friday": {"start": "09:00", "end": "18:00"},
                            "saturday": {"start": "10:00", "end": "16:00"}
                        }
                    },
                    {
                        "name": "Ольга В.",
                        "specialization": "Мастер депиляции",
                        "services": ["Шугаринг"],
                        "work_schedule": {
                            "monday": {"start": "10:00", "end": "19:00"},
                            "tuesday": {"start": "10:00", "end": "19:00"},
                            "wednesday": {"start": "10:00", "end": "19:00"},
                            "thursday": {"start": "10:00", "end": "19:00"},
                            "friday": {"start": "10:00", "end": "19:00"},
                            "saturday": {"start": "11:00", "end": "17:00"}
                        }
                    }
                ]
                
                for master_data in test_masters:
                    master = Master(
                        name=master_data["name"],
                        specialization=master_data["specialization"],
                        work_schedule=master_data["work_schedule"],
                        is_active=True
                    )
                    db.add(master)
                    db.flush()
                    
                    for service_name in master_data["services"]:
                        if service_name in service_map:
                            db.execute(
                                master_service_association.insert().values(
                                    master_id=master.id,
                                    service_id=service_map[service_name]
                                )
                            )
                
                db.commit()
                logger.info(f"Added {len(test_masters)} test masters")
            else:
                logger.info(f"Database already has {existing_masters} masters")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Failed to add test data: {e}")
    
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

