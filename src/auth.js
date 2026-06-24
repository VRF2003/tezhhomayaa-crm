import { getToken, getCurrentUser, login } from './db.js';
import { loadProducts } from './data.js';

let permissions = {};

export function hasPermission(module, action) {
  return permissions[module] && permissions[module].includes(action);
}

export function applyRBAC() {
  document.querySelectorAll('[data-permission]').forEach(el => {
    const [mod, act] = el.getAttribute('data-permission').split(':');
    if (!hasPermission(mod, act)) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  });
}

export async function setupAuth(startAppCallback) {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-submit-btn');
      btn.textContent = 'Logging in...';
      btn.disabled = true;
      try {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const user = await login(email, pass);
        if (user && user.permissions) permissions = user.permissions;
        
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-layout').style.display = 'flex';
        
        applyRBAC();
        await startAppCallback();
      } catch (err) {
        alert(err.message);
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  const token = getToken();
  if (token) {
    const user = getCurrentUser();
    if (user && user.permissions) permissions = user.permissions;
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';
    applyRBAC();
    await startAppCallback();
  } else {
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
  }
}
