from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import settings
from app.routes import webhook
import logging
import os
import httpx

logger = logging.getLogger(__name__)

app = FastAPI(title="Booking Bot API", version="1.0.0")

app.include_router(webhook.router)

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
async def proxy_frontend(request: Request, path: str):
    # Don't proxy API routes, webhook, or health check
    if path.startswith("api/") or path.startswith("webhook/") or path == "health":
        return Response(content="Not Found", status_code=404)
    
    async with httpx.AsyncClient() as client:
        # Construct URL - add path only if it's not empty
        if path:
            url = f"{FRONTEND_URL}/{path}"
        else:
            url = FRONTEND_URL
        params = dict(request.query_params)
        
        # Prepare headers - remove host and content-length, set proper host for Vite
        headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]}
        # Set Host header to localhost to bypass Vite host checking
        headers["Host"] = "localhost:5173"
        
        try:
            response = await client.request(
                method=request.method,
                url=url,
                params=params,
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

