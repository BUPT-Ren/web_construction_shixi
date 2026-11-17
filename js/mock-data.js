/**
 * 结构健康监测系统 - 核心业务与仿真数据中心
 * 严格依据《工程结构智能监测系统介绍》与 JT/T 1037-2022 规范标准
 */

window.SystemMockData = {
  // 系统基本元数据
  meta: {
    systemName: "工程结构智能监测与全寿命健康运维系统",
    shortName: "SHM-Twin (Structural Health Monitoring)",
    standard: "交通运输部 JT/T 1037-2022《公路桥梁结构监测技术规范》",
    securityLevel: "国家网络安全等级保护二级 (等保二级)",
    edgeOfflineDays: 180, // 边缘断网离线存储不少于180天
    activeBridgesCount: 5,
    totalSensorsCount: 223,
    onlineSensorsCount: 223,
    faultSensorsCount: 0
  },

  // 典型工程案例库 (文档第十一章/第十三章)
  projects: [
    {
      id: "juli",
      name: "保定巨力大桥",
      type: "独塔斜拉桥",
      location: "河北省保定市",
      span: "主跨 160m + 边跨 100m",
      image: "assets/img/juli_project_real.jpeg",
      femImage: "assets/img/juli_fem_model.jpeg",
      status: "正常服役监测中",
      healthScore: 94.6,
      healthLevel: "A级 (良好稳定)",
      description: "考虑非线性效应的快速调索方法与健康监测，建立高精度实测模态有限元修正模型，实测索力与设计索力相对误差严格控制在 < 5%。",
      keyPoints: [
        { id: "S-01", name: "跨中下挠测点", type: "静力水准仪", val: -12.4, unit: "mm", status: "normal" },
        { id: "S-02", name: "1/4跨下挠测点", type: "静力水准仪", val: -8.1, unit: "mm", status: "normal" },
        { id: "F-01", name: "主梁跨中拉应变", type: "光纤光栅应变计", val: 142.5, unit: "με", status: "normal" },
        { id: "C-08", name: "8号斜拉索索力", type: "磁通量/加速度法", val: 808.2, unit: "kN", status: "normal" },
        { id: "A-01", name: "塔顶纵向振动", type: "MEMS加速度计", val: 0.045, unit: "m/s²", status: "normal" },
        { id: "A-03", name: "承台三向地震动", type: "三向加速度计", val: 0.012, unit: "m/s²", status: "normal" },
        { id: "W-01", name: "桥面超声波风速", type: "超声波风速风向仪", val: 3.4, unit: "m/s", status: "normal" },
        { id: "G-01", name: "主塔三维北斗位移", type: "GNSS接收机", val: 1.8, unit: "mm", status: "normal" }
      ],
      // 索力对比柱状图数据 (高度匹配文档图16)
      cables: [
        { id: "LS-01", design: 310, actual: 308 },
        { id: "LS-02", design: 310, actual: 309 },
        { id: "LS-03", design: 310, actual: 307 },
        { id: "LS-04", design: 645, actual: 642 },
        { id: "LS-05", design: 680, actual: 678 },
        { id: "LS-06", design: 805, actual: 803 },
        { id: "LS-07", design: 800, actual: 808 },
        { id: "LS-08", design: 800, actual: 795 },
        { id: "LS-09", design: 630, actual: 628 },
        { id: "LS-10", design: 645, actual: 642 },
        { id: "LS-11", design: 640, actual: 644 },
        { id: "LS-12", design: 640, actual: 638 },
        { id: "LS-13", design: 610, actual: 605 },
        { id: "LS-14", design: 625, actual: 622 },
        { id: "LS-15", design: 315, actual: 312 },
        { id: "LS-16", design: 310, actual: 307 },
        { id: "LS-17", design: 255, actual: 253 },
        { id: "LS-18", design: 250, actual: 248 },
        { id: "LS-19", design: 250, actual: 251 },
        { id: "LS-20", design: 250, actual: 247 },
        { id: "LS-21", design: 250, actual: 252 },
        { id: "LS-22", design: 305, actual: 302 },
        { id: "LS-23", design: 305, actual: 306 },
        { id: "LS-24", design: 500, actual: 496 },
        { id: "LS-25", design: 505, actual: 508 },
        { id: "LS-26", design: 490, actual: 488 },
        { id: "LS-27", design: 795, actual: 792 },
        { id: "LS-28", design: 795, actual: 798 },
        { id: "LS-29", design: 790, actual: 794 },
        { id: "LS-30", design: 800, actual: 802 },
        { id: "LS-31", design: 800, actual: 796 },
        { id: "LS-32", design: 610, actual: 605 },
        { id: "LS-33", design: 600, actual: 598 },
        { id: "LS-34", design: 305, actual: 303 },
        { id: "LS-35", design: 305, actual: 304 }
      ]
    },
    {
      id: "lekai",
      name: "保定乐凯大街转体斜拉桥",
      type: "大吨位双塔转体斜拉桥",
      location: "河北省保定市跨铁路枢纽",
      span: "跨京广铁路等21条铁路线",
      image: "assets/img/lekai_scale_model.jpeg",
      status: "数字孪生试验与在线监测",
      healthScore: 96.2,
      healthLevel: "A级 (优良)",
      description: "应用 1:50 缩尺数字孪生试验模型结合在线健康监测平台，实现物理结构与数字空间的实时虚实映射与动力学交互推演。",
      keyPoints: [
        { id: "LK-01", name: "转体球铰受力", type: "光纤光栅应变计", val: 89.2, unit: "με", status: "normal" },
        { id: "LK-02", name: "主塔回转倾角", type: "MEMS双轴倾角仪", val: 0.008, unit: "°", status: "normal" },
        { id: "LK-03", name: "钢混结合段振动", type: "三向加速度计", val: 0.028, unit: "m/s²", status: "normal" }
      ]
    },
    {
      id: "hengzhou",
      name: "横州大桥",
      type: "特大跨斜拉桥施工期",
      location: "广西横州",
      span: "主跨 400m 级斜拉桥",
      image: "assets/img/bridge_hero.jpeg",
      status: "工程施工控制",
      healthScore: 92.8,
      healthLevel: "A级 (受控优良)",
      description: "在斜拉桥施工控制中，实现调索、桥面板吊装拼接、全桥线形偏差实时微调与高保真有限元仿真修正。",
      keyPoints: [
        { id: "HZ-01", name: "主梁悬臂端位移", type: "GNSS北斗接收机", val: 14.2, unit: "mm", status: "normal" },
        { id: "HZ-02", name: "节段拼装应力", type: "表面应变计", val: 122.0, unit: "με", status: "normal" }
      ]
    },
    {
      id: "xingtai",
      name: "邢台金融中心超高层建筑",
      type: "超高层地标框架-核心筒",
      location: "河北省邢台市",
      span: "高 180m 框架-核心筒结构",
      image: "assets/img/spsd_damage_result.jpeg",
      status: "长期健康监测",
      healthScore: 95.1,
      healthLevel: "A级 (稳定)",
      description: "部署环境温湿度、顶层风载动态响应与结构水平微倾斜在线监测，应用 PCA 消除环境温度非线性影响。",
      keyPoints: [
        { id: "XT-01", name: "顶层风致水平摆幅", type: "超高灵敏加速度计", val: 0.015, unit: "m/s²", status: "normal" },
        { id: "XT-02", name: "核心筒立柱微应变", type: "光纤应变传感器", val: 65.4, unit: "με", status: "normal" }
      ]
    },
    {
      id: "tangxian",
      name: "唐县跨渠桥群",
      type: "梁式 / 预应力连续梁桥群",
      location: "河北省唐县 (跨南水北调中线)",
      span: "城西桥、军营桥、唐县北桥、向阳大桥",
      image: "assets/img/sensor_layout_3d.jpeg",
      status: "桥群联网集约化监控",
      healthScore: 93.4,
      healthLevel: "A级 (正常)",
      description: "四座跨南水北调干渠重点桥梁实施桥群化部署，单桥标配温湿度、静力水准仪(1测点+1基点)、应变计(1/4、1/2、3/4跨)、竖向及三向加速度计与AI视频，满足全覆盖监测与集约化运维。",
      keyPoints: [
        { id: "TX-CX-01", name: "城西桥跨中挠度", type: "静力水准仪", val: -5.8, unit: "mm", status: "normal" },
        { id: "TX-JY-01", name: "军营桥跨中应变", type: "光纤光栅应变计", val: 98.6, unit: "με", status: "normal" }
      ]
    }
  ],

  // 核心传感器设备库 (文档第五章、第六章)
  sensorsList: [
    {
      name: "静力水准仪",
      target: "主梁挠度 / 墩台沉降",
      principle: "连通管液位差原理，多台总线串联连接，基点+温度自动改正；铝合金一体化封闭水路，专为长期沉降与挠度监测设计",
      accuracy: "±0.1 mm / 0.01 mm 分辨率",
      image: "",
      tag: "结构变形"
    },
    {
      name: "光纤光栅应变计",
      target: "结构关键截面动静态应变与温度",
      principle: "光栅布拉格反射波长调制测量；本质安全，抗强电磁干扰、全天候防水耐腐蚀，支持波分复用及在线无损更换",
      accuracy: "±1 με / -40℃~+85℃",
      image: "assets/img/sensor_fiber.jpeg",
      tag: "受力与振动"
    },
    {
      name: "超声波风速风向仪",
      target: "桥面微气象三维风场",
      principle: "3轴无运动机械部件，超声波时差传播测量；具备双通道测温自补偿，动态响应毫秒级，无磨损免维护",
      accuracy: "风速 0~60 m/s (±2%), 风向 0~360° (±2°)",
      image: "assets/img/sensor_anemometer.jpeg",
      tag: "环境与作用"
    },
    {
      name: "GNSS / 北斗高精度接收机",
      target: "主塔塔顶与梁体空间三维形变",
      principle: "接收北斗/GPS多模卫星载波相位信号，载波差分RTK算法解算水平与高程三维位移，毫米级动态形变捕捉",
      accuracy: "水平 ±2.5mm + 1ppm, 高程 ±5.0mm + 1ppm",
      image: "assets/img/sensor_gnss.jpeg",
      tag: "结构变形"
    },
    {
      name: "MEMS 加速度计",
      target: "主梁 / 拉索高频动力响应及索力识别",
      principle: "微机电电容式振动传感芯片，超低频响应特性优异、动态范围大、抗冲击过载能力强，用于频响分析及索力提取",
      accuracy: "频响 0.1~200 Hz, 灵敏度 1000 mV/g",
      image: "",
      tag: "受力与振动"
    },
    {
      name: "AI 高清云台视频球机",
      target: "车辆超载抓拍 / 异常拥堵 / 表观病害",
      principle: "内嵌国产端侧 AI 算力芯片，边缘计算识别主梁裂缝、钢构锈蚀、违章停靠，与现场爆闪警示装置实时联动",
      accuracy: "4K 800万像素, 0.1mm裂缝识别精度",
      image: "assets/img/sensor_camera.jpeg",
      tag: "表观与视频"
    },
    {
      name: "单芯片工业温湿度传感器",
      target: "桥梁箱梁内部与大气环境温湿度",
      principle: "高精度单芯片数字传感器，标准 RS485 Modbus-RTU 接口，内置浪涌与极性反接保护，抗结露防凝霜",
      accuracy: "温度 ±0.2℃, 湿度 ±1.5% RH",
      image: "assets/img/sensor_temp_humidity.jpeg",
      tag: "环境与作用"
    },
    {
      name: "磁通量传感器 (EM Sensor)",
      target: "斜拉桥斜拉索长期服役索力",
      principle: "基于铁磁材料磁弹性效应，测量导磁率变化推算钢索受拉应力；与基于加速度频谱的振动测索法互为复核与备份",
      accuracy: "相对误差 < 2% FS",
      image: "",
      tag: "受力与振动"
    }
  ],

  // 硬核科研算法与学术成果矩阵 (文档第十章、第十二章)
  researchPapers: [
    {
      title: "基于功率谱灵敏度 (SPSD) 的结构损伤识别方法",
      journal: "Journal of Sound and Vibration",
      type: "国际顶级力学 SCI 一区",
      tags: ["SPSD理论", "有限元修正", "实测模态"],
      summary: "突破传统模态参数识别对稀疏测点和弱环境激励的敏感性，直接基于加速度功率谱密度对结构物理刚度矩阵的灵敏度展开迭代反演，成功应用于保定巨力大桥实测模态修正。",
      image: "assets/img/juli_fem_model.jpeg"
    },
    {
      title: "移动荷载激励下 CEEMD-PSD 灵敏度损伤精准定位",
      journal: "Structural Control and Health Monitoring",
      type: "权威结构控制与健康监测 SCI",
      tags: ["CEEMD时频分解", "突变奇异点", "车载移动响应"],
      summary: "针对列车/重型汽车移动冲击，对时程加速度进行互补集合经验模态分解，利用固有模态函数IMF突变精确定位损伤。铝梁实验验证：单损伤检测误差3.2%，多损伤最大误差6.7%，无漏判无误判。",
      image: "assets/img/ceemd_experiment.jpeg"
    },
    {
      title: "仿真预训练+实验微调的迁移学习 PSD-DenseNet 框架",
      journal: "Journal of Mechanical Science and Technology",
      type: "智能结构健康监测 SCI",
      tags: ["迁移学习", "PSD-DenseNet", "小样本工程突破"],
      summary: "有效破解实际在役工程罕有实测损伤样本的痛点，采用高保真数值仿真预训练特征网络，仅用少量现场实验微调即实现钢桁梁、弦支穹顶的损伤毫米级定量定位，频率误差<2.1%。",
      image: "assets/img/transfer_learning.jpeg"
    },
    {
      title: "计算机视觉 U-Net 与改进 YOLO (v9/v11) 病害智能识别",
      journal: "International Journal of Structural Stability and Dynamics",
      type: "计算机视觉与智能运维 SCI",
      tags: ["YOLOv9/v11", "三维点云", "裂缝量化"],
      summary: "利用路面与桥体高清巡检视频，结合改进 YOLO 及语义分割，实现裂缝微米级宽度提取与剥落锈蚀量化，并结合激光点云实现结构病害几何特征的三维实体化还原。",
      image: "assets/img/yolo_detection.jpeg"
    }
  ],

  // 设备在线网格列表 (图6：设备总数223个，全部正常在线)
  deviceGrid: Array.from({ length: 223 }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    const types = ['静力水准仪', '光纤应变计', 'MEMS加速度计', '超声波风速仪', '倾角仪', 'GNSS终端', '温湿度传感器', 'AI视频球机'];
    const bridges = ['保定巨力大桥', '乐凯大街转体斜拉桥', '横州大桥', '邢台金融中心', '唐县跨渠桥群'];
    return {
      code: `SHM-${n}`,
      type: types[i % types.length],
      bridge: bridges[i % bridges.length],
      status: 'online',
      voltage: (23.8 + Math.random() * 0.4).toFixed(1) + 'V',
      rssi: '-' + Math.floor(58 + Math.random() * 12) + 'dBm',
      lastUpload: '1秒前'
    };
  }),

  // 预警处置与闭环工单 (文档第七章：特征值超阈→规则判级→自动派单→在线审批→跟踪归档)
  workOrders: [
    {
      id: "WO-202611-008",
      bridge: "保定巨力大桥",
      sensor: "S-01 跨中静力水准仪",
      type: "主梁挠度瞬时超标预警",
      level: "三级预警 (注意)",
      levelClass: "level-blue",
      triggerValue: "-13.8 mm (基准阈值 -12.0 mm)",
      time: "2026-11-16 16:42:15",
      stage: "在线审批",
      stageClass: "stage-reviewing",
      handler: "李建平 (值班高工)",
      proposal: "现场风载加大伴随重型车队通过，属于瞬态动态挠度激增，建议持续观察30分钟后复核。"
    },
    {
      id: "WO-202611-007",
      bridge: "乐凯大街转体斜拉桥",
      sensor: "LK-02 MEMS倾角仪",
      type: "球铰转角微量偏位",
      level: "二级预警 (警示)",
      levelClass: "level-yellow",
      triggerValue: "+0.012° (阈值 ±0.010°)",
      time: "2026-11-16 11:20:00",
      stage: "已闭环归档",
      stageClass: "stage-closed",
      handler: "张晨 (运维主管)",
      proposal: "现场激光复核球铰微倾已恢复至设计冗余区间，环境温差应力释放正常，已完成校核归档。"
    },
    {
      id: "WO-202611-006",
      bridge: "保定巨力大桥",
      sensor: "AI-02 高清球机",
      type: "桥面突发超限超载车辆",
      level: "一级报警 (严重)",
      levelClass: "level-red",
      triggerValue: "六轴重卡总重 78.4t (限重 55t)",
      time: "2026-11-16 09:14:32",
      stage: "现场联动处置",
      stageClass: "stage-handling",
      handler: "交警支队路政联动组",
      proposal: "已联动桥头情报板与现场爆闪警示灯，引导超限车辆下桥并完成车牌特征取证。"
    }
  ]
};
