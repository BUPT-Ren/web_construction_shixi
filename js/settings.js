class SettingsController {
  constructor() {
    this.api = 'http://127.0.0.1:8000';
    this.users = [];
  }

  init() {
    document.getElementById('settings-add-user').addEventListener('click', () => this.userForm());
    document.getElementById('settings-ai-form').addEventListener('submit', event => {
      event.preventDefault();
      this.saveAI();
    });
    document.getElementById('settings-delete-key').addEventListener('click', () => this.confirmDeleteKey());
    document.getElementById('settings-users').addEventListener('click', event => {
      const button = event.target.closest('[data-user-action]');
      if (!button) return;
      const user = this.users.find(item => item.id === Number(button.dataset.id));
      if (!user) return;
      if (button.dataset.userAction === 'edit') this.userForm(user);
      if (button.dataset.userAction === 'delete') this.confirmDeleteUser(user);
    });
  }

  async request(path, options = {}) {
    const token = window.demoAuth?.current?.token;
    if (!token) throw new Error('请连接后端并重新登录管理员账号。');
    const response = await fetch(this.api + path, {
      ...options,
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(options.headers || {})}
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : '配置保存失败，请检查输入。');
    return data;
  }

  async render() {
    const version = document.getElementById('settings-version');
    const status = document.getElementById('settings-api-status');
    try {
      const response = await fetch(this.api + '/openapi.json');
      if (!response.ok) throw new Error();
      const info = await response.json();
      version.textContent = info.info.version;
      status.textContent = '已连接';
    } catch {
      version.textContent = '不可用';
      status.textContent = '未连接';
    }
    const identity = window.demoAuth?.current;
    const notice = document.getElementById('settings-notice');
    const content = document.getElementById('settings-content');
    if (!identity || identity.role !== 'admin') {
      notice.hidden = false;
      notice.textContent = '人员和 AI 配置仅管理员可管理。';
      content.hidden = true;
      return;
    }
    try {
      const [users, ai] = await Promise.all([this.request('/settings/users'), this.request('/settings/ai')]);
      this.users = users;
      notice.hidden = true;
      content.hidden = false;
      this.renderUsers();
      document.getElementById('settings-provider').value = ai.provider;
      document.getElementById('settings-model').value = ai.model;
      document.getElementById('settings-key').value = '';
      document.getElementById('settings-key-state').textContent = ai.has_key ? '密钥已配置' : '未配置密钥';
      document.getElementById('settings-key-state').className = 'badge ' + (ai.has_key ? 'badge-success' : 'badge-primary');
      document.getElementById('settings-delete-key').disabled = !ai.has_key;
    } catch (error) {
      content.hidden = true;
      notice.hidden = false;
      notice.textContent = error.message;
    }
  }

  renderUsers() {
    const escape = value => window.portal.escapeHtml(value);
    const labels = {admin: '管理员', engineer: '工程师', viewer: '只读用户'};
    document.getElementById('settings-users').innerHTML = this.users.map(user => `
      <tr><td>${escape(user.username)}</td><td><span class="settings-role">${labels[user.role] || escape(user.role)}</span></td><td>
      <button class="btn-outline" data-user-action="edit" data-id="${user.id}">编辑</button>
      <button class="btn-outline" data-user-action="delete" data-id="${user.id}" ${user.username === window.demoAuth.current.username ? 'disabled' : ''}>删除</button>
      </td></tr>`).join('');
  }

  userForm(user = null) {
    const escape = value => window.portal.escapeHtml(value);
    window.app.showModal(user ? '编辑人员' : '新增人员', `
      <form id="settings-user-form" class="settings-modal-form">
        <label>登录账号<input id="setting-username" required minlength="2" maxlength="64" pattern="[a-zA-Z0-9_.-]+" value="${escape(user?.username || '')}"></label>
        <label>角色<select id="setting-role"><option value="admin">管理员</option><option value="engineer">工程师</option><option value="viewer">只读用户</option></select></label>
        <label>${user ? '重置密码（留空保持原密码）' : '初始密码'}<input id="setting-password" type="password" minlength="6" maxlength="128" autocomplete="new-password" ${user ? '' : 'required'}></label>
        <p id="settings-user-error" class="settings-error" role="alert"></p>
        <div class="settings-form-actions"><button type="button" class="btn-outline" onclick="window.app.closeModal()">取消</button><button class="btn-primary" type="submit">保存</button></div>
      </form>`);
    document.getElementById('setting-role').value = user?.role || 'engineer';
    document.getElementById('settings-user-form').addEventListener('submit', async event => {
      event.preventDefault();
      const password = document.getElementById('setting-password').value;
      const body = {username: document.getElementById('setting-username').value.trim(), role: document.getElementById('setting-role').value};
      if (password) body.password = password;
      try {
        await this.request('/settings/users' + (user ? '/' + user.id : ''), {method: user ? 'PUT' : 'POST', body: JSON.stringify(body)});
        window.app.closeModal();
        await this.render();
        window.app.toast('人员信息已保存', 'success');
      } catch (error) {
        document.getElementById('settings-user-error').textContent = error.message;
      }
    });
  }

  confirmDeleteUser(user) {
    window.app.showModal('删除人员', `<p>确定删除账号 <strong>${window.portal.escapeHtml(user.username)}</strong>？删除后该账号将无法登录。</p><p id="settings-delete-error" class="settings-error" role="alert"></p><div class="settings-form-actions"><button class="btn-outline" onclick="window.app.closeModal()">取消</button><button class="btn-primary" id="confirm-delete-user">删除</button></div>`);
    document.getElementById('confirm-delete-user').addEventListener('click', async () => {
      try {
        await this.request('/settings/users/' + user.id, {method: 'DELETE'});
        window.app.closeModal();
        await this.render();
        window.app.toast('账号已删除', 'success');
      } catch (error) {
        document.getElementById('settings-delete-error').textContent = error.message;
      }
    });
  }

  async saveAI() {
    const body = {provider: document.getElementById('settings-provider').value, model: document.getElementById('settings-model').value};
    const key = document.getElementById('settings-key').value;
    if (key) body.api_key = key;
    try {
      await this.request('/settings/ai', {method: 'PUT', body: JSON.stringify(body)});
      await this.render();
      window.app.toast('AI 服务配置已保存', 'success');
    } catch (error) {
      window.app.toast(error.message, 'error');
    }
  }

  confirmDeleteKey() {
    window.app.showModal('删除 AI 密钥', '<p>确定删除已保存的 AI 密钥？</p><div class="settings-form-actions"><button class="btn-outline" onclick="window.app.closeModal()">取消</button><button class="btn-primary" id="confirm-delete-key">删除密钥</button></div>');
    document.getElementById('confirm-delete-key').addEventListener('click', async () => {
      try {
        await this.request('/settings/ai/key', {method: 'DELETE'});
        window.app.closeModal();
        await this.render();
        window.app.toast('密钥已删除', 'success');
      } catch (error) {
        window.app.toast(error.message, 'error');
      }
    });
  }
}

window.SettingsController = SettingsController;
