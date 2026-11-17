"""初始化演示数据（首次启动时若数据库为空则写入）。"""

from sqlalchemy.orm import Session

from . import models
from .security import hash_password


def seed(db: Session) -> None:
    if db.query(models.User).first():
        return

    # 用户
    db.add_all([
        models.User(username="admin", hashed_password=hash_password("admin123"), role="admin"),
        models.User(username="engineer", hashed_password=hash_password("engineer123"), role="engineer"),
    ])

    # 项目
    db.add_all([
        models.Project(id="juli", name="保定巨力大桥", type="独塔斜拉桥", location="河北省保定市",
                       span="主跨 160m + 边跨 100m", status="正常服役监测中", health_score=94.6,
                       health_level="A级 (良好稳定)", image="assets/img/juli_project_real.jpeg",
                       description="考虑非线性效应的快速调索方法与健康监测，建立高精度实测模态有限元修正模型。"),
        models.Project(id="lekai", name="保定乐凯大街转体斜拉桥", type="大吨位双塔转体斜拉桥", location="河北省保定市跨铁路枢纽",
                       span="跨京广铁路等21条铁路线", status="数字孪生试验与在线监测", health_score=96.2,
                       health_level="A级 (优良)", image="assets/img/lekai_scale_model.jpeg",
                       description="应用 1:50 缩尺数字孪生试验模型结合在线健康监测平台。"),
        models.Project(id="hengzhou", name="横州大桥", type="特大跨斜拉桥施工期", location="广西横州",
                       span="主跨 400m 级斜拉桥", status="工程施工控制", health_score=92.8,
                       health_level="A级 (受控优良)", image="assets/img/bridge_hero.jpeg",
                       description="斜拉桥施工控制：调索、桥面板吊装、线形偏差控制与有限元模型修正。"),
        models.Project(id="xingtai", name="邢台金融中心超高层建筑", type="超高层地标框架-核心筒", location="河北省邢台市",
                       span="高 180m 框架-核心筒结构", status="长期健康监测", health_score=95.1,
                       health_level="A级 (稳定)", image="",
                       description="风载与温湿度环境实时健康监测，应用 PCA 消除环境温度非线性影响。"),
        models.Project(id="tangxian", name="唐县跨渠桥群", type="梁式 / 预应力连续梁桥群", location="河北省唐县 (跨南水北调中线)",
                       span="城西桥、军营桥、唐县北桥、向阳大桥", status="桥群联网集约化监控", health_score=93.4,
                       health_level="A级 (正常)", image="",
                       description="四座跨南水北调干渠重点桥梁实施桥群化部署，环境—作用—响应全覆盖监测。"),
    ])

    # 监测项（巨力大桥 11 类）
    items = [
        ("风速风向", 3.4, "m/s"), ("梁端纵向位移", 18.6, "mm"), ("主梁振动", 0.045, "m/s²"),
        ("索力", 808.2, "kN"), ("主梁挠度", -12.4, "mm"), ("支座位移", 6.2, "mm"),
        ("梁端转角", 0.012, "°"), ("吊杆振动", 0.021, "m/s²"), ("塔顶转角", 0.008, "°"),
        ("地震动", 0.012, "m/s²"), ("塔顶偏位", 1.8, "mm"),
    ]
    db.add_all([
        models.MonitoringItem(project_id="juli", name=n, value=v, unit=u, status="normal")
        for n, v, u in items
    ])

    # 设备（223 个）
    types = ["静力水准仪", "光纤应变计", "MEMS加速度计", "超声波风速仪", "倾角仪", "GNSS终端", "温湿度传感器", "AI视频球机"]
    bridges = ["保定巨力大桥", "乐凯大街转体斜拉桥", "横州大桥", "邢台金融中心", "唐县跨渠桥群"]
    for i in range(223):
        code = f"SHM-{i + 1:03d}"
        db.add(models.Device(
            code=code,
            type=types[i % len(types)],
            bridge=bridges[i % len(bridges)],
            status="online",
            voltage=f"{23.8 + (i % 10) * 0.05:.1f}V",
            rssi=f"-{58 + i % 12}dBm",
            last_upload="1秒前",
        ))

    # 报警事件
    db.add_all([
        models.AlarmEvent(project_id="juli", item_name="S-01 跨中下挠", level="三级预警 (注意)",
                          value="-13.8 mm", threshold="基准阈值 -12.0 mm",
                          time="2026-11-16 16:42:15", status="open"),
        models.AlarmEvent(project_id="lekai", item_name="LK-02 球铰微倾", level="二级预警 (警示)",
                          value="+0.012°", threshold="阈值 ±0.010°",
                          time="2026-11-16 11:20:00", status="closed"),
    ])

    # 工单
    db.add_all([
        models.WorkOrder(id="WO-202611-008", bridge="保定巨力大桥", sensor="S-01 跨中静力水准仪",
                         type="主梁挠度瞬时超标预警", level="三级预警 (注意)",
                         trigger_value="-13.8 mm (基准阈值 -12.0 mm)", time="2026-11-16 16:42:15",
                         stage="在线审批", handler="李建平 (值班高工)",
                         proposal="现场风载加大伴随重型车队通过，建议持续观察30分钟后复核。"),
        models.WorkOrder(id="WO-202611-007", bridge="乐凯大街转体斜拉桥", sensor="LK-02 MEMS倾角仪",
                         type="球铰转角微量偏位", level="二级预警 (警示)",
                         trigger_value="+0.012° (阈值 ±0.010°)", time="2026-11-16 11:20:00",
                         stage="已闭环归档", handler="张晨 (运维主管)",
                         proposal="现场激光复核球铰微倾已恢复至设计冗余区间。"),
        models.WorkOrder(id="WO-202611-006", bridge="保定巨力大桥", sensor="AI-02 高清球机",
                         type="桥面突发超限超载车辆", level="一级报警 (严重)",
                         trigger_value="六轴重卡总重 78.4t (限重 55t)", time="2026-11-16 09:14:32",
                         stage="现场联动处置", handler="交警支队路政联动组",
                         proposal="已联动桥头情报板与爆闪警示灯，引导超限车辆下桥并取证。"),
    ])

    db.commit()
