"""Administrator-managed users and server-side AI configuration."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import get_current_user, require_role
from ..security import hash_password

router = APIRouter(prefix="/settings", tags=["settings"])
admin = Depends(require_role("admin"))


class UserInput(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    role: Literal["admin", "engineer", "viewer"]
    password: str | None = Field(default=None, min_length=6, max_length=128)


class AIInput(BaseModel):
    provider: str = Field(default="", max_length=100)
    model: str = Field(default="", max_length=100)
    api_key: str | None = Field(default=None, max_length=1000)


def serialize_user(user):
    return {"id": user.id, "username": user.username, "role": user.role}


@router.get("/users", dependencies=[admin])
def users(db: Session = Depends(get_db)):
    return [serialize_user(user) for user in db.query(models.User).order_by(models.User.id).all()]


@router.post("/users", dependencies=[admin], status_code=201)
def create_user(body: UserInput, db: Session = Depends(get_db)):
    if not body.password:
        raise HTTPException(422, "请输入初始密码")
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(409, "账号已存在")
    user = models.User(username=body.username, role=body.role, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.put("/users/{user_id}", dependencies=[admin])
def update_user(user_id: int, body: UserInput, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "账号不存在")
    duplicate = db.query(models.User).filter(models.User.username == body.username, models.User.id != user_id).first()
    if duplicate:
        raise HTTPException(409, "账号已存在")
    if user.id == current.id and (body.role != "admin" or body.username != current.username):
        raise HTTPException(400, "不能修改当前管理员的账号或角色")
    if user.role == "admin" and body.role != "admin" and db.query(models.User).filter_by(role="admin").count() <= 1:
        raise HTTPException(400, "至少保留一个管理员")
    user.username, user.role = body.username, body.role
    if body.password:
        user.hashed_password = hash_password(body.password)
    db.commit()
    return serialize_user(user)


@router.delete("/users/{user_id}", dependencies=[admin])
def delete_user(user_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "账号不存在")
    if user.id == current.id or (user.role == "admin" and db.query(models.User).filter_by(role="admin").count() <= 1):
        raise HTTPException(400, "不能删除当前账号或最后一个管理员")
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/ai", dependencies=[admin])
def get_ai(db: Session = Depends(get_db)):
    values = {s.key: s.value for s in db.query(models.SystemSetting).all()}
    return {"provider": values.get("ai_provider", ""), "model": values.get("ai_model", ""), "has_key": bool(values.get("ai_key"))}


@router.put("/ai", dependencies=[admin])
def update_ai(body: AIInput, db: Session = Depends(get_db)):
    values = {"ai_provider": body.provider.strip(), "ai_model": body.model.strip()}
    if body.api_key is not None:
        values["ai_key"] = body.api_key.strip()
    for key, value in values.items():
        setting = db.get(models.SystemSetting, key)
        if setting:
            setting.value = value
        else:
            db.add(models.SystemSetting(key=key, value=value))
    db.commit()
    return get_ai(db)


@router.delete("/ai/key", dependencies=[admin])
def delete_key(db: Session = Depends(get_db)):
    setting = db.get(models.SystemSetting, "ai_key")
    if setting:
        db.delete(setting)
        db.commit()
    return {"ok": True}
