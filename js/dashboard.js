/**
 * BIM+GIS 数字孪生智能监测大屏业务控制器 (dashboard.js)
 */

class DashboardController {
  constructor() {
    this.currentProjectId = 'juli';
    this.deflectionChart = null;
    this.vibrationChart = null;
    this.cableChart = null;
    this.timer = null;
    this.tick = 0;
  }

  init() {
    this.initCharts();
    this.bindEvents();
    this.renderBridgeSvg();
    this.renderSensorPills();
    this.renderMonitorItems();
    this.startRealtimeStream();
  }

  initCharts() {
    // 1. 主梁跨中下挠时程监测 (静力水准仪)
    this.deflectionChart = new RealtimeWaveChart('chart-deflection', {
      title: '主梁跨中下挠时程 (静力水准仪 S-01)',
      unit: 'mm',
      minY: -16,
      maxY: -4,
      warnThreshold: -12.5, // 二级警戒
      alarmThreshold: -14.0, // 一级报警
      lineColor: '#1f6feb',
      fillColor: 'rgba(31, 111, 235, 0.12)',
      initialValue: -12.4
    });

    // 2. 动应变与加速度振动
    this.vibrationChart = new RealtimeWaveChart('chart-vibration', {
      title: '主梁竖向动应变波形 (光纤光栅 F-01)',
      unit: 'με',
      minY: 80,
      maxY: 180,
      warnThreshold: 160,
      alarmThreshold: 172,
      lineColor: '#0ca7a0',
      fillColor: 'rgba(12, 167, 160, 0.12)',
      initialValue: 142
    });

    // 3. 斜拉索索力全景对比图 (图16)
    const curProject = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (curProject && curProject.cables) {
      this.cableChart = new CableForceComparisonChart('chart-cables', curProject.cables);
    }
  }

