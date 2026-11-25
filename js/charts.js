/**
 * 结构智能监测系统 - 轻量级高保真原生 Canvas 图表库
 * 专为工业健康监测大屏打造：零依赖、高帧率(60FPS)、支持发光微光动效、自适应高清Retina
 */

class MiniChartUtils {
  static setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width || 300;
    const height = rect.height || canvas.height || 180;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height, dpr };
  }
}

/**
 * 实时动态波形折线图 (用于挠度、应变、振动加速度等时程监测)
 */
class RealtimeWaveChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.options = Object.assign({
      title: '',
      unit: '',
      maxPoints: 50,
      minY: -10,
      maxY: 10,
      warnThreshold: 7, // 警告阈值
      alarmThreshold: 9, // 报警阈值
      lineColor: '#1f6feb',
      fillColor: 'rgba(31, 111, 235, 0.12)',
      glow: true,
      showGrid: true,
      gridColor: 'rgba(31, 111, 235, 0.08)',
      textColor: '#6b7684',
      initialValue: 0,
      latestLabel: '实时'
    }, options);
    
    this.data = [];
    // 填充初始平缓数据
    for (let i = 0; i < this.options.maxPoints; i++) {
      this.data.push(this.options.initialValue);
    }
    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.render();
  }

  addData(val) {
    this.data.push(val);
    if (this.data.length > this.options.maxPoints) {
      this.data.shift();
    }
    this.render();
  }

  render() {
    if (!this.canvas) return;
    const { ctx, width, height } = MiniChartUtils.setupCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 46;
    const padRight = 16;
    const padTop = 24;
    const padBottom = 26;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // 绘制标题和单位
    ctx.fillStyle = this.options.textColor;
    ctx.font = '11px sans-serif';
    if (this.options.title) ctx.fillText(`${this.options.title} (${this.options.unit})`, padLeft, 14);

    // 计算 Y 轴范围
    let minY = this.options.minY;
    let maxY = this.options.maxY;
    const currentMax = Math.max(...this.data);
    const currentMin = Math.min(...this.data);
    if (currentMax > maxY) maxY = currentMax * 1.15;
    if (currentMin < minY) minY = currentMin * 1.15;
    const rangeY = (maxY - minY) || 1;

    // 绘制背景网格
    if (this.options.showGrid) {
      ctx.strokeStyle = this.options.gridColor;
      ctx.lineWidth = 1;
      const gridRows = 4;
      for (let i = 0; i <= gridRows; i++) {
        const y = padTop + (plotH / gridRows) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();

        // 刻度数值
        const val = (maxY - (rangeY / gridRows) * i).toFixed(Math.max(Math.abs(minY), Math.abs(maxY)) < 1 ? 3 : 1);
        ctx.fillStyle = this.options.textColor;
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val, padLeft - 6, y + 3);
      }
    }

    // 绘制警戒阈值线 (虚线)
    if (this.options.warnThreshold) {
      const warnY = padTop + plotH * (1 - (this.options.warnThreshold - minY) / rangeY);
      if (warnY >= padTop && warnY <= padTop + plotH) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(217, 131, 36, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, warnY);
        ctx.lineTo(width - padRight, warnY);
        ctx.stroke();
        ctx.fillStyle = '#d98324';
        ctx.textAlign = 'right';
        ctx.fillText('二级预警', width - padRight, warnY - 3);
        ctx.restore();
      }
    }

    if (this.options.alarmThreshold) {
      const alarmY = padTop + plotH * (1 - (this.options.alarmThreshold - minY) / rangeY);
      if (alarmY >= padTop && alarmY <= padTop + plotH) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(229, 72, 77, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, alarmY);
        ctx.lineTo(width - padRight, alarmY);
        ctx.stroke();
        ctx.fillStyle = '#e5484d';
        ctx.textAlign = 'right';
        ctx.fillText('一级报警', width - padRight, alarmY - 3);
        ctx.restore();
      }
    }

    // 绘制数据折线与面积
    if (this.data.length < 2) return;
    const stepX = plotW / (this.options.maxPoints - 1);
    const points = this.data.map((val, idx) => {
      const x = padLeft + idx * stepX;
      const normalizedY = (val - minY) / rangeY;
      const y = padTop + plotH * (1 - normalizedY);
      return { x, y, val };
    });

    // 渐变填充背景
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + plotH);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, padTop + plotH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, this.options.fillColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 绘制发光主曲线
    ctx.save();
    if (this.options.glow) {
      ctx.shadowColor = this.options.lineColor;
      ctx.shadowBlur = 8;
    }
    ctx.strokeStyle = this.options.lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      // 简单平滑连接
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
    ctx.restore();

    // 当前最新值脉冲点
    const lastPt = points[points.length - 1];
    ctx.save();
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.options.lineColor;
    ctx.shadowColor = this.options.lineColor;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();

    // 显示最新瞬时值
    const latestVal = this.data[this.data.length - 1].toFixed(Math.abs(this.data[this.data.length - 1]) < 1 ? 4 : 2);
    ctx.fillStyle = this.options.lineColor;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.options.latestLabel}: ${latestVal} ${this.options.unit}`, width - padRight, 14);
  }
}

/**
 * 索力设计值 vs 监测实测值对比柱状图 (高度还原图16，斜拉索索力误差 < 5%)
 */
class CableForceComparisonChart {
  constructor(canvasId, items = []) {
    this.canvas = document.getElementById(canvasId);
    this.items = items; // [{ id: 'LS-01', design: 310, actual: 308 }, ...]
    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.render();
  }

  updateData(newItems) {
    this.items = newItems;
    this.render();
  }

  render() {
    if (!this.canvas) return;
    const { ctx, width, height } = MiniChartUtils.setupCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    if (!this.items.length) {
      ctx.fillStyle = '#9bb9d9';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('当前工程暂无斜拉索索力监测数据', width / 2, height / 2);
      return;
    }

    const padLeft = 48;
    const padRight = 20;
    const padTop = 32;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // 图例
    ctx.fillStyle = '#54c7ff';
    ctx.fillRect(width - 160, 10, 12, 8);
    ctx.fillStyle = '#b8d4ed';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('设计索力 (kN)', width - 142, 17);

    ctx.fillStyle = '#f4bb4b';
    ctx.fillRect(width - 70, 10, 12, 8);
    ctx.fillStyle = '#b8d4ed';
    ctx.fillText('实测索力 (kN)', width - 52, 17);

    // Y轴范围
    let maxVal = 0;
    this.items.forEach(d => {
      maxVal = Math.max(maxVal, d.design, d.actual);
    });
    maxVal = Math.ceil(maxVal * 1.15 / 100) * 100 || 1000;

    // 绘制横向网格
    const rows = 4;
    ctx.strokeStyle = 'rgba(102, 198, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= rows; i++) {
      const y = padTop + (plotH / rows) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / rows) * i);
      ctx.fillStyle = '#9bb9d9';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val, padLeft - 6, y + 3);
    }

    // 绘制双柱
    const count = this.items.length;
    const groupW = plotW / count;
    const barW = Math.max(3, Math.min(10, groupW * 0.35));

    this.items.forEach((item, idx) => {
      const groupCenterX = padLeft + idx * groupW + groupW / 2;
      const x1 = groupCenterX - barW - 1;
      const x2 = groupCenterX + 1;

      const hDesign = (item.design / maxVal) * plotH;
      const yDesign = padTop + plotH - hDesign;
      const hActual = (item.actual / maxVal) * plotH;
      const yActual = padTop + plotH - hActual;

      // 设计柱
      ctx.fillStyle = '#2b8eff';
      ctx.fillRect(x1, yDesign, barW, hDesign);

      // 实测柱 (带微渐变)
      const barGrad = ctx.createLinearGradient(0, yActual, 0, padTop + plotH);
      barGrad.addColorStop(0, '#64df91');
      barGrad.addColorStop(1, '#1ea76b');
      ctx.fillStyle = barGrad;
      ctx.fillRect(x2, yActual, barW, hActual);

      // X 轴标签（间隔抽稀显示防止拥挤）
      if (count <= 16 || idx % Math.ceil(count / 16) === 0) {
        ctx.save();
        ctx.fillStyle = '#9bb9d9';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.id, groupCenterX, height - 12);
        ctx.restore();
      }
    });

    // 底部基线
    ctx.strokeStyle = 'rgba(102, 198, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + plotH);
    ctx.lineTo(width - padRight, padTop + plotH);
    ctx.stroke();
  }
}

/**
 * 结构五维健康度评估雷达图
 */
class HealthRadarChart {
  constructor(canvasId, dimensions = [], scores = []) {
    this.canvas = document.getElementById(canvasId);
    this.dimensions = dimensions.length ? dimensions : ['变形稳定性', '结构受力度', '动力响应', '环境耐受性', '表观病害率'];
    this.scores = scores.length ? scores : [94, 91, 88, 96, 92]; // 百分制
    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.render();
  }

  render() {
    if (!this.canvas) return;
    const { ctx, width, height } = MiniChartUtils.setupCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 30;
    const count = this.dimensions.length;
    const angleStep = (Math.PI * 2) / count;

    // 绘制多边形同心网格
    const rings = 4;
    for (let r = 1; r <= rings; r++) {
      const curR = (radius / rings) * r;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const a = i * angleStep - Math.PI / 2;
        const x = centerX + curR * Math.cos(a);
        const y = centerY + curR * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = r === rings ? 'rgba(31, 111, 235, 0.35)' : 'rgba(31, 111, 235, 0.12)';
      ctx.stroke();
    }

    // 绘制辐射轴线和文字
    for (let i = 0; i < count; i++) {
      const a = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(a);
      const y = centerY + radius * Math.sin(a);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(31, 111, 235, 0.15)';
      ctx.stroke();

      // 文字位置微调
      const textR = radius + 18;
      const tx = centerX + textR * Math.cos(a);
      const ty = centerY + textR * Math.sin(a);
      ctx.fillStyle = '#5b6572';
      ctx.font = '11px sans-serif';
      ctx.textAlign = Math.abs(Math.cos(a)) < 0.1 ? 'center' : (Math.cos(a) > 0 ? 'left' : 'right');
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.dimensions[i]} ${this.scores[i]}%`, tx, ty);
    }

    // 绘制数据区域
    const pts = [];
    for (let i = 0; i < count; i++) {
      const a = i * angleStep - Math.PI / 2;
      const r = (this.scores[i] / 100) * radius;
      pts.push({
        x: centerX + r * Math.cos(a),
        y: centerY + r * Math.sin(a)
      });
    }

    ctx.beginPath();
    pts.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();

    ctx.fillStyle = 'rgba(31, 111, 235, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#1f6feb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制顶点光晕
    pts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1f6feb';
      ctx.fill();
    });
  }
}

