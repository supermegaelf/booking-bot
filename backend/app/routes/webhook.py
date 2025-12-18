from fastapi import APIRouter, Request, Header, HTTPException
from telegram import Update
from telegram.ext import Application, CommandHandler
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import logging
import json
from urllib.parse import unquote

logger = logging.getLogger(__name__)

router = APIRouter()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET")

bot_application = None


async def start_handler(update: Update, context):
    keyboard = [
        [InlineKeyboardButton("Открыть приложение", web_app={"url": "https://bot.familiartaste.info"})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Добро пожаловать в LL BeautyBar!\n\nНажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=reply_markup
    )


async def create_bot_application():
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN не установлен")
    
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_handler))
    await application.initialize()
    return application


def set_bot_application(app: Application):
    global bot_application
    bot_application = app


@router.post("/webhook/{token}")
async def webhook_endpoint(
    token: str,
    request: Request,
    x_telegram_bot_api_secret_token: str = Header(None, alias="X-Telegram-Bot-Api-Secret-Token")
):
    decoded_token = unquote(token)
    if not TELEGRAM_BOT_TOKEN or decoded_token != TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    if TELEGRAM_WEBHOOK_SECRET and x_telegram_bot_api_secret_token != TELEGRAM_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret token")
    
    if not bot_application:
        raise HTTPException(status_code=503, detail="Bot application not initialized")
    
    try:
        body = await request.body()
        data = json.loads(body)
        update = Update.de_json(data, bot_application.bot)
        await bot_application.process_update(update)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Error processing webhook update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