  bindEvents() {
    // 测点热点点击代理
    const svgStage = document.getElementById('bridge-model-stage');
    if (svgStage) {
      svgStage.addEventListener('click', (e) => {
        const hotspot = e.target.closest('.sensor-hotspot');
        if (hotspot) {
          const pointId = hotspot.getAttribute('data-point-id');
          this.highlightPoint(pointId);
        }
      });

      svgStage.addEventListener('mousemove', (e) => {
        const hotspot = e.target.closest('.sensor-hotspot');
        const tooltip = document.getElementById('sensor-tooltip');
        if (hotspot && tooltip) {
          const name = hotspot.getAttribute('data-name');
          const type = hotspot.getAttribute('data-type');
          const val = hotspot.getAttribute('data-val');
          const unit = hotspot.getAttribute('data-unit');
          
          tooltip.innerHTML = `
            <div class="sensor-tooltip-title">${name}</div>
            <div class="sensor-tooltip-row"><span>设备类型:</span> <span>${type}</span></div>
            <div class="sensor-tooltip-row"><span>当前读数:</span> <span class="sensor-tooltip-val">${val} ${unit}</span></div>
            <div class="sensor-tooltip-row"><span>健康状态:</span> <span style="color:#2e9e5b">● 运行正常</span></div>
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX - svgStage.getBoundingClientRect().left + 15) + 'px';
          tooltip.style.top = (e.clientY - svgStage.getBoundingClientRect().top - 10) + 'px';
        } else if (tooltip) {
          tooltip.style.display = 'none';
        }
      });

      svgStage.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('sensor-tooltip');
        if (tooltip) tooltip.style.display = 'none';
      });
    }

    // 视图模式切换按钮
    const pills = document.querySelectorAll('.view-mode-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.getAttribute('data-mode');
        this.switchViewMode(mode);
      });
    });
  }

  switchViewMode(mode) {
    const stage = document.getElementById('bridge-model-stage');
    if (!stage) return;
    if (mode === 'model') {
      this.renderBridgeSvg();
    } else if (mode === 'gis') {
      stage.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
          <img src="assets/img/bim_gis_screen.jpeg" style="max-width:96%; max-height:92%; object-fit:contain; border-radius:8px; border:1px solid rgba(31,111,235,0.3);" />
          <div style="position:absolute; bottom:12px; right:20px; background:rgba(23,26,32,0.88); padding:6px 12px; border-radius:4px; font-size:11px; color:#cfe8ff;">
            保定市路网桥群 GIS 一张图宏观态势 (图7)
          </div>
        </div>
      `;
    } else if (mode === 'fem') {
      stage.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
          <img src="assets/img/juli_fem_model.jpeg" style="max-width:96%; max-height:92%; object-fit:contain; border-radius:8px; border:1px solid rgba(31,111,235,0.3);" />
          <div style="position:absolute; bottom:12px; right:20px; background:rgba(23,26,32,0.88); padding:6px 12px; border-radius:4px; font-size:11px; color:#cfe8ff;">
            实测模态有限元修正模型 (误差 < 2.1%) (图10)
          </div>
        </div>
      `;
    } else if (mode === 'video') {
      stage.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
          <img src="assets/img/yolo_detection.jpeg" style="max-width:96%; max-height:92%; object-fit:contain; border-radius:8px; border:1px solid rgba(31,111,235,0.3);" />
          <div style="position:absolute; bottom:12px; right:20px; background:rgba(23,26,32,0.88); padding:6px 12px; border-radius:4px; font-size:11px; color:#cfe8ff;">
            AI 计算机视觉 YOLOv9/v11 病害与路面实时识别 (图14)
          </div>
        </div>
      `;
    }
  }

  renderBridgeSvg() {
    const stage = document.getElementById('bridge-model-stage');
    if (!stage) return;

    // 动态生成斜拉桥高质感矢量立面示意
    stage.innerHTML = `
      <div id="sensor-tooltip" class="sensor-tooltip-box"></div>
      <svg class="bridge-svg-canvas" viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#eef4fb" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#f9fbfe" stop-opacity="1"/>
          </linearGradient>
          <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2f6fd6"/>
            <stop offset="100%" stop-color="#1f6feb"/>
          </linearGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- 水面与基底倒影 -->
        <line x1="50" y1="260" x2="850" y2="260" stroke="rgba(31,111,235,0.2)" stroke-width="2" stroke-dasharray="6,4" />
        <rect x="50" y="260" width="800" height="40" fill="url(#skyGrad)" opacity="0.6"/>

        <!-- 桥墩与承台 -->
        <rect x="420" y="210" width="60" height="50" fill="#dbe7f5" stroke="#2f6fd6" stroke-width="1.5"/>
        <rect x="180" y="230" width="30" height="30" fill="#dbe7f5" stroke="rgba(47,111,214,0.5)" stroke-width="1"/>
        <rect x="700" y="230" width="30" height="30" fill="#dbe7f5" stroke="rgba(47,111,214,0.5)" stroke-width="1"/>

        <!-- 主塔 (独塔 A 字形/倒 Y 形斜拉桥) -->
        <polygon points="450,40 435,210 465,210" fill="url(#towerGrad)" opacity="0.9"/>
        <line x1="450" y1="40" x2="450" y2="210" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.6"/>

        <!-- 主梁钢混桥跨 -->
        <line x1="60" y1="210" x2="840" y2="210" stroke="#1f6feb" stroke-width="5" filter="url(#glowFilter)"/>
        <line x1="60" y1="215" x2="840" y2="215" stroke="#2f6fd6" stroke-width="2"/>

        <!-- 斜拉索阵列 (左侧跨) -->
        <line x1="450" y1="60" x2="160" y2="210" stroke="rgba(47,111,214,0.35)" stroke-width="1.5"/>
        <line x1="450" y1="80" x2="220" y2="210" stroke="rgba(47,111,214,0.4)" stroke-width="1.5"/>
        <line x1="450" y1="100" x2="280" y2="210" stroke="rgba(47,111,214,0.45)" stroke-width="1.5"/>
        <line x1="450" y1="120" x2="340" y2="210" stroke="rgba(47,111,214,0.5)" stroke-width="1.5"/>
        <line x1="450" y1="140" x2="390" y2="210" stroke="rgba(47,111,214,0.55)" stroke-width="1.5"/>

        <!-- 斜拉索阵列 (右侧跨) -->
        <line x1="450" y1="60" x2="740" y2="210" stroke="rgba(47,111,214,0.35)" stroke-width="1.5"/>
        <line x1="450" y1="80" x2="680" y2="210" stroke="rgba(47,111,214,0.4)" stroke-width="1.5"/>
        <line x1="450" y1="100" x2="620" y2="210" stroke="rgba(47,111,214,0.45)" stroke-width="1.5"/>
        <line x1="450" y1="120" x2="560" y2="210" stroke="rgba(47,111,214,0.5)" stroke-width="1.5"/>
        <line x1="450" y1="140" x2="510" y2="210" stroke="rgba(47,111,214,0.55)" stroke-width="1.5"/>

        <!-- 关键测点热点标记 (依据文档图3：多类型传感器协同布设) -->
        <!-- S-01 跨中静力水准仪 -->
        <g class="sensor-hotspot" data-point-id="S-01" data-name="S-01 跨中静力水准仪" data-type="静力水准仪" data-val="-12.4" data-unit="mm">
          <circle cx="280" cy="210" r="7" fill="#1f6feb" filter="url(#glowFilter)" opacity="0.9"/>
          <circle cx="280" cy="210" r="14" fill="none" stroke="#1f6feb" stroke-width="1.5" opacity="0.6">
            <animate attributeName="r" values="7;18;7" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x="280" y="232" fill="#1f6feb" font-size="10" text-anchor="middle" font-family="monospace">S-01</text>
        </g>

        <!-- F-01 光纤光栅应变计 -->
        <g class="sensor-hotspot" data-point-id="F-01" data-name="F-01 主梁拉应变" data-type="光纤光栅应变计" data-val="142.5" data-unit="με">
          <polygon points="340,205 345,215 335,215" fill="#0ca7a0"/>
          <text x="340" y="232" fill="#0ca7a0" font-size="10" text-anchor="middle" font-family="monospace">F-01</text>
        </g>

        <!-- C-08 斜拉索索力 -->
        <g class="sensor-hotspot" data-point-id="C-08" data-name="C-08 8号索力监测" data-type="磁通量传感器" data-val="808.2" data-unit="kN">
          <circle cx="620" cy="160" r="6" fill="#d98324"/>
          <text x="640" y="163" fill="#d98324" font-size="10" text-anchor="start" font-family="monospace">C-08 (808kN)</text>
        </g>

        <!-- G-01 塔顶 GNSS 北斗位移 -->
        <g class="sensor-hotspot" data-point-id="G-01" data-name="G-01 主塔三维GNSS" data-type="GNSS接收机" data-val="1.8" data-unit="mm">
          <rect x="444" y="30" width="12" height="12" fill="#e6a23c" rx="2"/>
          <text x="450" y="22" fill="#e6a23c" font-size="10" text-anchor="middle" font-family="monospace">GNSS-01</text>
        </g>

        <!-- A-03 桥墩底部三向地震动 -->
        <g class="sensor-hotspot" data-point-id="A-03" data-name="A-03 承台三向地震动" data-type="三向加速度计" data-val="0.012" data-unit="m/s²">
          <circle cx="450" cy="235" r="6" fill="#722ed1"/>
          <text x="450" y="252" fill="#8a5bd6" font-size="10" text-anchor="middle" font-family="monospace">A-03地震动</text>
        </g>

        <!-- W-01 桥面超声波风速 -->
        <g class="sensor-hotspot" data-point-id="W-01" data-name="W-01 桥面微气象风速仪" data-type="超声波风速仪" data-val="3.4" data-unit="m/s">
          <circle cx="160" cy="195" r="5" fill="#2f6fd6"/>
          <text x="160" y="185" fill="#3b82f6" font-size="10" text-anchor="middle" font-family="monospace">风速仪</text>
        </g>

        <!-- AI 视频监控点 -->
        <g class="sensor-hotspot" data-point-id="V-01" data-name="AI-01 桥面球机高清监控" data-type="AI球机" data-val="正常" data-unit="">
          <polygon points="730,195 745,200 730,205" fill="#e5484d"/>
          <text x="740" y="190" fill="#e5484d" font-size="10" text-anchor="middle" font-family="monospace">AI视频</text>
        </g>
      </svg>
    `;
  }

  renderSensorPills() {
    const container = document.getElementById('sensor-pill-matrix');
    if (!container) return;
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (!project || !project.keyPoints) return;

    container.innerHTML = project.keyPoints.map(kp => `
      <div class="sensor-point-pill" data-point-id="${kp.id}" onclick="window.dashboard.highlightPoint('${kp.id}')">
        <span class="point-status-dot ${kp.status}"></span>
        <span>${kp.name}:</span>
        <strong style="color:var(--color-primary); font-family:monospace;">${kp.val} ${kp.unit}</strong>
      </div>
    `).join('');
  }

  renderMonitorItems() {
    const container = document.getElementById('monitor-items-grid');
    if (!container) return;
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    let items = [];
    if (project) {
      if (project.monitoringItems && project.monitoringItems.length) {
        items = project.monitoringItems;
      } else if (project.keyPoints) {
        items = project.keyPoints.map(kp => ({ name: kp.name, value: kp.val, unit: kp.unit, status: kp.status }));
      }
    }
    container.innerHTML = items.map(it => `
      <div class="monitor-item-tile" title="${it.name}">
        <span class="monitor-item-dot ${it.status || 'normal'}"></span>
        <span class="monitor-item-name">${it.name}</span>
        <span class="monitor-item-value">${it.value}<span class="unit">${it.unit || ''}</span></span>
      </div>
    `).join('');
  }

  highlightPoint(pointId) {
    const pills = document.querySelectorAll('.sensor-point-pill');
    pills.forEach(p => {
      if (p.getAttribute('data-point-id') === pointId) {
        p.classList.add('active');
        p.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      } else {
        p.classList.remove('active');
      }
    });
  }

  startRealtimeStream() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tick++;

      // 1. 模拟主梁下挠真实波动 (基准 -12.4mm，叠加微风小振幅与周期波动)
      const baseDeflection = -12.4;
      const wave = Math.sin(this.tick * 0.15) * 1.2 + (Math.random() - 0.5) * 0.4;
      const currentDeflection = +(baseDeflection + wave).toFixed(2);
      if (this.deflectionChart) {
        this.deflectionChart.addData(currentDeflection);
      }

      // 2. 模拟应变波动
      const baseStrain = 142.0;
      const strainWave = Math.sin(this.tick * 0.25) * 8.0 + (Math.random() - 0.5) * 3.0;
      const currentStrain = +(baseStrain + strainWave).toFixed(1);
      if (this.vibrationChart) {
        this.vibrationChart.addData(currentStrain);
      }

      // 3. 模拟超声波风速与风向指针微动
      if (this.tick % 4 === 0) {
        const windSpeed = (3.2 + Math.sin(this.tick * 0.1) * 1.5 + Math.random() * 0.5).toFixed(1);
        const windAngle = Math.floor(65 + Math.sin(this.tick * 0.08) * 30);
        const windNumEl = document.getElementById('val-wind-speed');
        const windAngleEl = document.getElementById('val-wind-angle');
        const compassPointer = document.getElementById('compass-pointer');
        if (windNumEl) windNumEl.innerText = `${windSpeed} m/s`;
        if (windAngleEl) windAngleEl.innerText = `${windAngle}° (东北偏东)`;
        if (compassPointer) compassPointer.style.transform = `rotate(${windAngle}deg)`;
      }

      // 4. 定时微调索力柱状图中的某一根，展示实时刷新感觉
      if (this.tick % 10 === 0 && this.cableChart) {
        const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
        if (project && project.cables) {
          const randomIndex = Math.floor(Math.random() * project.cables.length);
          const c = project.cables[randomIndex];
          c.actual = c.design + Math.floor((Math.random() - 0.5) * 12);
          this.cableChart.updateData(project.cables);
        }
      }
    }, 1000);
  }

