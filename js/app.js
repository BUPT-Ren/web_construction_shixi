/**
 * 主应用启动控制器 (app.js)
 */

class AppController {
  constructor() {
    this.currentTab = 'overview'; // 默认启动进入项目总览
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
    window.workorder = new WorkorderController();
    window.portal = new PortalController();
    window.aiChat = new AiChatController();

    // 初始化各个子模块
    window.dashboard.init();
    window.workorder.init();
    window.portal.init();
    window.aiChat.init();

    // 默认展示项目总览
    this.switchTab('overview');

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

  switchToBridge(bridgeId) {
    this.setBridgeDropdownValue(bridgeId, window.SystemMockData.projects);

    window.dashboard.currentProjectId = bridgeId;
    window.dashboard.renderBridgeSvg();
    window.dashboard.renderSensorPills();
    window.dashboard.renderMonitorItems();

    const project = window.SystemMockData.projects.find(p => p.id === bridgeId);
    const cables = (project && project.cables) ? project.cables : [];
    if (window.dashboard.cableChart) {
      window.dashboard.cableChart.updateData(cables);
    }
    const titleEl = document.getElementById('cable-chart-title');
    if (titleEl) {
      titleEl.innerText = cables.length
        ? `斜拉桥索力设计值与实测值对比 (全桥${cables.length}对拉索，误差 < 5%)`
        : '斜拉索索力监测 (当前工程无斜拉索数据)';
    }

    this.switchTab('dashboard');
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
    this.currentTab = tabId;

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
  initModalHandlers() {
    const overlay = document.getElementById('global-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

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

    titleEl.innerText = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.add('active');
  }

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
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
