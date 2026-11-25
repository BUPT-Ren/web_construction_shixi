/**
 * 系统方案介绍与案例中心业务逻辑 (portal.js)
 */

class PortalController {
  constructor() {
    this.currentRole = null;
  }

  init() {
    this.renderSensorsGrid();
    this.renderResearchPapers();
    this.renderCasesList();
    this.renderRealtimeMonitorTable();
    this.renderProjectsTable();
  }

  // 根据当前登录角色刷新项目管理权限 UI
  applyRole(role) {
    this.currentRole = role || null;
    this.renderProjectsToolbar();
    this.renderProjectsTable();
  }

  renderProjectsToolbar() {
    const el = document.getElementById('projects-admin-actions');
    if (!el) return;
    if (this.currentRole === 'admin') {
      el.innerHTML = '<button class="btn-primary project-add-btn" onclick="window.portal.openProjectForm(null)">＋ 新增工程</button>';
    } else {
      const roleName = this.currentRole === 'engineer' ? '工程师' : '访客';
      el.innerHTML = `<span class="projects-role-hint">🔒 当前为${roleName}权限：仅可查看工程，新增 / 编辑 / 删除仅管理员可用</span>`;
    }
  }

  escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  denyAdminAction() {
    window.app.toast('该操作仅管理员可执行，请联系管理员', 'warning');
  }

  refreshProjectViews() {
    this.renderProjectsTable();
    this.renderCasesList();
    if (window.app && window.app.refreshBridgeDropdown) {
      window.app.refreshBridgeDropdown();
    }
    const boardSelect = document.getElementById('board-bridge');
    const deviceSelect = document.getElementById('device-bridge-filter');
    const selectedBridge = window.dashboard.currentProjectId;
    boardSelect.replaceChildren(...window.SystemMockData.projects.map(p => new Option(p.name, p.id)));
    boardSelect.value = selectedBridge;
    deviceSelect.replaceChildren(new Option('全部桥梁', ''), ...window.SystemMockData.projects.map(p => new Option(p.name, p.name)));
    window.dashboard.renderBoardData();
    window.dashboard.renderProjectSummary(window.app.getDataProject());
    window.dataHistory.setProject(selectedBridge);
    window.workorder.renderDeviceGrid();
    this.renderRealtimeMonitorTable();
    window.app.renderDataContext();
  }

  openProjectForm(projectId) {
    if (this.currentRole !== 'admin') {
      this.denyAdminAction();
      return;
    }
    const isEdit = !!projectId;
    const p = isEdit ? window.SystemMockData.projects.find((x) => x.id === projectId) : null;
    if (isEdit && !p) return;

    const val = (v) => this.escapeHtml(v);
    window.app.showModal(isEdit ? `编辑工程：${p.name}` : '新增监测工程', `
      <form class="project-form" onsubmit="return false;">
        <div class="project-form-row">
          <div class="project-form-field">
            <label>工程名称 *</label>
            <input id="pf-name" type="text" value="${isEdit ? val(p.name) : ''}" placeholder="如：某某大桥" />
          </div>
          <div class="project-form-field">
            <label>结构类型 *</label>
            <input id="pf-type" type="text" value="${isEdit ? val(p.type) : ''}" placeholder="如：独塔斜拉桥" />
          </div>
        </div>
        <div class="project-form-row">
          <div class="project-form-field">
            <label>所在地</label>
            <input id="pf-location" type="text" value="${isEdit ? val(p.location) : ''}" placeholder="如：河北省" />
          </div>
          <div class="project-form-field">
            <label>规模</label>
            <input id="pf-span" type="text" value="${isEdit ? val(p.span) : ''}" placeholder="如：主跨 160m + 边跨 100m" />
          </div>
        </div>
        <div class="project-form-row">
          <div class="project-form-field">
            <label>运行状态</label>
            <input id="pf-status" type="text" value="${isEdit ? val(p.status) : '正常服役监测中'}" />
          </div>
          <div class="project-form-field">
            <label>健康指数（0-100）</label>
            <input id="pf-score" type="number" min="0" max="100" step="0.1" value="${isEdit ? p.healthScore : 90}" />
          </div>
        </div>
        <div class="project-form-field">
          <label>简介</label>
          <textarea id="pf-desc" rows="3" placeholder="可选，简要描述工程特点">${isEdit ? val(p.description) : ''}</textarea>
        </div>
        <div class="project-form-actions">
          <button type="button" class="btn-outline" onclick="window.app.closeModal()">取消</button>
          <button type="button" class="btn-primary" onclick="window.portal.submitProjectForm(${isEdit ? `'${p.id}'` : 'null'})">${isEdit ? '保存修改' : '创建工程'}</button>
        </div>
      </form>
    `);
  }

