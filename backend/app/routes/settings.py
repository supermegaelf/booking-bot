from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from app.models import SalonSettings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/", response_model=schemas.SalonSettingsResponse)
async def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SalonSettings).first()
    if not settings:
        default_settings = SalonSettings()
        db.add(default_settings)
        db.commit()
        db.refresh(default_settings)
        return default_settings
    return settings
