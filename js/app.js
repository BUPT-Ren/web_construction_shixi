/**
 * 主应用启动控制器 (app.js)
 */

class AppController {
  constructor() {
    this.currentTab = 'dashboard';
    this.modalHistory = [];
    this.clockTimer = null;
    this.bridgeDropdown = null;
  }

  init() {
    this.initClock();
    this.initBridgeSelector();
    this.initNavTabs();
    this.initModalHandlers();

    // 实例化各子系统
    window.dashboard = new DashboardController();
    window.dataHistory = new DataHistoryController();
    window.workorder = new WorkorderController();
    window.portal = new PortalController();
    window.aiChat = new AiChatController();
    window.settings = new SettingsController();

    // 初始化各个子模块
    window.dashboard.init();
    window.dataHistory.init();
    window.workorder.init();
    window.portal.init();
    window.aiChat.init();
    window.settings.init();

    this.switchTab('dashboard');

    // 监听窗口尺寸变化自适应重绘
    window.addEventListener('resize', () => {
      if (window.dashboard && window.dashboard.deflectionChart) {
        window.dashboard.deflectionChart.render();
        window.dashboard.vibrationChart.render();
        if (window.dashboard.cableChart) window.dashboard.cableChart.render();
      }
      if (window.workorder && window.workorder.radarChart) {
        window.workorder.radarChart.render();
        window.workorder.gaugeChart.render();
      }
    });
  }