  submitProjectForm(projectId) {
    if (this.currentRole !== 'admin') {
      this.denyAdminAction();
      return;
    }
    const name = (document.getElementById('pf-name').value || '').trim();
    const type = (document.getElementById('pf-type').value || '').trim();
    const location = (document.getElementById('pf-location').value || '').trim();
    const span = (document.getElementById('pf-span').value || '').trim();
    const status = (document.getElementById('pf-status').value || '').trim();
    const scoreInput = parseFloat(document.getElementById('pf-score').value);
    const description = (document.getElementById('pf-desc').value || '').trim();

    if (!name || !type) {
      window.app.toast('请至少填写工程名称和结构类型', 'warning');
      return;
    }

    const healthScore = Number.isFinite(scoreInput) ? Math.max(0, Math.min(100, scoreInput)) : 90;
    const healthLevel = healthScore >= 90 ? 'A级 (优良)' : healthScore >= 80 ? 'B级 (良好)' : 'C级 (需关注)';

    if (projectId) {
      const p = window.SystemMockData.projects.find((x) => x.id === projectId);
      if (!p) return;
      const oldName = p.name;
      Object.assign(p, {
        name, type, location, span,
        status: status || p.status,
        healthScore, healthLevel,
        description: description || p.description
      });
      window.SystemMockData.deviceGrid.filter(d => d.bridge === oldName).forEach(d => { d.bridge = name; });
      window.SystemMockData.workOrders.filter(o => o.bridge === oldName).forEach(o => { o.bridge = name; });
      window.app.closeModal();
      this.refreshProjectViews();
      window.app.toast('工程信息已更新', 'success');
      return;
    }

    window.SystemMockData.projects.push({
      id: `proj_${Date.now()}`,
      name,
      type,
      location,
      span,
      status: status || '正常服役监测中',
      healthScore,
      healthLevel,
      description: description || '新增监测工程（演示数据）。',
      image: '',
      keyPoints: [],
      cables: [],
      monitoringItems: []
    });
    window.app.closeModal();
    this.refreshProjectViews();
    window.app.toast('工程已创建（演示数据，刷新页面后恢复）', 'success');
  }

  confirmDeleteProject(projectId) {
    if (this.currentRole !== 'admin') {
      this.denyAdminAction();
      return;
    }
    const p = window.SystemMockData.projects.find((x) => x.id === projectId);
    if (!p) return;
    window.app.showModal('删除确认', `
      <div style="font-size:13px; color:var(--text-secondary); line-height:1.8;">
        确定要删除工程 <strong style="color:var(--text-main);">${this.escapeHtml(p.name)}</strong> 吗？<br/>
        删除后该工程会从项目清单和顶栏“监测对象”中移除（演示数据，刷新页面后恢复）。
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
        <button class="btn-outline" onclick="window.app.closeModal()">取消</button>
        <button class="btn-primary" style="background:linear-gradient(135deg,#e5484d,#c93a3f);" onclick="window.portal.deleteProject('${p.id}')">确认删除</button>
      </div>
    `);
  }

