"""预警工单流转。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/work-orders", tags=["work-orders"])

STAGE_FLOW = ["在线审批", "现场联动处置", "已闭环归档"]


@router.get("", response_model=list[schemas.WorkOrderOut])
def list_work_orders(db: Session = Depends(get_db)):
    return db.query(models.WorkOrder).all()


@router.post("/{order_id}/advance", response_model=schemas.WorkOrderOut, dependencies=[Depends(require_role("engineer", "admin"))])
def advance_work_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(models.WorkOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    if order.stage in STAGE_FLOW:
        idx = STAGE_FLOW.index(order.stage)
        if idx < len(STAGE_FLOW) - 1:
            order.stage = STAGE_FLOW[idx + 1]
    db.commit()
    db.refresh(order)
    return order
