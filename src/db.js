// ============================================================
// db.js — REST API wrapper with JWT Authentication
// ============================================================

const API_BASE = '/api/order_builder.php'; // Proxied or direct
const ADMIN_API = '/api/admin_api.php';
const AUTH_API = '/api/auth.php';

// Helper to get token
export function getToken() {
  return localStorage.getItem('auth_token');
}

// Helper to get current user object
export function getCurrentUser() {
  const u = localStorage.getItem('auth_user');
  return u ? JSON.parse(u) : null;
}

// Handle 401 Unauthorized globally
function handleAuthError() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const loginView = document.getElementById('login-view');
  if (loginView) loginView.classList.add('active');
}

// Internal generic fetch wrapper
async function apiRequest(endpoint, method = 'GET', data = null, id = null) {
  let url = endpoint;
  if (id !== null) url += `&id=${encodeURIComponent(id)}`;

  const options = {
    method,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };

  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    
    // Check if it's returning HTML instead of JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      throw new Error("Server did not return JSON. Ensure your PHP server is running.");
    }
    
    if (res.status === 401 || res.status === 403) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) handleAuthError();
      throw new Error(err.error || `HTTP error! status: ${res.status}`);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error! status: ${res.status}`);
    }

    const parsed = await res.json();
    if (parsed && parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  } catch (e) {
    console.error("API Request Failed:", e);
    throw e;
  }
}

// --- AUTHENTICATION ---
export async function login(email, password) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  };
  const res = await fetch(AUTH_API, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  handleAuthError();
}

// --- PRODUCTS ---
export const db_products = {
  getAll: async () => await apiRequest(`${API_BASE}?resource=products`, 'GET') || [],
  get: async (id) => await apiRequest(`${API_BASE}?resource=products`, 'GET', null, id),
  getByStyleCode: async (code) => await apiRequest(`${API_BASE}?resource=products`, 'GET', null, code),
  put: async (p) => { await apiRequest(`${API_BASE}?resource=products`, 'PUT', p); },
  delete: async (id) => { await apiRequest(`${API_BASE}?resource=products`, 'DELETE', null, id); }
};

// --- QUOTES ---
export const db_quotes = {
  add: async (q) => { await apiRequest(`${API_BASE}?resource=quotes`, 'POST', q); },
  getAll: async () => await apiRequest(`${API_BASE}?resource=quotes`, 'GET') || [],
  getById: async (id) => await apiRequest(`${API_BASE}?resource=quotes`, 'GET', null, id),
  getByBuyer: async (bName) => {
    const all = await apiRequest(`${API_BASE}?resource=quotes`, 'GET');
    return (all || []).filter(q => q.buyerName === bName);
  },
  put: async (q) => { await apiRequest(`${API_BASE}?resource=quotes`, 'PUT', q, q.id); },
  delete: async (id) => { await apiRequest(`${API_BASE}?resource=quotes`, 'DELETE', null, id); }
};

// --- BUYERS ---
export const db_buyers = {
  add: async (b) => { await apiRequest(`${API_BASE}?resource=buyers`, 'POST', b); },
  getAll: async () => await apiRequest(`${API_BASE}?resource=buyers`, 'GET') || [],
  getById: async (id) => await apiRequest(`${API_BASE}?resource=buyers`, 'GET', null, id),
  put: async (b) => { await apiRequest(`${API_BASE}?resource=buyers`, 'PUT', b, b.id); },
  delete: async (id) => { await apiRequest(`${API_BASE}?resource=buyers`, 'DELETE', null, id); }
};

// --- SETTINGS ---
export const db_settings = {
  get: async () => {
    const s = await apiRequest(`${API_BASE}?resource=settings`, 'GET');
    return Array.isArray(s) ? (s[0] || {}) : s;
  },
  put: async (s) => { await apiRequest(`${API_BASE}?resource=settings`, 'PUT', s); }
};

// --- ADMIN (USERS, ROLES, LOGS) ---
export const db_admin = {
  getUsers: async () => await apiRequest(`${ADMIN_API}?resource=users`, 'GET') || [],
  saveUser: async (u) => {
    if (u.id) return await apiRequest(`${ADMIN_API}?resource=users`, 'PUT', u, u.id);
    else return await apiRequest(`${ADMIN_API}?resource=users`, 'POST', u);
  },
  deleteUser: async (id) => { await apiRequest(`${ADMIN_API}?resource=users`, 'DELETE', null, id); },

  getRoles: async () => await apiRequest(`${ADMIN_API}?resource=roles`, 'GET') || [],
  saveRole: async (r) => {
    if (r.id) return await apiRequest(`${ADMIN_API}?resource=roles`, 'PUT', r, r.id);
    else return await apiRequest(`${ADMIN_API}?resource=roles`, 'POST', r);
  },
  deleteRole: async (id) => { await apiRequest(`${ADMIN_API}?resource=roles`, 'DELETE', null, id); },

  getPermissions: async () => await apiRequest(`${ADMIN_API}?resource=permissions`, 'GET') || [],
  
  getLogs: async () => await apiRequest(`${ADMIN_API}?resource=audit_logs`, 'GET') || []
};
