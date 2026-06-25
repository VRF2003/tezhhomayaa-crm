/**
 * DatabaseService.js
 * 
 * SaaS Migration Phase 3:
 * This service now communicates exclusively with the Hostinger PHP API.
 * All legacy IndexedDB (db.js) calls have been fully deprecated.
 */

const API_BASE = '/backend/api';

export const DatabaseService = {
  // ── Settings ─────────────────────────────────────────
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings.php`);
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      console.error('API Error: getSettings', e);
      return {};
    }
  },
  async saveSettings(settings) {
    try {
      const res = await fetch(`${API_BASE}/settings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return await res.json();
    } catch (e) {
      console.error('API Error: saveSettings', e);
    }
  },

  // ── Buyers ─────────────────────────────────────────
  async getBuyers() {
    try {
      const res = await fetch(`${API_BASE}/buyers.php`);
      return await res.json() || [];
    } catch (e) {
      return [];
    }
  },
  async saveBuyer(buyer) {
    const isNew = !buyer.id;
    try {
      const res = await fetch(`${API_BASE}/buyers.php`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyer)
      });
      return await res.json();
    } catch (e) {
      console.error('API Error: saveBuyer', e);
    }
  },
  async deleteBuyer(id) {
    try {
      await fetch(`${API_BASE}/buyers.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteBuyer', e);
    }
  },

  // ── Products ─────────────────────────────────────────
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE}/products.php`);
      return await res.json() || [];
    } catch (e) {
      return [];
    }
  },
  async getProductByStyleCode(styleCode) {
    try {
      const res = await fetch(`${API_BASE}/products.php?styleCode=${encodeURIComponent(styleCode)}`);
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (e) {
      return null;
    }
  },
  async saveProduct(product) {
    const isNew = !product.id;
    try {
      const res = await fetch(`${API_BASE}/products.php`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return await res.json();
    } catch (e) {
      console.error('API Error: saveProduct', e);
    }
  },
  async deleteProduct(id) {
    try {
      await fetch(`${API_BASE}/products.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteProduct', e);
    }
  },

  // ── Quotes / Orders ─────────────────────────────────────────
  async getQuotes() {
    try {
      const res = await fetch(`${API_BASE}/quotes.php`);
      const quotes = await res.json() || [];
      // Re-map the structure slightly if needed so frontend UI doesn't break
      return quotes.map(q => {
        // Map items back properly
        const mappedItems = q.items ? q.items.map(i => ({
          productId: i.product_id,
          qty: Number(i.qty),
          unitPrice: Number(i.unit_price),
          lineTotal: Number(i.line_total),
          sizes: typeof i.size_breakdown === 'string' ? JSON.parse(i.size_breakdown) : (i.size_breakdown || {})
        })) : [];

        return {
          ...q,
          quoteNumber: q.quote_number,
          buyerId: q.buyer_id,
          totalValue: Number(q.total_value),
          paymentTerms: q.payment_terms,
          shippingTerms: q.shipping_terms,
          items: mappedItems,
          production: {
            productionStatus: q.production_status || 'Waiting',
            expected_start_date: q.expected_start_date,
            expected_finish_date: q.expected_finish_date
          }
        };
      });
    } catch (e) {
      console.error('API Error: getQuotes', e);
      return [];
    }
  },
  async saveQuote(quote) {
    const isNew = !quote.id;
    // Map production object inside before saving
    if (quote.production) {
      quote.production_status = quote.production.productionStatus;
      quote.expected_start_date = quote.production.expected_start_date;
      quote.expected_finish_date = quote.production.expected_finish_date;
    }

    try {
      const res = await fetch(`${API_BASE}/quotes.php`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      });
      return await res.json();
    } catch (e) {
      console.error('API Error: saveQuote', e);
    }
  },
  async deleteQuote(id) {
    try {
      await fetch(`${API_BASE}/quotes.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteQuote', e);
    }
  }
};
