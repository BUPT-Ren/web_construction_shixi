/**
 * 系统方案介绍与案例中心业务逻辑 (portal.js)
 */

class PortalController {
  init() {
    this.renderSensorsGrid();
    this.renderResearchPapers();
    this.renderCasesList();
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
          <button class="btn-primary" onclick="window.app.closeModal()">确定</button>
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
            <button class="btn-outline" style="margin-left:auto; padding:3px 10px; font-size:11px;" onclick="window.app.switchToBridge('${p.id}')">进入大屏监测</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

window.PortalController = PortalController;
