# 桥梁监测后端

FastAPI、SQLAlchemy 2.x、SQLite、Pydantic v2 和 PyJWT 组成的本地演示服务。接口版本为 `0.1.0`。前端目前仅登录及系统设置直接使用该后端，其他主要业务页面仍读取前端演示数据。

## 启动

在项目根目录执行以下命令。

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python run.py
```

Windows PowerShell 使用 `.\.venv\Scripts\Activate.ps1` 激活环境。

`run.py` 默认监听 `127.0.0.1:8000` 并启用开发热重载。Swagger 位于 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)，接口规范位于 [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)。

服务启动时创建缺失的表。数据库中没有用户时，会写入演示账号和业务种子数据。已有数据库不会自动同步种子数据的修改，目前也没有数据库迁移工具。

## 数据库与登录

数据库地址为 `sqlite:///./shm.db`，相对于进程工作目录。按上述命令运行时文件为 `backend/shm.db`，已在根目录 Git 忽略规则中排除。

初始账号为管理员 `admin/admin123` 和工程师 `engineer/engineer123`。管理员可创建角色为 `admin`、`engineer` 或 `viewer` 的账号。密码采用带随机盐的 PBKDF2-HMAC-SHA256 哈希存储，人员接口不返回密码或哈希。

登录成功返回 JWT，默认有效期为 24 小时。受保护接口使用以下请求头。

```text
Authorization: Bearer <access_token>
```

签名密钥读取环境变量 `SHM_SECRET_KEY`。未设置时每个进程生成随机密钥，后端重启、热重载或不同工作进程可能导致原令牌失效。需要稳定会话时，在启动前由运行环境提供相同的高强度密钥。

前端的离线演示身份没有后端 JWT，无法访问系统设置接口。后端角色判断基于数据库中的当前角色。

## 业务接口

### 认证

- `POST /auth/login` 接受 `username` 和 `password`，返回 `access_token`、`token_type`、`username` 和 `role`。
- `GET /auth/me` 返回当前账号和角色，需要登录。

### 桥梁、设备与监测

- `GET /projects`、`GET /projects/{project_id}` 查询工程。
- `POST /projects`、`PUT /projects/{project_id}`、`DELETE /projects/{project_id}` 管理工程，需要管理员。
- `GET /devices`、`GET /devices/{code}` 查询设备。
- `GET /monitoring/items?project_id=juli` 查询监测项当前记录，另一工程 ID 为 `lekai`。

前端项目管理尚未调用项目 CRUD 接口。设备、测点和预警阈值尚无完整 CRUD 接口。当前也没有历史时序查询接口，前端数据查询页使用生成的演示样本。

### 报警与工单

- `GET /alarms` 查询报警记录。
- `POST /alarms` 新增演示报警，需要工程师或管理员。
- `GET /work-orders` 查询工单。
- `POST /work-orders/{order_id}/advance` 推进工单阶段，需要工程师或管理员。

工单阶段依次为在线审批、现场联动处置、已闭环归档。当前前端的演示工单操作尚未对接该流转接口。

## 系统设置接口

以下接口均要求管理员 JWT，前端入口为“系统设置”。

### 人员管理

- `GET /settings/users` 返回账号列表，字段为 `id`、`username`、`role`。
- `POST /settings/users` 新增账号。
- `PUT /settings/users/{user_id}` 修改账号、角色，或重置密码。
- `DELETE /settings/users/{user_id}` 删除账号。

新增请求示例仅使用占位密码。

```json
{
  "username": "operator01",
  "role": "engineer",
  "password": "<至少6位的初始密码>"
}
```

账号为 2–64 位英文字母、数字、下划线、点或连字符。密码为 6–128 位。编辑时省略 `password` 可保持原密码。重复账号返回 409。

不能删除当前登录账号或最后一个管理员，也不能修改当前管理员自己的账号名或角色。没有认证、认证过期和权限不足分别返回 401 或 403。

### AI 配置

- `GET /settings/ai` 返回 `provider`、`model` 和布尔字段 `has_key`。
- `PUT /settings/ai` 保存服务商和模型，可同时新增或替换密钥。
- `DELETE /settings/ai/key` 删除密钥，保留服务商和模型。

```json
{
  "provider": "示例服务商",
  "model": "示例模型名",
  "api_key": "<测试密钥>"
}
```

PUT 时省略 `api_key` 或传 `null` 会保留原密钥，传空字符串会清空。页面编辑密钥时留空会省略该字段，明确删除通过删除按钮完成。读取接口不会返回密钥原文。

配置保存到 `system_settings` 表。当前密钥以明文存储在本地 SQLite 中，应限制数据库和备份的访问，并使用测试密钥。尚未接入外部 AI 请求、密钥加密、连接测试或多供应商配置。前端问答继续使用本地知识库。

## 系统信息与运行边界

系统设置页从 OpenAPI 的 `info.version` 读取版本，修改接口版本需更新 `app/main.py` 并发布代码，页面只读展示。

当前跨域配置允许所有来源，业务读取接口也有匿名访问能力。服务默认仅监听回环地址。公开部署前需要配置 HTTPS、来源限制、业务权限、审计和密钥保护。界面中的安全规范与认证描述属于演示内容。

后端模型包含用户、工程、设备、监测项、报警、工单和系统设置。数据库结构变更、真实采集及完整配置 CRUD 尚需进一步实现。

## 代码定位

- `app/main.py` 注册路由、创建表并初始化数据。
- `app/database.py` 配置 SQLite 和会话。
- `app/models.py` 定义 ORM 模型，`app/schemas.py` 定义业务请求和响应。
- `app/security.py` 实现密码哈希和 JWT。
- `app/deps.py` 提供认证和角色检查。
- `app/routers/settings.py` 定义人员及 AI 配置请求模型和 CRUD。
- `app/seed.py` 提供初始演示数据。

完整前端功能和启动说明见 [项目 README](../README.md)。