  // 模拟突发预警联动
  triggerDemoAlert(goToDashboard) {
    if (goToDashboard && window.app) {
      window.app.switchTab('dashboard');
    }
    const alertList = document.getElementById('alert-stream-list');
    if (!alertList) return;

    const newAlert = document.createElement('div');
    newAlert.className = 'alert-event-item level-red';
    newAlert.innerHTML = `
      <div class="alert-event-header">
        <span class="alert-event-title" style="color:var(--color-danger);">🚨 一级报警：S-01 瞬态超阈</span>
        <div class="alert-event-header-right">
          <span class="alert-event-time">刚刚</span>
          <button type="button" class="alert-event-close" title="关闭该报警" onclick="this.closest('.alert-event-item').remove()">×</button>
        </div>
      </div>
      <div class="alert-event-desc">
        跨中静力水准仪瞬时挠度达 <strong>-14.8 mm</strong>，超出安全阈值(-14.0 mm)！已触发联动警报并自动生成闭环工单！
      </div>
      <span class="alert-action-link" onclick="window.app.switchTab('alarm')">👉 立即前往工单流转处置审批</span>
    `;

    alertList.prepend(newAlert);

    // 挠度波形瞬间出现一个下突
    if (this.deflectionChart) {
      this.deflectionChart.addData(-14.8);
    }

    // 播放提示视觉高亮
    alertList.style.boxShadow = '0 0 20px rgba(229, 72, 77, 0.5)';
    setTimeout(() => {
      alertList.style.boxShadow = 'none';
    }, 2000);
  }
}

window.DashboardController = DashboardController;
