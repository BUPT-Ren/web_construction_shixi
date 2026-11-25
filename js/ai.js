/**
 * 桥梁知识智能问答助手 (ai.js)
 * 流式对话演示：本地知识库检索 + 打字机流式输出。
 * 后续接入真实大模型时，只需替换 AiChatController.reply 中的取数与输出逻辑。
 */

class AiChatController {
  constructor() {
    this.streaming = false;
    this.thinkTimer = null;
    this.streamTimer = null;

    this.welcomeText =
      '你好，我是桥梁健康监测智能助手 👋\n\n' +
      '我可以基于本系统的知识库，为你解答桥梁结构健康监测相关的问题，例如：\n' +
      '• 系统架构与核心功能\n' +
      '• 监测内容与传感器设备\n' +
      '• 预警分级与工单闭环处置\n' +
      '• 结构健康评估方法与技术标准\n\n' +
      '直接在下方输入问题，我会以流式方式为你作答。';

    this.greetingText =
      '你好！很高兴为你服务。你可以问我关于桥梁健康监测系统的问题，比如：\n' +
      '• 系统有哪些核心功能？\n' +
      '• 桥梁都监测哪些内容？\n' +
      '• 斜拉索索力是怎么监测的？\n' +
      '• 出现异常时系统怎么预警和处置？';

    this.thanksText = '不客气！如果还有其他关于桥梁健康监测的问题，随时问我。';

    this.fallbackText =
      '这个问题我暂时没有在本地知识库中找到直接答案。不过我可以围绕以下主题为你解答：\n' +
      '• 系统架构与核心功能\n' +
      '• 监测内容、传感器设备与采集链路\n' +
      '• 斜拉索索力与结构变形监测\n' +
      '• 预警分级、工单闭环处置\n' +
      '• 结构健康评估方法与技术标准\n\n' +
      '你可以换个问法，或点击下方的建议问题。';

    this.suggestions = [
      '这个系统有哪些核心功能？',
      '桥梁都监测哪些内容？',
      '斜拉索索力是怎么监测的？',
      '出现异常时系统怎么预警和处置？',
      '系统采用了哪些技术标准？'
    ];

    this.knowledgeBase = [
      {
        keywords: ['功能', '能做什么', '核心', '这个系统', '这个平台', '介绍一下', '是什么'],
        answer:
          '本系统是面向桥梁、超高层等重大工程的“结构智能监测与全寿命健康运维系统”，核心能力包括：\n' +
          '• **自动化感知**：24 小时连续采集结构变形、受力、振动与环境作用信号；\n' +
          '• **数字孪生大屏**：BIM+GIS 一张图直观统管桥梁、测点与实时状态；\n' +
          '• **智能预警闭环**：特征值超阈 → 规则判级 → 自动派单 → 专家审批 → 跟踪归档；\n' +
          '• **健康评估**：基于长期数据生成结构健康度评估报告，支撑预防性养护。'
      },
      {
        keywords: ['架构', '端边云', '四层', '层级', '云边端'],
        answer:
          '系统采用“端—边—云”四层协同架构：\n' +
          '• **感知层**：静力水准仪、光纤光栅、MEMS 加速度计、北斗 GNSS 等工业级传感器；\n' +
          '• **边缘层**：现场智能网关完成信号滤波、清洗与时序存储，断网可离线缓存 ≥180 天；\n' +
          '• **传输层**：光纤专网 / 5G / 4G 多链路互备，HTTPS 加密与动态密钥认证；\n' +
          '• **平台层**：云端存储、力学分析、安全预警与 BIM+GIS 可视化，统一提供 Web/APP 服务。'
      },
      {
        keywords: ['监测内容', '监测哪些', '测什么', '监测项', '监测项目'],
        answer:
          '依据 JT/T 1037-2022，监测内容覆盖“环境—作用—响应”三大类：\n' +
          '• **环境与作用**：温湿度、风速风向、地震动、车辆荷载；\n' +
          '• **结构变形**：挠度/沉降、桥塔/梁体位移、支座位移、倾斜；\n' +
          '• **受力与振动**：应变、索力、主梁与拉索振动；\n' +
          '• **表观与视频**：裂缝、锈蚀、异常事件与车牌识别。'
      },
      {
        keywords: ['传感器', '设备', '仪器', '测点', '静力水准', '光纤', '加速度计', 'gnss', '北斗', '风速仪', '倾角仪', '磁通量'],
        answer:
          '系统采用全要素工业级传感器矩阵，典型设备包括：\n' +
          '• **静力水准仪 / 拉线位移计**：测量挠度与沉降；\n' +
          '• **光纤光栅应变计 / 加速度计**：测量应变与振动；\n' +
          '• **磁通量传感器**：测量斜拉索索力；\n' +
          '• **北斗 GNSS / 倾角仪**：测量绝对位移与倾斜；\n' +
          '• **超声波风速仪 / 气象站**：测量风速风向与温湿度。\n' +
          '全部设备支持 RS485 标准接口，开放兼容、便于异构集成。'
      },
      {
        keywords: ['索力', '斜拉索', '拉索', '调索'],
        answer:
          '斜拉索索力监测采用磁通量传感器或振动法，结合非线性效应快速调索，识别精度优于 5%。大屏可实时展示全桥各对拉索的“设计值 vs 实测值”柱状对比，并自动标出误差，帮助判断索力是否处于均匀受控状态，及时发现断丝、松弛等隐患。'
      },
      {
        keywords: ['预警', '报警', '警报', '告警', '工单', '阈值', '判级', '派单', '处置', '闭环', '超限'],
        answer:
          '异常处置遵循“监测—评估—预警—养护”闭环：\n' +
          '• 特征值超过预设阈值后，系统按规则自动判级（三级/二级/一级）；\n' +
          '• 自动生成预警工单并派发给责任人；\n' +
          '• 专家在线审批、现场复核处置；\n' +
          '• 全过程跟踪归档，形成可追溯记录。\n' +
          '点击顶部“模拟突发预警”按钮即可体验完整的联动流程。'
      },
      {
        keywords: ['评估', '健康度', '健康指数', '报告', '月报', '等级', '评级'],
        answer:
          '系统基于长期监测大数据与结构基准模态反演，对变形稳定性、斜拉索索力均匀度及动力特性进行综合评估，输出 A/B/C 等级的健康结论与数字化档案。评估页支持一键生成《公路桥梁结构健康定期评估报告》，并可通过五维雷达图直观呈现结构健康度。'
      },
      {
        keywords: ['算法', 'pod', 'ekf', '卡尔曼', 'spsd', '深度学习', '识别模型', '机理', '数据驱动', '迁移学习'],
        answer:
          '系统采用“力学机理 + 数据驱动”的科研路线：\n' +
          '• **递归 POD + 强跟踪 EKF**：实现结构刚度连续损伤的在线时程识别；\n' +
          '• **SPSD 方法体系**：已拓展至铰缝损伤、温度影响、附加质量法等多类场景；\n' +
          '• **深度学习**：结合迁移学习与 YOLO 系列模型进行裂缝、锈蚀等表观病害识别。'
      },
      {
        keywords: ['标准', '规范', 'jt', '1037', '等保', '安全', '合规', '加密'],
        answer:
          '系统严格遵循交通运输部《公路桥梁结构监测技术规范》JT/T 1037-2022，数据字典与接口协议标准化，可无缝融入路段级、集团级乃至省级桥群监测平台；同时通过国家网络安全等级保护二级认证，采用 IPSec/SSL VPN、HTTPS 加密与基于角色的分级权限管理。'
      },
      {
        keywords: ['视频', '视觉', '裂缝', '锈蚀', '图像', '车牌', 'yolo'],
        answer:
          '系统内嵌国产端侧 AI 算力芯片，采用改进 YOLO 系列模型实现实时视觉识别：\n' +
          '• **裂缝与锈蚀**：微米级裂缝宽度提取与钢结构锈蚀量化；\n' +
          '• **异常事件**：车辆超限、违章停靠、异常拥堵实时抓拍；\n' +
          '• **报警联动**：识别结果与现场爆闪灯、情报板联动警示。'
      },
      {
        keywords: ['边缘', '断网', '离线', '存储', '续传', '180'],
        answer:
          '边缘计算节点支持断网离线存储不少于 180 天，现场数据先在本地完成滤波、清洗与时序存储，网络恢复后自动断点续传，保障全链路零丢数，确保恶劣天气或通信中断时监测数据不丢失。'
      },
      {
        keywords: ['案例', '工程实例', '巨力', '乐凯', '转体'],
        answer:
          '系统已应用于巨力大桥和乐凯大街转体斜拉桥两项典型工程，覆盖独塔斜拉桥与大吨位双塔转体斜拉桥，并经过工程实测检验。'
      },
      {
        keywords: ['孪生', 'bim', 'gis', '数字'],
        answer:
          '数字孪生大屏融合 BIM 与 GIS，将桥梁三维模型、测点空间位置与实时监测数据叠加到一张图上，支持三维立面、GIS 一张图、有限元修正模型、AI 视觉病害监控等多个视口切换，实现对结构状态与空间退化的直观推演。'
      },
      {
        keywords: ['精度', '误差', '准确率'],
        answer:
          '系统关键监测指标包括：斜拉索索力识别精度优于 5%（相对误差），测点在线传输率 100%，并通过多类型工业级传感器同步高精度采集，结合边缘预处理与力学反演算法，保障特征值提取的准确性与稳定性。'
      },
      {
        keywords: ['车辆', '荷载', '称重', '轴重', '重车', '超重'],
        answer:
          '车辆荷载采用动态称重系统实时感知，可抓拍车牌、识别车型与轴数并记录实测总重。当车辆超限时系统自动标记并联动预警，为评估桥梁在真实交通流下的受力状态提供依据。'
      },
      {
        keywords: ['挠度', '沉降', '位移', '倾斜', '变形', '下挠'],
        answer:
          '结构变形监测主要包括：主梁跨中下挠、墩塔沉降、梁体与桥塔位移、支座位移及倾斜等，采用静力水准仪、北斗 GNSS、拉线位移计和倾角仪连续在线测量，秒级捕捉结构微小变形，及时预警异常趋势。'
      }
    ];
  }