/**
 * 仪表盘 (用于健康综合指数与在线率)
 */
class GaugeChart {
  constructor(canvasId, score = 94.6, label = '综合健康指数') {
    this.canvas = document.getElementById(canvasId);
    this.score = score;
    this.label = label;
    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.render();
  }

  render() {
    if (!this.canvas) return;
    const { ctx, width, height } = MiniChartUtils.setupCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height * 0.72;
    const radius = Math.min(width * 0.38, height * 0.55);

    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const totalAngle = endAngle - startAngle;

    // 灰色底弧
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#e7ebf0';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 高亮进度弧
    const curAngle = startAngle + totalAngle * (this.score / 100);
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#1f6feb');
    grad.addColorStop(0.7, '#3b82f6');
    grad.addColorStop(1, '#7ab8ff');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, curAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 中心数值与评级
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1f2733';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(this.score.toFixed(1), centerX, centerY - 6);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#1f6feb';
    ctx.fillText('等级: A (良好安全)', centerX, centerY + 14);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#929aa6';
    ctx.fillText(this.label, centerX, centerY + 28);
  }
}

// 挂载到全局
window.RealtimeWaveChart = RealtimeWaveChart;
window.CableForceComparisonChart = CableForceComparisonChart;
window.HealthRadarChart = HealthRadarChart;
window.GaugeChart = GaugeChart;
