/**
 * 演示登录（纯前端，不连接服务器）(auth-demo.js)
 * 仅在本机校验演示账号，用于展示登录与角色切换的交互效果。
 */

class DemoAuthController {
  constructor() {
    this.storageKey = 'shm_demo_identity';
    this.accounts = {
      admin: { password: 'admin123', name: '管理员', role: 'admin' },
      engineer: { password: 'engineer123', name: '工程师', role: 'engineer' }
    };
  }

  init() {
    this.overlay = document.getElementById('login-overlay');
    this.form = document.getElementById('login-form');
    this.usernameEl = document.getElementById('login-username');
    this.passwordEl = document.getElementById('login-password');
    this.errorEl = document.getElementById('login-error');
    this.headerUser = document.getElementById('header-user');
    this.avatarEl = document.getElementById('header-user-avatar');
    this.nameEl = document.getElementById('header-user-name');
    this.roleEl = document.getElementById('header-user-role');
    this.logoutBtn = document.getElementById('header-user-logout');

    if (!this.overlay || !this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.tryLogin();
    });

    this.overlay.querySelectorAll('.login-demo-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.usernameEl.value = chip.getAttribute('data-user');
        this.passwordEl.value = chip.getAttribute('data-pass');
        this.errorEl.textContent = '';
        this.passwordEl.focus();
      });
    });

    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.logout());
    }

    const saved = this.readIdentity();
    if (saved) {
      this.applyIdentity(saved, false);
    } else {
      this.showLogin();
    }
  }

  readIdentity() {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  tryLogin() {
    const username = (this.usernameEl.value || '').trim().toLowerCase();
    const password = this.passwordEl.value || '';
    const account = this.accounts[username];

    if (!account || account.password !== password) {
      this.errorEl.textContent = '账号或密码错误，请使用下方演示账号';
      this.passwordEl.select();
      return;
    }

    const identity = { username, name: account.name, role: account.role };
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(identity));
    } catch (err) {
      // 隐私模式下 sessionStorage 可能不可用，忽略即可
    }
    this.errorEl.textContent = '';
    this.applyIdentity(identity, true);
  }

  applyIdentity(identity, notify) {
    this.current = identity;
    if (this.overlay) this.overlay.classList.remove('active');
    document.body.classList.remove('login-locked');
    if (this.headerUser) this.headerUser.style.display = 'flex';
    if (this.avatarEl) this.avatarEl.textContent = identity.name.slice(0, 1);
    if (this.nameEl) this.nameEl.textContent = identity.name;
    if (this.roleEl) this.roleEl.textContent = identity.role;
    if (notify && window.app && window.app.toast) {
      window.app.toast(`欢迎回来，${identity.name}`, 'success');
    }
  }

  showLogin() {
    if (this.overlay) this.overlay.classList.add('active');
    document.body.classList.add('login-locked');
    if (this.headerUser) this.headerUser.style.display = 'none';
    if (this.errorEl) this.errorEl.textContent = '';
    if (this.usernameEl) this.usernameEl.value = '';
    if (this.passwordEl) this.passwordEl.value = '';
    setTimeout(() => {
      if (this.usernameEl) this.usernameEl.focus();
    }, 60);
  }

  logout() {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (err) {
      // 忽略存储异常
    }
    this.current = null;
    this.showLogin();
  }
}

window.DemoAuthController = DemoAuthController;