  init() {
    this.listEl = document.getElementById('ai-message-list');
    this.inputEl = document.getElementById('ai-input');
    this.sendBtn = document.getElementById('ai-send-btn');
    this.clearBtn = document.getElementById('ai-clear-btn');
    this.chipsEl = document.getElementById('ai-suggestion-chips');

    this.renderSuggestions();
    this.resetChat();

    if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.handleSend());
    if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.resetChat());

    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
      this.inputEl.addEventListener('input', () => this.autoResize());
    }
  }

  renderSuggestions() {
    if (!this.chipsEl) return;
    this.chipsEl.innerHTML = this.suggestions.map((s) =>
      `<button class="ai-suggestion-chip" data-q="${this.escapeAttr(s)}">${this.escapeHtml(s)}</button>`
    ).join('');
    this.chipsEl.querySelectorAll('.ai-suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (this.streaming) return;
        this.inputEl.value = chip.getAttribute('data-q');
        this.handleSend();
      });
    });
  }

  resetChat() {
    this.stopStream();
    this.streaming = false;
    if (this.sendBtn) this.sendBtn.disabled = false;
    if (this.inputEl) this.inputEl.disabled = false;
    if (this.listEl) {
      this.listEl.innerHTML = '';
      this.appendMessage('assistant', this.welcomeText);
    }
    if (this.inputEl) {
      this.inputEl.value = '';
      this.autoResize();
      this.inputEl.focus();
    }
  }

  handleSend() {
    if (this.streaming) return;
    const text = (this.inputEl.value || '').trim();
    if (!text) return;
    this.inputEl.value = '';
    this.autoResize();
    this.appendMessage('user', text);
    this.reply(text);
  }

  reply(question) {
    const answer = this.retrieve(question);
    this.streaming = true;
    if (this.sendBtn) this.sendBtn.disabled = true;
    if (this.inputEl) this.inputEl.disabled = true;

    const msg = this.appendMessage('assistant', '');
    const bubble = msg.querySelector('.ai-bubble-text');
    bubble.innerHTML = '<span class="ai-thinking"><span></span><span></span><span></span></span>';
    this.scrollToBottom();

    // 模拟“思考 + 流式输出”的过程
    this.thinkTimer = setTimeout(() => {
      bubble.innerHTML = '';
      let revealed = 0;
      this.streamTimer = setInterval(() => {
        revealed += 2 + Math.floor(Math.random() * 4);
        if (revealed >= answer.length) {
          bubble.innerHTML = this.renderRich(answer);
          this.finishStream();
          return;
        }
        bubble.innerHTML = this.renderRich(answer.slice(0, revealed)) + '<span class="ai-cursor"></span>';
        this.scrollToBottom();
      }, 24);
    }, 600);
  }

  finishStream() {
    this.stopStream();
    this.streaming = false;
    if (this.sendBtn) this.sendBtn.disabled = false;
    if (this.inputEl) {
      this.inputEl.disabled = false;
      this.inputEl.focus();
    }
    this.scrollToBottom();
  }

  stopStream() {
    if (this.thinkTimer) {
      clearTimeout(this.thinkTimer);
      this.thinkTimer = null;
    }
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
  }

  retrieve(question) {
    const q = question.toLowerCase();

    if (/^(你好|您好|hi|hello|嗨|哈喽|在吗)/.test(q)) return this.greetingText;
    if (/^(谢谢|感谢|thanks|thank)/.test(q)) return this.thanksText;

    let best = null;
    let bestScore = 0;
    for (const item of this.knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        if (q.includes(kw.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    return best ? best.answer : this.fallbackText;
  }

  appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-msg ai-msg-${role}`;

    if (role === 'assistant') {
      wrapper.innerHTML = `
        <div class="ai-msg-avatar ai-avatar-bot">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>
          </svg>
        </div>
        <div class="ai-msg-content">
          <div class="ai-msg-name">AI 助手</div>
          <div class="ai-bubble-text">${text ? this.renderRich(text) : ''}</div>
        </div>`;
    } else {
      wrapper.innerHTML = `
        <div class="ai-msg-avatar ai-avatar-user">我</div>
        <div class="ai-msg-content">
          <div class="ai-bubble-text">${this.escapeHtml(text)}</div>
        </div>`;
    }

    this.listEl.appendChild(wrapper);
    this.scrollToBottom();
    return wrapper;
  }

  scrollToBottom() {
    if (this.listEl) this.listEl.scrollTop = this.listEl.scrollHeight;
  }

  autoResize() {
    if (!this.inputEl) return;
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 140) + 'px';
  }

  renderRich(text) {
    const esc = this.escapeHtml(text);
    const bold = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = bold.split('\n');
    const parts = [];
    lines.forEach((line) => {
      const t = line.trim();
      if (!t) return;
      if (/^[-•]\s+/.test(t)) {
        parts.push(`<div class="ai-list-item">${t.replace(/^[-•]\s+/, '')}</div>`);
      } else {
        parts.push(`<div>${t}</div>`);
      }
    });
    return parts.join('');
  }

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  escapeAttr(s) {
    return this.escapeHtml(s);
  }
}

window.AiChatController = AiChatController;
