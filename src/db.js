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
    // If the server doesn't execute PHP (Vite dev server), it will return text/html.
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      throw new Error("Server did not return JSON. Ensure you are running this on a PHP server (like XAMPP or cPanel) and not the local Vite dev server.");
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || err.details || `HTTP error! status: ${res.status}`);
    }
    
    const parsed = await res.json();
    if (parsed && parsed.error) {
      throw new Error(parsed.error + (parsed.message ? `: ${parsed.message}` : ''));
    }
    
    return parsed;
  } catch (e) {
    console.error("API Request Failed:", e);
    throw e; // Propagate the error so the UI shows it
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
