/**
 * 预警巡检与工单闭环管理 + 健康度评估报告控制器 (workorder.js)
 */

class WorkorderController {
  constructor() {
    this.radarChart = null;
    this.gaugeChart = null;
  }

  init() {
    this.renderDeviceGrid();
    this.renderWorkOrders();
    this.initHealthAssessment();
  }

  // 渲染设备网格 (高度还原图6)
  renderDeviceGrid() {
    const gridEl = document.getElementById('device-grid-matrix');
    if (!gridEl) return;
    const devices = window.SystemMockData.deviceGrid;

    gridEl.innerHTML = devices.map(d => `
      <div class="device-grid-tag" title="工程: ${d.bridge} | 类型: ${d.type} | 电压: ${d.voltage} | 信号: ${d.rssi}" onclick="window.workorder.showDeviceDetail('${d.code}')">
        <span class="device-tag-code">${d.code}</span>
        <span class="device-tag-status-dot" title="正常在线"></span>
      </div>
    `).join('');
  }

  // 渲染预警闭环工单列表
  renderWorkOrders() {
    const tableBody = document.getElementById('work-order-tbody');
    if (!tableBody) return;
    const orders = window.SystemMockData.workOrders;

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
    const d = window.SystemMockData.deviceGrid.find(x => x.code === code) || {
      code, type: '智能传感器终端', bridge: '保定巨力大桥', voltage: '24.1V', rssi: '-62dBm', lastUpload: '刚刚'
    };

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
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">通信协议规范</td><td style="padding:8px 0; font-family:monospace;">JT/T 1037-2022 / MQTT 工业物联网</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">供电与工作电压</td><td style="padding:8px 0; font-family:monospace;">DC 24V (当前实测: ${d.voltage})</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">网络信噪比 (RSSI)</td><td style="padding:8px 0; font-family:monospace;">${d.rssi} (链路质量极佳)</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">边缘缓存能力</td><td style="padding:8px 0;">支持本地断网存储不少于 <strong>180 天</strong>，断点续传不丢数</td></tr>
          <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 0; color:var(--text-muted);">最新上传数据时间</td><td style="padding:8px 0; font-family:monospace;">${d.lastUpload}</td></tr>
        </table>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
          <button class="btn-outline" onclick="window.app.closeModal()">关闭</button>
          <button class="btn-primary" onclick="alert('已下发远程自检指令，设备运行正常！')">远程诊断自检</button>
        </div>
      </div>
    `);
  }

  viewOrderDetail(orderId) {
    const o = window.SystemMockData.workOrders.find(x => x.id === orderId);
    if (!o) return;

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
          <button class="btn-outline" onclick="window.app.closeModal()">返回列表</button>
          <button class="btn-primary" onclick="alert('审批成功！已同步至省级桥群管理系统并完成归档留痕。'); window.app.closeModal();">审批通过并归档</button>
        </div>
      </div>
    `);
  }

  // 生成健康度评估报告模态预览
  generateReport() {
    window.app.showModal('公路桥梁结构健康定期评估报告预览 (JT/T 1037-2022)', `
      <div style="display:flex; flex-direction:column; gap:18px; color:var(--text-main); line-height:1.6;">
        <div style="text-align:center; border-bottom:1px solid var(--border-color); padding-bottom:14px;">
          <h2 style="color:var(--text-main); font-size:20px; margin-bottom:6px;">保定巨力大桥结构健康综合评估月报</h2>
          <div style="font-size:12px; color:var(--text-muted);">
            报告编号: SHM-REP-202611-01 | 评估标准: 交通运输部 JT/T 1037-2022 | 评估周期: 最近30天
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; background:#f6f8fa; padding:14px; border-radius:8px;">
          <div><strong>结构安全总评得分:</strong> <span style="font-size:20px; font-weight:bold; color:var(--color-primary); font-family:monospace;">94.6 分</span></div>
          <div><strong>综合健康等级:</strong> <span class="badge badge-success">A 级 (优良受控)</span></div>
          <div><strong>主梁最大动挠度:</strong> -13.8 mm (设计容许值 -38.0 mm)</div>
          <div><strong>斜拉索索力最大偏差:</strong> < 4.2% (符合 < 5% 规范)</div>
        </div>

        <div>
          <h4 style="color:var(--color-primary); margin-bottom:6px;">综合研判与养护建议：</h4>
          <p style="font-size:12px; color:var(--text-secondary);">
            1. <strong>变形性能：</strong>主梁竖向挠度在常遇交通载荷与微风激励下波动规律平稳，未见异常永久残余变形；<br/>
            2. <strong>受力与索力：</strong>全桥 35 对斜拉索实测索力与设计索力偏差均小于 5%，索塔受力对称协调；<br/>
            3. <strong>建议措施：</strong>持续跟踪跨中 S-01 测点在极端大风条件下的动力响应，下季度开展常规防腐巡检即可。
          </p>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border-color); padding-top:14px;">
          <button class="btn-outline" onclick="window.app.closeModal()">关闭</button>
          <button class="btn-primary" onclick="window.print()">🖨️ 打印 / 导出 PDF 归档</button>
        </div>
      </div>
    `);
  }
}

window.WorkorderController = WorkorderController;
