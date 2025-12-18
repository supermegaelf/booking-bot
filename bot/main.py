import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_WEBHOOK_URL = os.getenv("TELEGRAM_WEBHOOK_URL")
TELEGRAM_WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    
    keyboard = [
        [InlineKeyboardButton("Открыть приложение", web_app={"url": "https://bot.familiartaste.info"})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Добро пожаловать в LL BeautyBar!\n\nНажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=reply_markup
    )


async def webhook_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"Received update: {update}")


def main():
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN не установлен")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))

    if not TELEGRAM_WEBHOOK_URL:
        raise ValueError("TELEGRAM_WEBHOOK_URL не установлен")
    
    if TELEGRAM_WEBHOOK_URL:
        if TELEGRAM_WEBHOOK_URL.endswith("/webhook"):
            webhook_url = f"{TELEGRAM_WEBHOOK_URL}/{TELEGRAM_BOT_TOKEN}"
        else:
            webhook_url = f"{TELEGRAM_WEBHOOK_URL}/webhook/{TELEGRAM_BOT_TOKEN}"
        
        application.run_webhook(
            listen="0.0.0.0",
            port=8443,
            url_path=TELEGRAM_BOT_TOKEN,
            webhook_url=webhook_url,
            secret_token=TELEGRAM_WEBHOOK_SECRET,
        )
        logger.info(f"Bot started with webhook: {webhook_url}")


if __name__ == "__main__":
    main()

