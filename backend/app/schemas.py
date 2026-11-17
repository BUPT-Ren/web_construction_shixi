"""Pydantic 请求 / 响应模型。"""

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- 鉴权 ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


# ---------- 项目 ----------
class ProjectBase(BaseModel):
    name: str
    type: str = ""
    location: str = ""
    span: str = ""
    status: str = ""
    health_score: float = 0.0
    health_level: str = ""
    image: str | None = None
    description: str = ""


class ProjectCreate(ProjectBase):
    id: str


class ProjectOut(ProjectBase, ORMModel):
    id: str


# ---------- 设备 ----------
class DeviceOut(ORMModel):
    id: int
    code: str
    type: str
    bridge: str
    status: str
    voltage: str
    rssi: str
    last_upload: str


# ---------- 监测项 ----------
class MonitoringItemOut(ORMModel):
    id: int
    project_id: str
    name: str
    value: float
    unit: str
    status: str


# ---------- 报警 ----------
class AlarmCreate(BaseModel):
    project_id: str
    item_name: str
    level: str
    value: str
    threshold: str


class AlarmOut(ORMModel):
    id: int
    project_id: str
    item_name: str
    level: str
    value: str
    threshold: str
    time: str
    status: str


# ---------- 工单 ----------
class WorkOrderOut(ORMModel):
    id: str
    bridge: str
    sensor: str
    type: str
    level: str
    trigger_value: str
    time: str
    stage: str
    handler: str
    proposal: str
