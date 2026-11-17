"""现场传感设备列表与详情。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[schemas.DeviceOut])
def list_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).all()


@router.get("/{code}", response_model=schemas.DeviceOut)
def get_device(code: str, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.code == code).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return device
