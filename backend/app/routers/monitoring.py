"""监测项与实时数据。"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/items", response_model=list[schemas.MonitoringItemOut])
def list_monitoring_items(project_id: str = "juli", db: Session = Depends(get_db)):
    return (
        db.query(models.MonitoringItem)
        .filter(models.MonitoringItem.project_id == project_id)
        .all()
    )
