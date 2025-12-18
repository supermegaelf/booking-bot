from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    telegram_bot_token: Optional[str] = None
    upload_dir: str = "./uploads"
    max_upload_size: int = 10485760
    admin_telegram_id: Optional[int] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

