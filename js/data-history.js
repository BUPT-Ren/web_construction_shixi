class DataHistoryController {
  constructor() {
    this.projectId = null;
    this.attributeId = null;
    this.rows = [];
    this.chart = null;
  }

  init() {
    const now = new Date();
    const localValue = date => {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };
    document.getElementById('history-start').value = localValue(new Date(now.getTime() - 24 * 3600000));
    document.getElementById('history-end').value = localValue(now);
    document.getElementById('history-search').addEventListener('input', () => this.renderAttributes());
    document.getElementById('history-attributes').addEventListener('click', event => {
      const button = event.target.closest('[data-attribute]');
      if (button) this.selectAttribute(button.dataset.attribute);
    });
    document.getElementById('history-point').addEventListener('change', () => this.query());
    document.getElementById('history-form').addEventListener('submit', event => {
      event.preventDefault();
      this.query();
    });
    document.querySelector('.history-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-history-view]');
      if (!button) return;
      document.querySelectorAll('[data-history-view]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
      document.getElementById('history-chart-view').hidden = button.dataset.historyView !== 'chart';
      document.getElementById('history-table-view').hidden = button.dataset.historyView !== 'table';
      if (button.dataset.historyView === 'chart') requestAnimationFrame(() => this.renderChart());
    });
    document.getElementById('history-device').addEventListener('click', () => {
      const point = this.currentPoint();
      if (point?.code) window.workorder.showDeviceDetail(point.code);
    });
    document.getElementById('history-export').addEventListener('click', () => this.exportCsv());
    window.addEventListener('resize', () => this.renderChart());
    this.setProject(window.dashboard.currentProjectId);
  }

  setProject(projectId) {
    this.projectId = projectId;
    const project = window.SystemMockData.projects.find(item => item.id === projectId);
    if (!project) return;
    this.attributes = (project.keyPoints || []).map(point => ({
      id: point.id, name: point.name, unit: point.unit, points: [point]
    }));
    (project.monitoringItems || []).forEach((item, index) => {
      if (this.attributes.some(attribute => attribute.name === item.name)) return;
      this.attributes.push({
        id: 'item-' + index, name: item.name, unit: item.unit,
        points: [{id: 'item-' + index, name: item.name, val: Number(item.value), unit: item.unit, status: item.status}]
      });
    });
    document.getElementById('history-project-name').textContent = project.name;
    document.getElementById('history-search').value = '';
    this.attributeId = this.attributes[0]?.id || null;
    this.renderAttributes();
    this.renderPointSelector();
    this.query();
  }

  currentAttribute() {
    return this.attributes.find(attribute => attribute.id === this.attributeId);
  }

  currentPoint() {
    const id = document.getElementById('history-point').value;
    return this.currentAttribute()?.points.find(point => point.id === id);
  }

  renderAttributes() {
    const query = document.getElementById('history-search').value.trim().toLowerCase();
    const matches = this.attributes.filter(attribute => [attribute.name, attribute.id, ...attribute.points.map(point => point.code)]
      .some(value => value && value.toLowerCase().includes(query)));
    document.getElementById('history-attribute-count').textContent = this.attributes.length + ' 项';
    const escape = value => window.portal.escapeHtml(value);
    document.getElementById('history-attributes').innerHTML = matches.map(attribute => `
      <button type="button" data-attribute="${escape(attribute.id)}" class="${attribute.id === this.attributeId ? 'active' : ''}" aria-pressed="${attribute.id === this.attributeId}">
        <span>${escape(attribute.name)}</span><small>${escape(attribute.unit || '—')}</small>
      </button>`).join('') || '<div class="history-empty">没有匹配的监测属性</div>';
  }

  selectAttribute(id) {
    this.attributeId = id;
    this.renderAttributes();
    this.renderPointSelector();
    this.query();
  }

  renderPointSelector() {
    const select = document.getElementById('history-point');
    select.replaceChildren();
    (this.currentAttribute()?.points || []).forEach(point => select.add(new Option(
      point.code ? `${point.id} · ${point.code}` : '监测项汇总', point.id
    )));
  }

  query() {
    const error = document.getElementById('history-error');
    const start = new Date(document.getElementById('history-start').value).getTime();
    const end = new Date(document.getElementById('history-end').value).getTime();
    const point = this.currentPoint();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      error.textContent = '请选择有效的时间范围，结束时间须晚于开始时间。';
      error.hidden = false;
      return;
    }
    error.hidden = true;
    if (!point || !Number.isFinite(Number(point.val))) {
      this.rows = [];
      this.renderResults();
      return;
    }
    const base = Number(point.val);
    const amplitude = Math.max(Math.abs(base) * .08, point.unit === '°' || point.unit === 'm/s²' ? .001 : .1);
    const count = 97;
    const seed = [...(this.projectId + point.id)].reduce((total, char) => total + char.charCodeAt(0), 0);
    this.rows = Array.from({length: count}, (_, index) => {
      const time = start + (end - start) * index / (count - 1);
      const phase = time / 3600000 + seed;
      const value = base + amplitude * (Math.sin(phase * .45) * .65 + Math.sin(phase * 1.7) * .2);
      return {time, value, unit: point.unit || '', status: point.status || 'normal'};
    });
    this.renderResults();
  }

  formatValue(value) {
    return value.toFixed(Math.abs(value) < 1 ? 4 : 2);
  }

  formatTime(time) {
    const date = new Date(time);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  renderResults() {
    const attribute = this.currentAttribute();
    const point = this.currentPoint();
    document.getElementById('history-title').textContent = attribute?.name || '暂无监测属性';
    document.getElementById('history-subtitle').textContent = point?.code ? `${point.id} · ${point.type} · ${point.code}` : '监测项汇总';
    document.getElementById('history-device').hidden = !point?.code;
    const unit = point?.unit || '';
    document.getElementById('history-chart-unit').textContent = unit ? `单位：${unit}` : '';
    const values = this.rows.map(row => row.value);
    const escape = value => window.portal.escapeHtml(value);
    document.getElementById('history-summary').innerHTML = values.length ? [
      ['最新值', values[values.length - 1]], ['最大值', Math.max(...values)],
      ['最小值', Math.min(...values)], ['平均值', values.reduce((sum, value) => sum + value, 0) / values.length]
    ].map(([label, value]) => `<div><span>${label}</span><strong>${this.formatValue(value)} <small>${escape(unit)}</small></strong></div>`).join('') : '';
    document.getElementById('history-table-body').innerHTML = [...this.rows].reverse().map(row =>
      `<tr><td>${this.formatTime(row.time)}</td><td>${this.formatValue(row.value)}</td><td>${escape(row.unit)}</td><td>${row.status === 'normal' ? '正常' : escape(row.status)}</td></tr>`
    ).join('') || '<tr><td colspan="4">暂无数据</td></tr>';
    document.getElementById('history-result-count').textContent = `${this.rows.length} 条数据 · 演示数据`;
    document.getElementById('history-export').disabled = !this.rows.length;
    document.getElementById('history-axis').innerHTML = this.rows.length ? [0, 24, 48, 72, 96]
      .map(index => `<span>${this.formatTime(this.rows[index].time)}</span>`).join('') : '';
    requestAnimationFrame(() => this.renderChart());
  }

  renderChart() {
    const pane = document.getElementById('tab-data-history');
    const canvas = document.getElementById('history-chart');
    if (!pane.classList.contains('active') || document.getElementById('history-chart-view').hidden || !canvas.clientWidth || !this.rows.length) return;
    const values = this.rows.map(row => row.value);
    const min = Math.min(...values), max = Math.max(...values);
    const padding = Math.max((max - min) * .2, Math.abs(max) * .002, .001);
    if (!this.chart) this.chart = new RealtimeWaveChart('history-chart', {title: '', glow: false});
    Object.assign(this.chart.options, {
      unit: this.currentPoint()?.unit || '', minY: min - padding, maxY: max + padding, latestLabel: '最新',
      maxPoints: values.length, warnThreshold: null, alarmThreshold: null,
      lineColor: '#2378bc', fillColor: 'rgba(35, 120, 188, 0.12)',
      gridColor: '#e4ebf0', textColor: '#718598'
    });
    this.chart.data = values;
    this.chart.render();
  }

  exportCsv() {
    if (!this.rows.length) return;
    const point = this.currentPoint();
    const csvCell = value => '"' + String(value).replace(/"/g, '""') + '"';
    const lines = [['采样时间', '监测值', '单位', '状态'], ...this.rows.map(row =>
      [this.formatTime(row.time), this.formatValue(row.value), row.unit, row.status === 'normal' ? '正常' : row.status])];
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(csvCell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${point.name}-演示数据.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

window.DataHistoryController = DataHistoryController;
