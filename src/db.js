// ============================================================
// db.js — PHP/MySQL API wrapper for Tezhhomayaa Wholesale CRM
// ============================================================

const API_BASE = 'order_builder.php';

export async function openDB() {
  return true; // Mock for compatibility
}

export async function executeMigrations() {
  console.log("Migrations handled by MySQL schema.");
}

async function apiRequest(resource, method = 'GET', data = null, id = null) {
  let url = `${API_BASE}?resource=${resource}`;
  if (id) url += `&id=${encodeURIComponent(id)}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error("API Request Failed:", e);
    return null;
  }
}

// ── Quotes ──────────────────────────────────────
export const db_quotes = {
  getAll: async () => await apiRequest('quotes', 'GET') || [],
  get: async (id) => await apiRequest('quotes', 'GET', null, id),
  put: async (q) => { await apiRequest('quotes', 'PUT', q); },
  delete: async (id) => { await apiRequest('quotes', 'DELETE', null, id); }
};

// ── Buyers ─────────────────────────────────────
export const db_buyers = {
  getAll: async () => await apiRequest('buyers', 'GET') || [],
  get: async (id) => await apiRequest('buyers', 'GET', null, id),
  put: async (b) => { await apiRequest('buyers', 'PUT', b); },
  delete: async (id) => { await apiRequest('buyers', 'DELETE', null, id); }
};

// ── Settings ───────────────────────────────────
export const db_settings = {
  get: async (id) => await apiRequest('settings', 'GET', null, id),
  put: async (s) => { await apiRequest('settings', 'PUT', s); },
  getAll: async () => await apiRequest('settings', 'GET') || []
};

// ── Products ───────────────────────────────────
export const db_products = {
  getAll: async () => await apiRequest('products', 'GET') || [],
  get: async (id) => await apiRequest('products', 'GET', null, id),
  getByStyleCode: async (code) => await apiRequest('products', 'GET', null, code),
  put: async (p) => { await apiRequest('products', 'PUT', p); },
  delete: async (id) => { await apiRequest('products', 'DELETE', null, id); },
  clear: async () => { await apiRequest('products', 'DELETE'); }
};

export async function exportDatabase() {
  alert("Database export should be done via phpMyAdmin or cPanel for MySQL.");
}

export async function importDatabase(jsonData) {
  alert("Database import should be done via phpMyAdmin or cPanel for MySQL.");
}
