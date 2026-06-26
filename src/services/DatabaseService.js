/**
 * DatabaseService.js
 * 
 * SaaS Migration Phase 3:
 * This service now communicates exclusively with the Hostinger PHP API.
 * All legacy IndexedDB (db.js) calls have been fully deprecated.
 */

const API_BASE = '/backend/api';

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Dispatch custom event to trigger login overlay in main.js
    window.dispatchEvent(new CustomEvent('auth-expired'));
    throw new Error('Unauthorized');
  }
  return response;
}

export const DatabaseService = {
  // ── Settings ─────────────────────────────────────────
  async getSettings() {
    try {
      const res = await apiFetch(`${API_BASE}/settings.php`);
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      console.error('API Error: getSettings', e);
      return {};
    }
  },
  async saveSettings(settings) {
    try {
      const res = await apiFetch(`${API_BASE}/settings.php`, {
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
      const ts = new Date().getTime();
      const res = await apiFetch(`${API_BASE}/buyers.php?_=${ts}`);
      const data = await res.json() || [];
      return data.map(b => ({
        id: b.id,
        name: b.name,
        company: b.company,
        country: b.country,
        phone: b.phone,
        email: b.email,
        whatsapp: b.whatsapp,
        buyerType: b.buyer_type
      }));
    } catch (e) {
      return [];
    }
  },
  async saveBuyer(buyer) {
    const isNew = !buyer.id;
    try {
      const res = await apiFetch(`${API_BASE}/buyers.php`, {
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
      await apiFetch(`${API_BASE}/buyers.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteBuyer', e);
    }
  },

  // ── Products ─────────────────────────────────────────
  async getProducts() {
    try {
      const ts = new Date().getTime();
      const res = await apiFetch(`${API_BASE}/products.php?_=${ts}`);
      const data = await res.json() || [];
      return data.map(p => ({
        id: p.id,
        styleCode: p.style_code,
        productName: p.product_name,
        category: p.category,
        silhouette: p.silhouette,
        overrideMoq: p.override_moq,
        leadTime: p.lead_time,
        design: p.design,
        colour: p.colour,
        tier: p.tier,
        fabric: p.fabric,
        cost: Number(p.cost),
        finalCost: Number(p.final_cost),
        retailPrice: Number(p.retail_price),
        wholesale50: Number(p.wholesale50),
        wholesale40: Number(p.wholesale40),
        wholesale30: Number(p.wholesale30),
        status: p.status,
        image: p.image_url,
        baseCost: Number(p.base_cost)
      }));
    } catch (e) {
      return [];
    }
  },
  async getProductByStyleCode(styleCode) {
    try {
      const res = await apiFetch(`${API_BASE}/products.php?styleCode=${encodeURIComponent(styleCode)}`);
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (e) {
      return null;
    }
  },
  async saveProduct(product) {
    const isNew = !product.id;
    try {
      const res = await apiFetch(`${API_BASE}/products.php`, {
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
      await apiFetch(`${API_BASE}/products.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteProduct', e);
    }
  },

  // ── Quotes / Orders ─────────────────────────────────────────
  async getQuotes() {
    try {
      const ts = new Date().getTime();
      const [res, buyers, products] = await Promise.all([
        apiFetch(`${API_BASE}/quotes.php?_=${ts}`),
        this.getBuyers(),
        this.getProducts()
      ]);
      const quotes = await res.json() || [];
      return quotes.map(q => {
        const buyer = buyers.find(b => b.id == q.buyer_id) || {};
        let tCost = 0;
        let tProfit = 0;

        const mappedItems = q.items ? q.items.map(i => {
          const p = products.find(prod => prod.id == i.product_id) || {};
          const qty = Number(i.qty);
          const unitP = Number(i.unit_price);
          const lineTotal = Number(i.line_total) || (qty * unitP);
          const unitCost = p.finalCost || 0;
          const lineCost = qty * unitCost;
          const lineProfit = lineTotal - lineCost;
          
          tCost += lineCost;
          tProfit += lineProfit;

          return {
            productId: i.product_id,
            productName: p.productName || 'Unknown Product',
            styleCode: p.styleCode || '-',
            category: p.category || '-',
            fabric: p.fabric || '-',
            tier: p.tier || '-',
            finalCost: unitCost,
            qty: qty,
            unitPrice: unitP,
            lineTotal: lineTotal,
            profit: lineProfit,
            marginPct: lineTotal > 0 ? (lineProfit / lineTotal) * 100 : 0,
            sizes: typeof i.size_breakdown === 'string' ? JSON.parse(i.size_breakdown) : (i.size_breakdown || {})
          };
        }) : [];

        const totalVal = Number(q.total_value);

        return {
          ...q,
          id: Number(q.id),
          quoteNumber: q.quote_number,
          buyerId: q.buyer_id,
          buyerName: buyer.name || 'Unknown',
          company: buyer.company || '-',
          country: buyer.country || '-',
          phone: buyer.phone || '',
          email: buyer.email || '',
          whatsapp: buyer.whatsapp || '',
          totalValue: totalVal,
          totalCost: tCost,
          totalProfit: tProfit,
          marginPct: totalVal > 0 ? (tProfit / totalVal) * 100 : 0,
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
      const res = await apiFetch(`${API_BASE}/quotes.php`, {
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
      await apiFetch(`${API_BASE}/quotes.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API Error: deleteQuote', e);
    }
  },
  
  // ── Legacy crm.js wrappers ────────────────────────────────
  async addQuote(quote) {
    const res = await this.saveQuote(quote);
    return res ? res.id : null;
  },
  async getQuoteById(id) {
    const quotes = await this.getQuotes();
    return quotes.find(q => q.id == id);
  },
  async addBuyer(buyer) {
    return await this.saveBuyer(buyer);
  },
  async getBuyerByName(name) {
    const buyers = await this.getBuyers();
    return buyers.filter(b => b.name === name);
  },
  async getBuyerById(id) {
    const buyers = await this.getBuyers();
    return buyers.find(b => b.id == id);
  },
  async getQuotesByBuyer(name) {
    const buyers = await this.getBuyers();
    const buyer = buyers.find(b => b.name === name);
    if (!buyer) return [];
    const quotes = await this.getQuotes();
    return quotes.filter(q => q.buyerId == buyer.id);
  },
  async exportDatabase() {
    return {
      settings: await this.getSettings(),
      buyers: await this.getBuyers(),
      products: await this.getProducts(),
      quotes: await this.getQuotes()
    };
  },
  async importDatabase(data) {
    console.warn("Cloud import is restricted. Please use the backend migration script.");
    return true;
  }
};
