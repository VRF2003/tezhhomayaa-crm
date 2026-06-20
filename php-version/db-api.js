// db-api.js
// ---------------------------------------------------------
// This file replaces src/db.js and src/crm.js when switching
// from local IndexedDB to the remote PHP/MySQL Backend.
// ---------------------------------------------------------

// IMPORTANT: Change this URL to where you host your backend/api.php
const API_BASE = 'https://your-domain.com/backend/api.php';

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

  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error! status: ${res.status}`);
  }
  
  // Some requests (like DELETE) might return empty bodies depending on setup
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ── Products API ─────────────────────────────────────────
export const db_products = {
  add: async (p) => await apiRequest('products', 'POST', p),
  put: async (p) => await apiRequest('products', 'PUT', p),
  getAll: async () => await apiRequest('products', 'GET'),
  getByStyleCode: async (code) => await apiRequest('products', 'GET', null, code),
  delete: async (code) => await apiRequest('products', 'DELETE', null, code)
};

// ── Quotes/Orders API ────────────────────────────────────
export const db_quotes = {
  add: async (q) => await apiRequest('quotes', 'POST', q),
  put: async (q) => await apiRequest('quotes', 'PUT', q),
  getAll: async () => await apiRequest('quotes', 'GET'),
  getById: async (id) => await apiRequest('quotes', 'GET', null, id),
  delete: async (id) => await apiRequest('quotes', 'DELETE', null, id)
};

// CRM Helper Functions
export async function deleteQuote(id) {
  await db_quotes.delete(id);
}

export async function updateQuoteStatus(id, status) {
  const quote = await db_quotes.getById(id);
  if (quote) {
    quote.status = status;
    await db_quotes.put(quote);
  }
}

// ── Settings API ─────────────────────────────────────────
export const db_settings = {
  get: async () => {
    try {
      const data = await apiRequest('settings', 'GET');
      // API returns the json directly. If it's an array and empty, return null
      if (Array.isArray(data) && data.length === 0) return null;
      return data;
    } catch(e) {
      return null; // Fallback to defaults
    }
  },
  put: async (data) => await apiRequest('settings', 'PUT', data)
};
