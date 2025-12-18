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
    await update.message.reply_text("Добро пожаловать в LL BeautyBar!")


async def webhook_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"Received update: {update}")


def main():
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN не установлен")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))

    if TELEGRAM_WEBHOOK_URL:
        application.run_webhook(
            listen="0.0.0.0",
            port=8443,
            url_path=TELEGRAM_BOT_TOKEN,
            webhook_url=f"{TELEGRAM_WEBHOOK_URL}/webhook/{TELEGRAM_BOT_TOKEN}",
            secret_token=TELEGRAM_WEBHOOK_SECRET,
        )
        logger.info("Bot started with webhook")
    else:
        application.run_polling()
        logger.info("Bot started with polling")


if __name__ == "__main__":
    main()

