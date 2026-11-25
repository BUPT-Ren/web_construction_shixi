"""FastAPI 应用入口。"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  # 确保模型注册到 Base
from .database import Base, SessionLocal, engine
from .routers import alarms, auth, devices, monitoring, projects, settings, workorders
from .seed import seed

app = FastAPI(title="工程结构智能监测系统 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(devices.router)
app.include_router(monitoring.router)
app.include_router(alarms.router)
app.include_router(workorders.router)
app.include_router(settings.router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"service": "工程结构智能监测系统 API", "docs": "/docs"}
