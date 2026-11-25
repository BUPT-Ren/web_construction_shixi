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
    this.initBoardLayout();
    this.initCharts();
    this.bindEvents();
    this.renderBridgeSvg();
    this.renderSensorPills();
    this.renderMonitorItems();
    this.renderBoardData();
    this.startRealtimeStream();
  }

  initBoardLayout() {
    const pane = document.getElementById('tab-dashboard');
    const board = pane.querySelector('.command-center');
    const selector = document.getElementById('board-bridge');
    window.SystemMockData.projects.forEach(p => selector.add(new Option(p.name, p.id)));
    selector.onchange = () => window.app.switchToBridge(selector.value);
    const fullscreen = document.getElementById('board-fullscreen');
    fullscreen.onclick = () => window.app.toggleFullScreen();
    document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement ? '退出全屏' : '全屏展示';
    });
    board.dataset.page = 'model';
    board.querySelector('.board-pages').onclick = event => {
      if (event.target.dataset.page) board.dataset.page = event.target.dataset.page;
    };
    new ResizeObserver(() => {
      const {clientWidth: w, clientHeight: h} = pane;
      if (!w || !h) return;
      const compact = w < 760;
      board.classList.toggle('compact-board', compact);
      const scale = Math.min(1, w / (compact ? 350 : 1250), h / (compact ? 620 : 875));
      board.style.zoom = scale;
      board.style.width = w / scale + 'px';
      board.style.height = h / scale + 'px';
    }).observe(pane);
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
      lineColor: '#54c7ff',
      fillColor: 'rgba(84, 199, 255, 0.2)',
      gridColor: 'rgba(102, 198, 255, 0.18)',
      textColor: '#9bb9d9',
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
      lineColor: '#64df91',
      fillColor: 'rgba(100, 223, 145, 0.16)',
      gridColor: 'rgba(102, 198, 255, 0.18)',
      textColor: '#9bb9d9',
      initialValue: 142
    });

    // 3. 斜拉索索力全景对比图 (图16)
    const curProject = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (curProject && curProject.cables) {
      this.cableChart = new CableForceComparisonChart('chart-cables', curProject.cables);
    }
  }

  bindEvents() {
    const board = document.querySelector('.command-center');
    const openDetail = event => {
      const target = event.target.closest('[data-detail]');
      if (!target || !board.contains(target)) return;
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      if (event.type === 'keydown') event.preventDefault();
      this.openBoardDetail(target.dataset);
    };
    board.addEventListener('click', openDetail);
    board.addEventListener('keydown', openDetail);
    // 测点热点点击代理
    const svgStage = document.getElementById('bridge-model-stage');
    if (svgStage) {
      svgStage.addEventListener('click', (e) => {
        const hotspot = e.target.closest('.sensor-hotspot');
        if (hotspot) {
          const pointId = hotspot.getAttribute('data-point-id');
          this.openSensorInfo(pointId);
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
          const bounds = svgStage.getBoundingClientRect();
          tooltip.style.left = Math.max(8, Math.min(e.clientX - bounds.left + 15, bounds.width - tooltip.offsetWidth - 8)) + 'px';
          tooltip.style.top = Math.max(8, Math.min(e.clientY - bounds.top - 10, bounds.height - tooltip.offsetHeight - 8)) + 'px';
        } else if (tooltip) {
          tooltip.style.display = 'none';
        }
      });

      svgStage.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('sensor-tooltip');
        if (tooltip) tooltip.style.display = 'none';
      });
      svgStage.addEventListener('keydown', (e) => {
        const hotspot = e.target.closest('.sensor-hotspot');
        if (hotspot && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          this.openSensorInfo(hotspot.dataset.pointId);
        }
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
    this.currentViewMode = mode;
    const stage = document.getElementById('bridge-model-stage');
    if (!stage) return;
    stage.style.backgroundImage = 'none';
    if (mode === 'model' || mode === 'fem') {
      this.renderBridgeSvg();
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

  renderProjectSummary(project) {
    if (!project) return;
    document.getElementById('board-bridge').value = project.id;
    const values = {
      'command-project-name': project.name,
      'command-project-title': project.name,
      'command-project-type': project.type,
      'command-project-span': project.span || '—',
      'command-health-score': project.healthScore
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    const image = document.getElementById('command-project-image');
    if (image) {
      image.src = project.image || 'assets/img/bridge_hero.jpeg';
      image.alt = project.name;
    }
    const videoImage = document.getElementById('command-video-image');
    if (videoImage) {
      videoImage.src = project.image || 'assets/img/bridge_hero.jpeg';
      videoImage.alt = `${project.name}实时画面`;
    }
    const videoCaption = document.getElementById('command-video-caption');
    if (videoCaption) videoCaption.textContent = `${project.name}通行状态`;
  }

  renderBridgeSvg() {
    const stage = document.getElementById('bridge-model-stage');
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (!stage || !project) return;
    this.renderProjectSummary(project);
    stage.style.backgroundImage = 'none';
    stage.innerHTML = window.BridgeTwin.render(project);
    document.querySelectorAll('.view-mode-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.mode === (this.currentViewMode || 'model'));
    });
  }

  openSensorInfo(pointId) {
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    const point = project && project.keyPoints.find(p => p.id === pointId);
    if (!point) return;
    window.workorder.showDeviceDetail(point.code);
  }

  renderSensorPills() {
    const container = document.getElementById('sensor-pill-matrix');
    if (!container) return;
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (!project || !project.keyPoints) return;

    container.innerHTML = project.keyPoints.map(kp => `
      <div class="sensor-point-pill" data-point-id="${kp.id}" onclick="window.dashboard.openSensorInfo('${kp.id}')">
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
    const items = project ? project.keyPoints : [];
    container.innerHTML = items.map(it => `
      <button type="button" class="monitor-item-tile" title="${it.name}" data-detail="sensor" data-point="${it.id}">
        <span class="monitor-item-dot ${it.status || 'normal'}"></span>
        <span class="monitor-item-name">${it.name}</span>
        <span class="monitor-item-value">${it.val}<span class="unit">${it.unit || ''}</span></span>
      </button>
    `).join('');
  }

  renderBoardData() {
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    const devices = window.SystemMockData.deviceGrid.filter(d => d.bridge === project.name);
    const online = devices.filter(d => d.status === 'online').length;
    const groups = new Map();
    project.keyPoints.forEach(point => {
      const group = /塔/.test(point.name) ? '桥塔' : /索/.test(point.name) ? '拉索' :
        /承台|支座|桥墩/.test(point.name) ? '桥墩与支座' : /引桥|端/.test(point.name) ? '引桥与梁端' : '主梁及其他';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(point);
    });
    document.getElementById('distribution-total').textContent = `共 ${project.keyPoints.length} 个测点`;
    document.getElementById('point-distribution-list').innerHTML = [...groups].map(([name, points]) => `
      <button class="distribution-row" data-detail="group" data-group="${name}">
        <span>${name}</span><span class="distribution-bar"><i style="width:${points.length / project.keyPoints.length * 100}%"></i></span>
        <b>${points.length} 个</b><span>›</span></button>`).join('');
    this.pointGroups = groups;
    document.getElementById('board-device-summary').innerHTML = `
      <button data-detail="devices" data-status="all"><strong>${devices.length}</strong><span>设备总数</span></button>
      <button data-detail="devices" data-status="online"><strong>${online}</strong><span>在线设备</span></button>
      <button data-detail="devices" data-status="offline"><strong>${devices.length - online}</strong><span>离线设备</span></button>
      <div class="device-rate"><span>在线率</span><b>${devices.length ? (online / devices.length * 100).toFixed(1) : '0.0'}%</b><div><i style="width:${devices.length ? online / devices.length * 100 : 0}%"></i></div></div>`;
    const orders = window.SystemMockData.workOrders.filter(o => o.bridge === project.name);
    document.querySelector('.alert-count').textContent = `${orders.length} 条记录 ›`;
    document.getElementById('alert-stream-list').innerHTML = orders.map(o => `
      <button class="alert-event-item ${o.levelClass}" data-detail="order" data-order="${o.id}">
        <span class="alert-event-header"><b class="alert-event-title">${o.level.split(' ')[0]}：${o.type}</b><span class="alert-event-time">${o.time.slice(11,16)}</span></span>
        <span class="alert-event-desc">${o.triggerValue} · ${o.stage}</span></button>`).join('') || '<p>暂无预警记录</p>';
    const ids = project.id === 'juli' ? ['S-01', 'F-01'] : ['LK-01', 'LK-03'];
    this.trendPoints = ids.map(id => project.keyPoints.find(p => p.id === id));
    [this.deflectionChart, this.vibrationChart].forEach((chart, i) => {
      const point = this.trendPoints[i];
      if (!point) {
        chart.data = [];
        chart.render();
        document.getElementById(i ? 'chart-second-title' : 'chart-first-title').textContent = '暂无监测趋势';
        return;
      }
      const spread = Math.max(Math.abs(point.val) * .15, point.unit === 'm/s²' ? .01 : .1);
      Object.assign(chart.options, {title: '', unit: point.unit, minY: point.val - spread, maxY: point.val + spread, warnThreshold: null, alarmThreshold: null});
      chart.data = Array(chart.options.maxPoints).fill(point.val);
      chart.render();
      document.getElementById(i ? 'chart-second-title' : 'chart-first-title').textContent = point.name + '趋势';
    });
  }

  openBoardDetail(data) {
    const project = window.SystemMockData.projects.find(p => p.id === this.currentProjectId);
    if (data.detail === 'sensor') return this.openSensorInfo(data.point);
    if (data.detail === 'order') return window.workorder.viewOrderDetail(data.order);
    const table = rows => `<div class="board-detail-table">${rows.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
    const pointList = points => `<div class="board-detail-list">${points.map(p => `<button onclick="window.dashboard.openSensorInfo('${p.id}')"><span>${p.id} · ${p.name}<small>${p.code} · ${p.type}</small></span><strong>${p.val} ${p.unit}</strong><b>›</b></button>`).join('')}</div>`;
    if (data.detail === 'project') {
      window.app.showModal('桥梁档案', table([['桥梁名称', project.name], ['桥梁类型', project.type], ['主跨规模', project.span], ['运行状态', project.status], ['工程简介', project.description]]));
    } else if (data.detail === 'health') {
      const scores = [['综合健康指数', project.healthScore], ['结构安全', 95], ['桥面系', 92], ['附属设施', 94], ['监测设备', 100]];
      window.app.showModal((data.category || '综合健康') + '评估', `<p>所属桥梁：${project.name}　评估等级：${project.healthLevel}</p>` + table(scores.map(([name, score]) => [name, score + ' 分'])) + '<p class="board-detail-note">评估结果为演示数据。</p>');
    } else if (data.detail === 'group') {
      window.app.showModal(data.group + '测点', pointList(this.pointGroups.get(data.group) || []));
    } else if (data.detail === 'devices') {
      const devices = window.SystemMockData.deviceGrid.filter(d => d.bridge === project.name && (!data.status || data.status === 'all' || (data.status === 'online' ? d.status === 'online' : d.status !== 'online')));
      window.app.showModal('设备运行概况 · ' + project.name, `<p>共 ${devices.length} 台设备</p><div class="board-detail-list">${devices.map(d => `<button onclick="window.workorder.showDeviceDetail('${d.code}')"><span>${d.code}<small>${d.type}${d.point ? ' · ' + d.point.name : ''}</small></span><strong>${d.status === 'online' ? '在线' : '离线'}</strong><b>›</b></button>`).join('') || '<p>暂无设备</p>'}</div>`);
    } else if (data.detail === 'alerts') {
      const orders = window.SystemMockData.workOrders.filter(o => o.bridge === project.name);
      window.app.showModal('预警记录 · ' + project.name, `<div class="board-detail-list">${orders.map(o => `<button onclick="window.workorder.viewOrderDetail('${o.id}')"><span>${o.type}<small>${o.time} · ${o.stage}</small></span><strong>${o.level}</strong><b>›</b></button>`).join('') || '<p>暂无预警记录</p>'}</div>`);
    } else if (data.detail === 'trend') {
      const index = data.chart === 'second' ? 1 : 0;
      const point = this.trendPoints[index];
      if (!point) {
        window.app.showModal('监测趋势', '<p>当前工程暂无关联测点。</p>');
        return;
      }
      const chart = index ? this.vibrationChart : this.deflectionChart;
      const rows = chart.data.slice(-10).reverse().map((value, i) => [i === 0 ? '最新' : `前 ${i} 秒`, value.toFixed(3) + ' ' + point.unit]);
      window.app.showModal(point.name + '趋势详情', `<p>${project.name} · ${point.id} · ${point.code}</p>` + table(rows) + `<p class="board-detail-note">最近 10 次演示采样</p><button class="btn-primary" onclick="window.dashboard.openSensorInfo('${point.id}')">查看设备档案</button>`);
    } else if (data.detail === 'cables') {
      window.app.showModal('斜拉索索力数据 · ' + project.name, project.cables?.length ? table(project.cables.map(c => [c.id, `设计 ${c.design} kN　实测 ${c.actual} kN`])) : '<p>当前工程暂无索力对比数据。</p>' + pointList(project.keyPoints.filter(p => /索力/.test(p.name))));
    }
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
      const baseDeflection = this.trendPoints[0]?.val;
      if (baseDeflection == null || !this.trendPoints[1]) return;
      const wave = (Math.sin(this.tick * 0.15) * .06 + (Math.random() - 0.5) * .02) * Math.abs(baseDeflection);
      const currentDeflection = +(baseDeflection + wave).toFixed(2);
      if (this.deflectionChart) {
        this.deflectionChart.addData(currentDeflection);
      }

      // 2. 模拟应变波动
      const baseStrain = this.trendPoints[1].val;
      const strainWave = (Math.sin(this.tick * 0.25) * .05 + (Math.random() - 0.5) * .02) * Math.abs(baseStrain);
      const currentStrain = +(baseStrain + strainWave).toFixed(4);
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
