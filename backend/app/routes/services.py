from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas
from app.models import Service

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/", response_model=List[schemas.ServiceResponse])
async def get_services(
    category: str = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Service)
    
    if is_active:
        query = query.filter(Service.is_active == True)
    
    if category:
        query = query.filter(Service.category == category)
    
    services = query.all()
    return services


@router.get("/{service_id}", response_model=schemas.ServiceResponse)
async def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.get("/categories/list", response_model=List[str])
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Service.category).distinct().filter(
        Service.category.isnot(None),
        Service.is_active == True
    ).all()
    return [cat[0] for cat in categories if cat[0]]
