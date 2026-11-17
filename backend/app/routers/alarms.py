"""报警事件列表与模拟触发。"""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/alarms", tags=["alarms"])


@router.get("", response_model=list[schemas.AlarmOut])
def list_alarms(db: Session = Depends(get_db)):
    return db.query(models.AlarmEvent).order_by(models.AlarmEvent.id.desc()).all()


@router.post("", response_model=schemas.AlarmOut, dependencies=[Depends(require_role("engineer", "admin"))])
def create_alarm(body: schemas.AlarmCreate, db: Session = Depends(get_db)):
    alarm = models.AlarmEvent(
        project_id=body.project_id,
        item_name=body.item_name,
        level=body.level,
        value=body.value,
        threshold=body.threshold,
        time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="open",
    )
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return alarm
