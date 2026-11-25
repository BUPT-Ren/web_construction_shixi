/**
 * 预警巡检与工单闭环管理 + 健康度评估报告控制器 (workorder.js)
 */

class WorkorderController {
  constructor() {
    this.radarChart = null;
    this.gaugeChart = null;
    this.deviceFilter = { category: '全部', bridge: '', status: '', search: '', page: 1 };
    this.devicesPerPage = 24;
  }

  init() {
    this.initDeviceGrid();
    this.renderWorkOrders();
    this.initHealthAssessment();
  }

  deviceCategory(type) {
    if (/水准|位移|GNSS|北斗/.test(type)) return '变形与位移';
    if (/应变|索力|磁通量/.test(type)) return '应变与索力';
    if (/加速度|振动/.test(type)) return '振动与加速度';
    if (/倾角/.test(type)) return '倾角';
    if (/风速|温度|湿度|气象/.test(type)) return '气象与环境';
    if (/视频|球机|摄像/.test(type)) return '视频监控';
    return '其他设备';
  }

  initDeviceGrid() {
    const bridgeFilter = document.getElementById('device-bridge-filter');
    window.SystemMockData.projects.forEach(project => bridgeFilter.add(new Option(project.name, project.name)));
    const bindFilter = (id, key, eventName) => {
      document.getElementById(id).addEventListener(eventName, event => {
        this.deviceFilter[key] = event.target.value;
        this.deviceFilter.page = 1;
        this.renderDeviceGrid();
      });
    };
    bindFilter('device-search', 'search', 'input');
    bindFilter('device-bridge-filter', 'bridge', 'change');
    bindFilter('device-status-filter', 'status', 'change');
    document.getElementById('device-categories').addEventListener('click', event => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      this.deviceFilter.category = button.dataset.category;
      this.deviceFilter.page = 1;
      this.renderDeviceGrid();
    });
    document.getElementById('device-prev').addEventListener('click', () => {
      this.deviceFilter.page--;
      this.renderDeviceGrid();
    });
    document.getElementById('device-next').addEventListener('click', () => {
      this.deviceFilter.page++;
      this.renderDeviceGrid();
    });
    this.renderDeviceGrid();
  }

  renderDeviceGrid() {
    const gridEl = document.getElementById('device-grid-matrix');
    if (!gridEl) return;
    const devices = window.SystemMockData.deviceGrid;
    const filter = this.deviceFilter;
    const online = devices.filter(d => d.status === 'online').length;
    document.getElementById('device-total').textContent = devices.length;
    document.getElementById('device-online').textContent = online;
    document.getElementById('device-offline').textContent = devices.length - online;

    const query = filter.search.trim().toLowerCase();
    const matching = devices.filter(d =>
      (!filter.bridge || d.bridge === filter.bridge) &&
      (!filter.status || (filter.status === 'online' ? d.status === 'online' : d.status !== 'online')) &&
      (!query || [d.code, d.type, d.bridge, d.point?.id, d.point?.name].some(value => value && value.toLowerCase().includes(query)))
    );
    const categories = ['全部', '变形与位移', '应变与索力', '振动与加速度', '倾角', '气象与环境', '视频监控', '其他设备'];
    document.getElementById('device-categories').innerHTML = categories.map(category => {
      const count = category === '全部' ? matching.length : matching.filter(d => this.deviceCategory(d.type) === category).length;
      return `<button type="button" data-category="${category}" aria-pressed="${filter.category === category}">${category}<span>${count}</span></button>`;
    }).join('');

    const filtered = matching.filter(d => filter.category === '全部' || this.deviceCategory(d.type) === filter.category);
    const pageCount = Math.max(1, Math.ceil(filtered.length / this.devicesPerPage));
    filter.page = Math.min(Math.max(filter.page, 1), pageCount);
    const start = (filter.page - 1) * this.devicesPerPage;
    const page = filtered.slice(start, start + this.devicesPerPage);
    document.getElementById('device-list-title').textContent = filter.category === '全部' ? '全部设备' : filter.category;
    document.getElementById('device-result-count').textContent = `共 ${filtered.length} 台`;
    document.getElementById('device-page-info').textContent = filtered.length ? `第 ${start + 1}–${start + page.length} 台 / 共 ${filtered.length} 台` : '暂无匹配设备';
    document.getElementById('device-prev').disabled = filter.page <= 1;
    document.getElementById('device-next').disabled = filter.page >= pageCount;

    gridEl.innerHTML = page.map(d => `
      <button type="button" id="device-${d.code}" class="device-grid-tag" onclick="window.workorder.showDeviceDetail('${d.code}')">
        <span class="device-card-top"><span class="device-type">${d.type}</span><span class="device-status ${d.status === 'online' ? '' : 'is-offline'}"><i></i>${d.status === 'online' ? '在线' : '离线'}</span></span>
        <span class="device-tag-code">${d.code}</span>
        <span class="device-card-bridge">${d.bridge}</span>
        <span class="device-card-location">${d.point ? d.point.id + ' · ' + d.point.name : '未关联大屏测点'}</span>
        ${d.point ? `<span class="device-card-reading"><strong>${d.point.val}</strong> ${d.point.unit}</span>` : ''}
      </button>
    `).join('') || '<div class="device-empty">没有找到符合条件的设备</div>';
  }

  // 渲染预警闭环工单列表
  renderWorkOrders() {
    const tableBody = document.getElementById('work-order-tbody');
    if (!tableBody) return;
    const orders = window.SystemMockData.workOrders.filter(o => o.bridge === window.app.getDataProject().name);

    tableBody.innerHTML = orders.map(o => `
      <tr>
        <td style="font-family:monospace; color:var(--color-primary);">${o.id}</td>
        <td><strong>${o.bridge}</strong></td>
        <td>${o.sensor}</td>
        <td><span class="badge ${o.levelClass}">${o.level}</span></td>
        <td style="font-family:monospace; color:var(--color-warning);">${o.triggerValue}</td>
        <td style="font-family:monospace; font-size:11px; color:var(--text-muted);">${o.time}</td>
        <td><span class="badge ${o.stage === '已闭环归档' ? 'badge-success' : 'badge-primary'}">${o.stage}</span></td>
        <td>${o.handler}</td>
        <td>
          <button class="btn-outline" style="padding:3px 8px; font-size:11px;" onclick="window.workorder.viewOrderDetail('${o.id}')">查看处置</button>
        </td>
      </tr>
    `).join('');
  }

  initHealthAssessment() {
    // 结构五维健康度雷达图
    this.radarChart = new HealthRadarChart('chart-health-radar', 
      ['变形稳定性', '结构受力度', '动力振动响应', '环境耐久性', '表观病害指标'],
      [95, 92, 89, 97, 93]
    );

    // 综合健康指数仪表盘
    this.gaugeChart = new GaugeChart('chart-health-gauge', 94.6, '全桥综合安全度评分');
  }

  showDeviceDetail(code) {
    const d = window.SystemMockData.deviceGrid.find(x => x.code === code);
    if (!d) return;
    const project = window.SystemMockData.projects.find(p => p.name === d.bridge);
    if (project && project.id !== window.dashboard.currentProjectId) window.app.switchToBridge(project.id);
    const relatedOrders = window.SystemMockData.workOrders.filter(o => o.bridge === d.bridge && d.point && o.sensor.startsWith(d.point.id + ' '));

    window.app.showModal('设备在线运行档案: ' + code, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="background:var(--color-primary-dim); padding:14px; border-radius:8px; border:1px solid rgba(31,111,235,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="color:var(--color-primary); font-size:16px;">设备编号：${d.code}</h4>
            <span class="badge badge-success">● 在线传输中 (4G/光纤)</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary);">所属工程：${d.bridge} | 传感器类型：${d.type}</p>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:12px; color:var(--text-main);">
          ${d.point ? `<tr><th>布设测点</th><td>${d.point.id} · ${d.point.name}</td></tr><tr><th>当前示例读数</th><td>${d.point.val} ${d.point.unit}</td></tr>` : ''}
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">通信协议规范</td><td style="padding:8px 0; font-family:monospace;">JT/T 1037-2022 / MQTT 工业物联网</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">供电与工作电压</td><td style="padding:8px 0; font-family:monospace;">DC 24V (当前实测: ${d.voltage})</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">网络信噪比 (RSSI)</td><td style="padding:8px 0; font-family:monospace;">${d.rssi} (链路质量极佳)</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">边缘缓存能力</td><td style="padding:8px 0;">支持本地断网存储不少于 <strong>180 天</strong>，断点续传不丢数</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">最新上传数据时间</td><td style="padding:8px 0; font-family:monospace;">${d.lastUpload}</td></tr>
        </table>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
          ${relatedOrders.map(o => `<button class="btn-outline" onclick="window.workorder.viewOrderDetail('${o.id}')">关联预警 · ${o.id}</button>`).join('')}
          <button class="btn-outline" onclick="window.app.closeModal()">关闭</button>
          ${window.app.currentTab === 'dashboard' ? `<button class="btn-primary" onclick="window.workorder.locateDevice('${code}')">在设备管理中定位</button>` : ''}
          <button class="btn-primary" onclick="window.app.toast('已下发远程自检指令，设备运行正常！', 'success')">远程诊断自检</button>
        </div>
      </div>
    `);
  }

  locateDevice(code) {
    window.app.closeModal();
    this.deviceFilter = { category: '全部', bridge: '', status: '', search: code, page: 1 };
    document.getElementById('device-search').value = code;
    document.getElementById('device-bridge-filter').value = '';
    document.getElementById('device-status-filter').value = '';
    this.renderDeviceGrid();
    window.app.switchTab('realtime');
    const device = document.getElementById('device-' + code);
    if (device) {
      device.focus({preventScroll: true});
      device.scrollIntoView({block: 'center'});
    }
  }

  viewOrderDetail(orderId) {
    const o = window.SystemMockData.workOrders.find(x => x.id === orderId);
    if (!o) return;
    const project = window.SystemMockData.projects.find(p => p.name === o.bridge);
    if (project && project.id !== window.dashboard.currentProjectId) window.app.switchToBridge(project.id);
    const point = project?.keyPoints.find(p => o.sensor.startsWith(p.id + ' '));

    window.app.showModal('预警处置与闭环工单详情: ' + o.id, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
          <div>
            <h4 style="color:var(--text-main); font-size:16px;">${o.type}</h4>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">所属工程：${o.bridge} | 触发测点：${o.sensor}</div>
          </div>
          <span class="badge ${o.levelClass}">${o.level}</span>
        </div>

        <div style="background:#f6f8fa; padding:12px; border-radius:6px; font-size:12px; line-height:1.6;">
          <div style="color:var(--text-muted);">预警触发值：<span style="color:#d98324; font-family:monospace; font-weight:600;">${o.triggerValue}</span></div>
          <div style="color:var(--text-muted);">发生时间：<span style="color:var(--text-main); font-family:monospace;">${o.time}</span></div>
          <div style="color:var(--text-muted);">研判处置意见：<span style="color:var(--text-main);">${o.proposal}</span></div>
        </div>

        <div style="border:1px dashed rgba(31,111,235,0.4); padding:12px; border-radius:6px;">
          <div style="font-size:12px; color:var(--color-primary); font-weight:600; margin-bottom:6px;">工单流转审批闭环进度：</div>
          <div style="font-size:12px; color:var(--text-secondary);">
            1. 自动规则研判 -> 2. 派单至工程部 -> 3. 责任工程师（${o.handler}）已审核评估 -> 4. 跟踪归档
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn-outline" onclick="window.app.modalHistory.length > 1 ? window.app.returnModal(0) : window.app.closeModal()">返回上一级</button>
          ${point ? `<button class="btn-primary" onclick="window.workorder.showDeviceDetail('${point.code}')">关联设备 · ${point.code}</button>` : '<span>该事件暂无关联设备档案</span>'}
          <button class="btn-primary" onclick="window.app.toast('审批成功！已同步至省级桥群管理系统并完成归档留痕。', 'success'); window.app.closeModal();">审批通过并归档</button>
        </div>
      </div>
    `);
  }

  // 生成健康度评估报告模态预览
  generateReport() {
    const project = window.app.getDataProject();
    window.app.showModal('结构健康评估报告 · ' + project.name, `
      <h2>${project.name}结构健康评估</h2>
      <p>健康指数 ${project.healthScore} 分 · ${project.healthLevel}</p>
      <p class="board-detail-note">以下为当前演示监测记录，周期报告接入历史采集数据后生成。</p>
      <div class="board-detail-list">${project.keyPoints.map(point => `
        <button onclick="window.dashboard.openSensorInfo('${point.id}')">
          <span>${point.id} · ${point.name}<small>${point.code}</small></span>
          <strong>${point.val} ${point.unit}</strong><b>查看 ›</b>
        </button>`).join('')}</div>
      <button class="btn-outline" onclick="window.print()">打印 / 导出 PDF</button>`);
  }
}

window.WorkorderController = WorkorderController;
