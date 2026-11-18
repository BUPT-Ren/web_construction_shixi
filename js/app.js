/**
 * 主应用启动控制器 (app.js)
 */

class AppController {
  constructor() {
    this.currentTab = 'dashboard'; // 默认启动直接打开最具视觉冲击力的监测大屏
    this.clockTimer = null;
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

    // 默认展示大屏
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
    const select = document.getElementById('global-bridge-select');
    if (!select) return;

    select.innerHTML = window.SystemMockData.projects.map(p => `
      <option value="${p.id}">${p.name} (${p.type})</option>
    `).join('');

    select.addEventListener('change', (e) => {
      this.switchToBridge(e.target.value);
    });
  }

  switchToBridge(bridgeId) {
    const select = document.getElementById('global-bridge-select');
    if (select) select.value = bridgeId;

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
});
