"""ORM 模型定义。"""

from sqlalchemy import Column, Float, ForeignKey, Integer, String

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer")  # admin / engineer / viewer


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False, default="")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, default="")
    location = Column(String, default="")
    span = Column(String, default="")
    status = Column(String, default="")
    health_score = Column(Float, default=0.0)
    health_level = Column(String, default="")
    image = Column(String, nullable=True)
    description = Column(String, default="")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, default="")
    bridge = Column(String, default="")
    status = Column(String, default="online")
    voltage = Column(String, default="")
    rssi = Column(String, default="")
    last_upload = Column(String, default="")


class MonitoringItem(Base):
    __tablename__ = "monitoring_items"

    id = Column(Integer, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True)
    name = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    unit = Column(String, default="")
    status = Column(String, default="normal")


class AlarmEvent(Base):
    __tablename__ = "alarm_events"

    id = Column(Integer, primary_key=True)
    project_id = Column(String, default="")
    item_name = Column(String, default="")
    level = Column(String, default="三级预警")
    value = Column(String, default="")
    threshold = Column(String, default="")
    time = Column(String, default="")
    status = Column(String, default="open")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String, primary_key=True)
    bridge = Column(String, default="")
    sensor = Column(String, default="")
    type = Column(String, default="")
    level = Column(String, default="")
    trigger_value = Column(String, default="")
    time = Column(String, default="")
    stage = Column(String, default="在线审批")
    handler = Column(String, default="")
    proposal = Column(String, default="")