  deleteProject(projectId) {
    if (this.currentRole !== 'admin') {
      this.denyAdminAction();
      return;
    }
    const projects = window.SystemMockData.projects;
    if (projects.length <= 1) {
      window.app.closeModal();
      window.app.toast('至少需要保留一个监测工程', 'warning');
      return;
    }
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx < 0) return;

    const wasCurrent = window.dashboard && window.dashboard.currentProjectId === projectId;
    projects.splice(idx, 1);
    window.app.closeModal();

    if (wasCurrent) {
      const next = projects[0];
      window.dashboard.currentProjectId = next.id;
      window.dashboard.renderBridgeSvg();
      window.dashboard.renderSensorPills();
      window.dashboard.renderMonitorItems();
      if (window.dashboard.cableChart) {
        window.dashboard.cableChart.updateData(next.cables || []);
      }
    }

    this.refreshProjectViews();
    window.app.toast('工程已删除（演示数据，刷新页面后恢复）', 'success');
  }

  // 渲染传感器设备矩阵
  renderSensorsGrid() {
    const grid = document.getElementById('sensor-cards-grid');
    if (!grid) return;
    const list = window.SystemMockData.sensorsList;

    grid.innerHTML = list.map((s, idx) => `
      <div class="sensor-card-item" onclick="window.portal.showSensorModal(${idx})">
        <div class="sensor-card-img-wrap">
          ${s.image
            ? `<img src="${s.image}" alt="${s.name}" onerror="this.src='assets/img/sensor_fiber.jpeg'"/>`
            : `<div class="sensor-img-placeholder">${s.name}</div>`}
        </div>
        <div class="badge badge-primary" style="align-self:flex-start; margin-bottom:6px;">${s.tag}</div>
        <div class="sensor-card-name">${s.name}</div>
        <div class="sensor-card-target">${s.target}</div>
        <div class="sensor-card-principle">${s.principle}</div>
      </div>
    `).join('');
  }

  showSensorModal(idx) {
    const s = window.SystemMockData.sensorsList[idx];
    if (!s) return;

    window.app.showModal(`核心感知设备：${s.name}`, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; gap:20px; align-items:center; background:#f6f8fa; padding:16px; border-radius:8px;">
          <div style="width:140px; height:120px; background:#ffffff; border-radius:6px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid var(--border-color);">
            ${s.image
              ? `<img src="${s.image}" style="max-width:90%; max-height:90%; object-fit:contain;" />`
              : `<span style="color:var(--color-primary); font-size:13px; font-weight:600; text-align:center; padding:8px;">${s.name}</span>`}
          </div>
          <div style="flex:1;">
            <div class="badge badge-primary" style="margin-bottom:6px;">${s.tag}</div>
            <h3 style="color:var(--text-main); font-size:18px; margin-bottom:4px;">${s.name}</h3>
            <p style="color:var(--color-primary); font-size:13px;">监测物理量：${s.target}</p>
          </div>
        </div>

        <div>
          <h4 style="color:var(--color-primary); margin-bottom:6px; font-size:13px;">技术路线与工作原理：</h4>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; background:#f6f8fa; padding:12px; border-radius:6px;">
            ${s.principle}
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div style="background:#f6f8fa; padding:10px; border-radius:6px;">
            <div style="font-size:11px; color:var(--text-muted);">工程测量精度 / 规格</div>
            <div style="font-size:13px; color:var(--text-main); font-family:monospace; margin-top:4px;">${s.accuracy}</div>
          </div>
          <div style="background:#f6f8fa; padding:10px; border-radius:6px;">
            <div style="font-size:11px; color:var(--text-muted);">规范合规依据</div>
            <div style="font-size:13px; color:var(--color-success); margin-top:4px;">符合 JT/T 1037-2022</div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:6px;">
          <button class="btn-primary" onclick="window.app.openSensorDevices(${idx})">查看当前桥梁已安装设备</button>
        </div>
      </div>
    `);
  }

  // 渲染科研论文成果矩阵
  renderResearchPapers() {
    const container = document.getElementById('research-papers-grid');
    if (!container) return;
    const papers = window.SystemMockData.researchPapers;

    container.innerHTML = papers.map(p => `
      <div class="paper-card">
        <div class="paper-thumb">
          <img src="${p.image}" alt="${p.title}" />
        </div>
        <div class="paper-content">
          <div class="paper-journal-tag">${p.journal} · [${p.type}]</div>
          <div class="paper-title">${p.title}</div>
          <div class="paper-summary">${p.summary}</div>
          <div class="paper-tags">
            ${p.tags.map(t => `<span class="paper-tag-item">#${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // 渲染典型工程案例
  renderCasesList() {
    const container = document.getElementById('cases-grid-layout');
    if (!container) return;
    const projects = window.SystemMockData.projects;

    container.innerHTML = projects.map(p => `
      <div class="case-card-big">
        <div class="case-card-hero-img">
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}" />`
            : `<div class="case-img-placeholder"><span>${p.type}</span><small>工程实景待补充</small></div>`}
          <div class="case-card-type-badge">${p.type}</div>
        </div>
        <div class="case-card-details">
          <div class="case-card-title">${p.name}</div>
          <div class="case-card-location">📍 ${p.location} | 跨度规模: ${p.span}</div>
          <div class="case-card-highlights">${p.description}</div>
          
          <div class="case-data-badges">
            <span class="badge badge-success">运行状态: ${p.status}</span>
            <span class="badge badge-primary">健康指数: ${p.healthScore}分 (${p.healthLevel})</span>
            <button class="btn-outline" onclick="window.app.openProjectData('${p.id}', 'points')">监测测点</button>
            <button class="btn-outline" onclick="window.app.openProjectData('${p.id}', 'health')">健康评估</button>
            <button class="btn-outline" style="margin-left:auto; padding:3px 10px; font-size:11px;" onclick="window.app.switchToBridge('${p.id}', 'dashboard')">进入大屏监测</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 渲染实时监测数据表（监测项实时数据）
  renderRealtimeMonitorTable() {
    const tbody = document.getElementById('realtime-monitor-body');
    if (!tbody) return;
    const project = window.app.getDataProject();
    const items = project?.keyPoints || [];
    tbody.innerHTML = items.map(it => `
      <tr>
        <td><button class="data-row-link" onclick="window.dashboard.openSensorInfo('${it.id}')">${it.id} · ${it.name} ›</button></td>
        <td style="font-family:monospace; font-weight:600; color:var(--text-main);">${it.val}</td>
        <td>${it.unit}</td>
        <td><span class="badge badge-success">● 正常</span></td>
      </tr>
    `).join('');
  }

  // 渲染项目管理表格（含角色权限操作列）
  renderProjectsTable() {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) return;
    const isAdmin = this.currentRole === 'admin';
    tbody.innerHTML = window.SystemMockData.projects.map((p) => `
      <tr>
        <td><button class="data-row-link" onclick="window.app.openProjectData('${p.id}', 'project')">${p.name} ›</button></td>
        <td>${p.type}</td>
        <td>${p.location} · ${p.span}</td>
        <td><span class="badge badge-success">${p.status}</span></td>
        <td><button class="data-row-link" onclick="window.app.openProjectData('${p.id}', 'health')">${p.healthScore} 分 ›</button></td>
        <td>
          ${isAdmin
            ? `<div class="project-row-actions">
                 <button class="btn-outline project-action-btn" onclick="window.portal.openProjectForm('${p.id}')">编辑</button>
                 <button class="btn-outline project-action-btn project-action-danger" onclick="window.portal.confirmDeleteProject('${p.id}')">删除</button>
               </div>`
            : `<button class="btn-outline project-action-btn project-lock-btn" onclick="window.portal.denyAdminAction()">🔒 仅管理员</button>`}
        </td>
      </tr>
    `).join('');
  }
}

window.PortalController = PortalController;
