# 后端 Demo（Python + FastAPI）

工程结构智能监测系统的后端骨架，为前端 11 个页面提供 REST 接口，使用 SQLite 存储演示数据。

## 技术栈

- FastAPI + Uvicorn
- SQLAlchemy 2.x + SQLite
- PyJWT（登录鉴权）
- Pydantic v2（请求 / 响应模型）

## 启动

```bash
cd backend
pip install -r requirements.txt
python run.py
```

启动后：

- 接口文档（Swagger）：http://127.0.0.1:8000/docs
- 服务根路径：http://127.0.0.1:8000/

首次启动会自动创建 `shm.db` 并写入演示数据。

## 演示账号

- 管理员：`admin` / `admin123`（角色 admin）
- 工程师：`engineer` / `engineer123`（角色 engineer）

## 主要接口

- `POST /auth/login` 登录获取 JWT
- `GET  /auth/me` 当前用户（需登录）
- `GET  /projects` 项目列表；`POST /projects` 新增（需 admin）
- `GET  /devices` 设备列表
- `GET  /monitoring/items?project_id=juli` 监测项实时数据
- `GET  /alarms` 报警事件；`POST /alarms` 模拟触发（需 engineer/admin）
- `GET  /work-orders` 工单；`POST /work-orders/{id}/advance` 流转（需 engineer/admin）

## 目录结构

```
backend/
├── run.py                 # 启动入口
├── requirements.txt       # 依赖
└── app/
    ├── main.py            # 应用与路由注册
    ├── database.py        # 数据库连接
    ├── models.py          # ORM 模型
    ├── schemas.py         # Pydantic 模型
    ├── security.py        # 密码哈希与 JWT
    ├── deps.py            # 鉴权依赖
    ├── seed.py            # 演示数据
    └── routers/           # 各业务路由
```