  initClock() {
    const clockEl = document.getElementById('global-clock');
    const update = () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const str = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      if (clockEl) clockEl.innerText = str;
    };
    update();
    this.clockTimer = setInterval(update, 1000);
  }

  initBridgeSelector() {
    const dropdown = document.getElementById('bridge-dropdown');
    const btn = document.getElementById('bridge-dropdown-btn');
    const menu = document.getElementById('bridge-dropdown-menu');
    const currentEl = document.getElementById('bridge-dropdown-current');
    if (!dropdown || !btn || !menu || !currentEl) return;

    this.bridgeDropdown = { dropdown, btn, menu, currentEl, currentId: null };
    this.renderBridgeDropdownItems();

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleBridgeDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) this.closeBridgeDropdown();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeBridgeDropdown();
    });
  }

  // 重新渲染顶栏“监测对象”下拉项（新增/删除工程后保持同步）
  renderBridgeDropdownItems() {
    if (!this.bridgeDropdown) return;
    const { menu } = this.bridgeDropdown;
    if (!menu) return;
    const projects = window.SystemMockData.projects || [];

    menu.innerHTML = projects.map(p => `
      <div class="bridge-dropdown-item" data-bridge-id="${p.id}" role="option">
        <div class="bridge-dropdown-item-info">
          <div class="bridge-dropdown-item-name">${p.name}</div>
          <div class="bridge-dropdown-item-type">${p.type}</div>
        </div>
        <span class="bridge-dropdown-item-dot"></span>
        <svg class="bridge-dropdown-item-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    `).join('');

    menu.querySelectorAll('.bridge-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-bridge-id');
        this.closeBridgeDropdown();
        this.switchToBridge(id);
      });
    });

    const current = projects.find(p => p.id === this.bridgeDropdown.currentId);
    const target = current || projects[0];
    this.setBridgeDropdownValue(target ? target.id : null, projects);
  }

  refreshBridgeDropdown(preserveId) {
    if (!this.bridgeDropdown) return;
    if (preserveId) this.bridgeDropdown.currentId = preserveId;
    this.renderBridgeDropdownItems();
  }

  setBridgeDropdownValue(bridgeId, projects) {
    if (!this.bridgeDropdown) return;
    const { menu, currentEl } = this.bridgeDropdown;
    this.bridgeDropdown.currentId = bridgeId;
    const p = (projects || window.SystemMockData.projects).find(x => x.id === bridgeId);
    if (currentEl) currentEl.textContent = p ? p.name : '选择工程';
    if (menu) {
      menu.querySelectorAll('.bridge-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-bridge-id') === bridgeId);
      });
    }
  }

  toggleBridgeDropdown() {
    if (!this.bridgeDropdown) return;
    const { dropdown, btn } = this.bridgeDropdown;
    const isOpen = dropdown.classList.toggle('open');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  closeBridgeDropdown() {
    if (!this.bridgeDropdown) return;
    const { dropdown, btn } = this.bridgeDropdown;
    dropdown.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  switchToBridge(bridgeId, targetTab = this.currentTab) {
    if (!window.SystemMockData.projects.some(p => p.id === bridgeId)) return;
    this.closeModal();
    this.setBridgeDropdownValue(bridgeId, window.SystemMockData.projects);

    window.dashboard.currentProjectId = bridgeId;
    window.dashboard.currentViewMode = 'model';
    window.dashboard.renderBridgeSvg();
    window.dashboard.renderSensorPills();
    window.dashboard.renderMonitorItems();
    window.dashboard.renderBoardData();
    window.dataHistory.setProject(bridgeId);

    const project = window.SystemMockData.projects.find(p => p.id === bridgeId);
    const cables = (project && project.cables) ? project.cables : [];
    if (window.dashboard.cableChart) {
      window.dashboard.cableChart.updateData(cables);
    }
    const titleEl = document.getElementById('cable-chart-title');
    if (titleEl) {
      titleEl.innerText = '斜拉索索力对比';
    }

    window.portal.renderRealtimeMonitorTable();
    window.workorder.renderWorkOrders();
    this.switchTab(targetTab);
  }

  initNavTabs() {
    const btns = document.querySelectorAll('.nav-tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    if (!document.getElementById('tab-' + tabId)) return;
    this.closeModal();
    if (tabId !== 'dashboard' && this.exitPresentation) this.exitPresentation();
    this.currentTab = tabId;
    this.renderDataContext();
    if (tabId === 'data-history') requestAnimationFrame(() => window.dataHistory.renderChart());
    if (tabId === 'settings') window.settings.render();

    // 更新按钮高亮
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 切换内容面板
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // 切换后延迟微调重绘图表确保 Canvas 尺寸正确
    setTimeout(() => {
      if (tabId === 'dashboard' && window.dashboard) {
        window.dashboard.deflectionChart && window.dashboard.deflectionChart.render();
        window.dashboard.vibrationChart && window.dashboard.vibrationChart.render();
        window.dashboard.cableChart && window.dashboard.cableChart.render();
      } else if (tabId === 'assessment' && window.workorder) {
        window.workorder.radarChart && window.workorder.radarChart.render();
        window.workorder.gaugeChart && window.workorder.gaugeChart.render();
      }
    }, 50);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 通用模态框
  getDataProject() {
    return window.SystemMockData.projects.find(p => p.id === window.dashboard.currentProjectId);
  }

  getModuleName() {
    return document.querySelector(`.nav-tab-btn[data-tab="${this.currentTab}"]`)?.textContent.trim() || '数据大屏';
  }

  renderDataContext() {
    const project = this.getDataProject();
    if (!project) return;
    const context = document.getElementById('data-context');
    const related = document.getElementById('related-data');
    if (window.workorder.gaugeChart) window.workorder.gaugeChart.score = project.healthScore;
    const conclusion = document.getElementById('assessment-conclusion');
    if (conclusion) conclusion.textContent = project.name + ' · ' + project.healthLevel;
    context.hidden = related.hidden = this.currentTab === 'dashboard' || this.currentTab === 'settings';
    context.innerHTML = `<button type="button" onclick="window.app.switchTab('dashboard')">${window.portal.escapeHtml(project.name)}</button><span>›</span><strong>${this.getModuleName()}</strong>`;
    const groups = {
      bridges: [['桥梁档案', 'project'], ['监测测点', 'points'], ['预警工单', 'alerts'], ['健康评估', 'health']],
      realtime: [['当前桥梁测点', 'points'], ['设备档案', 'devices'], ['相关预警', 'alerts']],
      'data-service': [['采集设备', 'devices'], ['采集测点', 'points']],
      'data-history': [['采集测点', 'points'], ['设备档案', 'devices']],
      alarm: [['当前桥梁预警', 'alerts'], ['关联监测测点', 'points']],
      assessment: [['健康评估', 'health'], ['评估监测依据', 'points'], ['预警工单', 'alerts']],
      projects: [['桥梁档案', 'project'], ['所属设备', 'devices'], ['健康评估', 'health']],
      safety: [['结构健康评估', 'health'], ['预警处置记录', 'alerts'], ['现场设备', 'devices']],
      video: [['视频设备', 'cameras'], ['预警事件', 'alerts']],
      query: [['测点数据', 'points'], ['设备记录', 'devices'], ['预警记录', 'alerts']],
      ai: [['当前桥梁档案', 'project'], ['监测数据', 'points'], ['关联预警', 'alerts']]
    };
    related.innerHTML = (groups[this.currentTab] || []).map(([name, detail]) =>
      `<button type="button" onclick="window.app.openRelated('${detail}')"><span>${name}</span><b>查看 ›</b></button>`).join('');
  }

  openRelated(detail) {
    const project = this.getDataProject();
    if (detail === 'points') {
      const points = project.keyPoints || [];
      this.showModal('监测测点 · ' + project.name, `<div class="board-detail-list">${points.map(p => `<button onclick="window.dashboard.openSensorInfo('${p.id}')"><span>${p.id} · ${p.name}<small>${p.code} · ${p.type}</small></span><strong>${p.val} ${p.unit}</strong><b>›</b></button>`).join('') || '<p>暂无关联测点</p>'}</div>`);
    } else if (detail === 'cameras') {
      const devices = window.SystemMockData.deviceGrid.filter(d => d.bridge === project.name && /视频|球机|摄像/.test(d.type));
      this.showModal('视频设备 · ' + project.name, `<div class="board-detail-list">${devices.map(d => `<button onclick="window.workorder.showDeviceDetail('${d.code}')"><span>${d.code}<small>${d.type}</small></span><strong>${d.status === 'online' ? '在线' : '离线'}</strong><b>›</b></button>`).join('') || '<p>暂无视频设备</p>'}</div>`);
    } else {
      window.dashboard.openBoardDetail({detail});
    }
  }

  openProjectData(projectId, detail) {
    if (projectId !== window.dashboard.currentProjectId) this.switchToBridge(projectId);
    this.openRelated(detail);
  }

  openSensorDevices(index) {
    const sensor = window.SystemMockData.sensorsList[index];
    const category = window.workorder.deviceCategory(sensor.name);
    const project = this.getDataProject();
    const devices = window.SystemMockData.deviceGrid.filter(d => d.bridge === project.name && window.workorder.deviceCategory(d.type) === category);
    this.showModal(category + ' · 已安装设备', `<div class="board-detail-list">${devices.map(d => `<button onclick="window.workorder.showDeviceDetail('${d.code}')"><span>${d.type}<small>${d.code} · ${d.point?.name || '未关联测点'}</small></span><b>查看 ›</b></button>`).join('') || '<p>当前桥梁暂无该类设备</p>'}</div>`);
  }

  initModalHandlers() {
    const overlay = document.getElementById('global-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    const trail = document.createElement('nav');
    trail.id = 'modal-trail';
    trail.className = 'modal-trail';
    trail.setAttribute('aria-label', '详情层级');
    document.getElementById('modal-body-container').before(trail);

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  showModal(title, htmlContent) {
    const overlay = document.getElementById('global-modal-overlay');
    const titleEl = document.getElementById('modal-title-text');
    const bodyEl = document.getElementById('modal-body-container');
    if (!overlay || !titleEl || !bodyEl) return;
    // 桥梁和模块占前两层，弹窗最多保留分类及对象详情两层。
    const entry = {title, htmlContent};
    if (!overlay.classList.contains('active')) this.modalHistory = [];
    if (this.modalHistory.length < 2) this.modalHistory.push(entry);
    else this.modalHistory[1] = entry;
    this.renderModalTrail();
    titleEl.innerText = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.add('active');
  }

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    this.modalHistory = [];
  }

  renderModalTrail() {
    const project = this.getDataProject();
    const trail = document.getElementById('modal-trail');
    const name = window.portal.escapeHtml(project?.name || '桥梁');
    trail.innerHTML = `<button onclick="window.app.closeModal()">${name}</button><span>›</span><button onclick="window.app.closeModal()">${this.getModuleName()}</button>` +
      this.modalHistory.map((entry, i) => `<span>›</span><button onclick="window.app.returnModal(${i})" ${i === this.modalHistory.length - 1 ? 'aria-current="page"' : ''}>${window.portal.escapeHtml(entry.title)}</button>`).join('') +
      (this.modalHistory.length > 1 ? '<button class="modal-back" onclick="window.app.returnModal(0)">返回上一级</button>' : '');
  }

  returnModal(index) {
    const entry = this.modalHistory[index];
    if (!entry) return;
    this.modalHistory = this.modalHistory.slice(0, index + 1);
    document.getElementById('modal-title-text').textContent = entry.title;
    document.getElementById('modal-body-container').innerHTML = entry.htmlContent;
    this.renderModalTrail();
  }

  toast(message, type) {
    const container = document.getElementById('global-toast');
    if (!container) return;
    const icons = { success: '✓', warning: '!', error: '✕' };
    const t = document.createElement('div');
    t.className = 'global-toast ' + (type || 'success');
    t.innerHTML = `<span class="toast-icon">${icons[type] || icons.success}</span><span>${message}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 2600);
  }

  toggleFullScreen() {
    if (this.currentTab === 'dashboard') {
      const button = document.getElementById('board-fullscreen');
      const leave = () => {
        document.body.classList.remove('board-presenting');
        button.textContent = '全屏展示';
        document.removeEventListener('keydown', escape);
        document.removeEventListener('fullscreenchange', changed);
      };
      const escape = e => { if (e.key === 'Escape') leave(); };
      const changed = () => { if (!document.fullscreenElement) leave(); };
      if (document.body.classList.contains('board-presenting')) {
        this.exitPresentation();
        return;
      }
      document.body.classList.add('board-presenting');
      button.textContent = '退出全屏';
      document.addEventListener('keydown', escape);
      document.addEventListener('fullscreenchange', changed);
      this.exitPresentation = () => {
        leave();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        this.exitPresentation = null;
      };
      document.documentElement.requestFullscreen?.().catch(() => {});
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();

  window.demoAuth = new DemoAuthController();
  window.demoAuth.init();
});
