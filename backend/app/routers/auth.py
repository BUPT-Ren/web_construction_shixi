"""登录与当前用户。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return schemas.TokenResponse(
        access_token=create_access_token(user.username, user.role),
        username=user.username,
        role=user.role,
    )


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {"username": user.username, "role": user.role}
