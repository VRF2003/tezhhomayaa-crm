import './style.css';
import { products, getUniqueValues, loadProducts } from './data.js';
import { openDB, db_quotes, db_buyers } from './db.js';
import { saveQuote, getReport, deleteQuote, updateQuoteFields, archiveQuote, restoreQuote, duplicateQuote, archiveBuyer, deleteBuyer, updateBuyerFields } from './crm.js';

// ── State ──────────────────────────────────────────────────
let orderItems = [];
let filters = { search: '', category: '', design: '', colour: '', styleCode: '' };
let currentCurrency = 'USD';
let currentOrderDrawerQuote = null; // track open drawer quote for "Load into Builder"

const exchangeRates = {
  USD: { symbol: '$',    rate: 1 },
  AED: { symbol: 'د.إ', rate: 3.67 },
  INR: { symbol: '₹',   rate: 83.5 },
  MYR: { symbol: 'RM',  rate: 4.7 },
  EUR: { symbol: '€',   rate: 0.92 },
};

// ── DOM: Navigation ────────────────────────────────────────
const navLinks  = document.querySelectorAll('.nav-link');
const views     = document.querySelectorAll('.view');
const viewTitle = document.getElementById('view-title');
// viewSubtitle is optional – use ?. everywhere
const viewSubtitle = document.getElementById('view-subtitle');

// ── DOM: Search ────────────────────────────────────────────
const tbodySearch  = document.getElementById('product-table-body');
const searchInput  = document.getElementById('search-input');
const filterCat    = document.getElementById('filter-category');
const filterDesign = document.getElementById('filter-design');
const filterColor  = document.getElementById('filter-colour');
const filterStyle  = document.getElementById('filter-stylecode');

// ── DOM: Order Builder ─────────────────────────────────────
const builderCatProduct = document.getElementById('builder-cat-product');
const builderCatDesign  = document.getElementById('builder-cat-design');
const builderCatColour  = document.getElementById('builder-cat-colour');
const infoStylecode  = document.getElementById('info-stylecode');
const infoFabric     = document.getElementById('info-fabric');
const infoCost       = document.getElementById('info-cost');
const infoFinalcost  = document.getElementById('info-finalcost');
const infoRetail     = document.getElementById('info-retail');
const infoSelectedWs = document.getElementById('info-selected-ws');
const infoProfit     = document.getElementById('info-profit');
const infoMargin     = document.getElementById('info-margin');
const builderTier    = document.getElementById('builder-tier');
const builderQtyXS   = document.getElementById('builder-qty-xs');
const builderQtyS    = document.getElementById('builder-qty-s');
const builderQtyM    = document.getElementById('builder-qty-m');
const builderQtyL    = document.getElementById('builder-qty-l');
const builderQtyXL   = document.getElementById('builder-qty-xl');
const builderQty2XL  = document.getElementById('builder-qty-2xl');
const builderSameQty = document.getElementById('builder-same-qty');
const builderAddBtn  = document.getElementById('builder-add-btn');
const tbodyBuilder   = document.getElementById('builder-table-body');
const builderTotal   = document.getElementById('builder-total');
const builderNavBadge = document.getElementById('builder-nav-badge');

// ── DOM: Quote ─────────────────────────────────────────────
const tbodyQuote        = document.getElementById('quote-table-body');
const quoteName         = document.getElementById('quote-name');
const quoteCompany      = document.getElementById('quote-company');
const quoteCountry      = document.getElementById('quote-country');
const quoteStatus       = document.getElementById('quote-status');
const docBuyerInfo      = document.getElementById('doc-buyer-info');
const quoteItemCount    = document.getElementById('quote-item-count');
const quoteTotalCost    = document.getElementById('quote-total-cost');
const quoteTotalSelling = document.getElementById('quote-total-selling');
const quoteTotalProfit  = document.getElementById('quote-total-profit');
const quoteOverallMargin= document.getElementById('quote-overall-margin');
const quoteGrandTotal   = document.getElementById('quote-grand-total');
const saveQuoteBtn      = document.getElementById('save-quote-btn');
const printClientBtn    = document.getElementById('print-client-btn');
const printInternalBtn  = document.getElementById('print-internal-btn');
const quoteSaveHint     = document.getElementById('quote-save-hint');

// ── DOM: CRM Pages ─────────────────────────────────────────
const tbodyBuyers      = document.getElementById('buyers-table-body');
const buyerDrawer      = document.getElementById('buyer-drawer');
const drawerBuyerName  = document.getElementById('drawer-buyer-name');
const drawerQuotesBody = document.getElementById('drawer-quotes-body');
const tbodyOrders      = document.getElementById('orders-table-body');
const ordersSearch     = document.getElementById('orders-search');
const orderDrawer      = document.getElementById('order-drawer');
const orderDrawerTitle = document.getElementById('order-drawer-title');
const orderDrawerItems = document.getElementById('order-drawer-items');
const orderLoadBuilderBtn = document.getElementById('order-load-builder-btn');

// ── Utility ────────────────────────────────────────────────
const formatCur = (num) => {
  if (isNaN(num) || num == null) return '—';
  const { symbol, rate } = exchangeRates[currentCurrency];
  return `${symbol}${(num * rate).toFixed(2)}`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};

function statusBadge(status) {
  const s = (status || 'Draft').toLowerCase();
  const cls = `status-badge status-${s}`;
  return `<span class="${cls}">${status || 'Draft'}</span>`;
}

function calculateTotalQty(sizes) {
  if (!sizes) return 0;
  return Object.values(sizes).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
}

function formatSizeBreakdown(sizes) {
  if (!sizes) return '—';
  const parts = [];
  if (sizes.xs > 0) parts.push(`XS:${sizes.xs}`);
  if (sizes.s > 0) parts.push(`S:${sizes.s}`);
  if (sizes.m > 0) parts.push(`M:${sizes.m}`);
  if (sizes.l > 0) parts.push(`L:${sizes.l}`);
  if (sizes.xl > 0) parts.push(`XL:${sizes.xl}`);
  if (sizes.xxl > 0) parts.push(`2XL:${sizes.xxl}`);
  return parts.length > 0 ? parts.join(', ') : '—';
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' toast--error' : '');
  setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

// ── Navigation ─────────────────────────────────────────────
const viewTitleMap = {
  'dashboard-view': 'Dashboard',
  'search-view':    'Product Search',
  'builder-view':   'Order Builder',
  'quote-view':     'Buyer Quote',
  'buyers-view':    'Buyers',
  'orders-view':    'Orders',
  'archived-view':  'Archived Orders',
  'reports-view':   'Reports',
};

function activateView(targetId) {
  views.forEach(v => v.classList.remove('active'));
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  navLinks.forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-target="${targetId}"]`)?.classList.add('active');

  document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.mobile-nav-link[data-target="${targetId}"]`)?.classList.add('active');

  if (viewTitle) viewTitle.textContent = viewTitleMap[targetId] || '';
  if (viewSubtitle) viewSubtitle.textContent = '';

  // Lazy-render CRM pages on navigation
  if (targetId === 'dashboard-view') renderDashboard();
  if (targetId === 'buyers-view')    renderBuyers();
  if (targetId === 'orders-view')    renderOrders();
  if (targetId === 'archived-view')  renderArchivedOrders();
  if (targetId === 'reports-view')   renderReports();
}

// ── Init ───────────────────────────────────────────────────
async function init() {
  await openDB();
  await loadProducts();
  populateDropdowns();
  setupEventListeners();
  renderSearchTable();
  updateOrderViews();
  activateView('dashboard-view');
  setupPWA();
}

// ── Dropdowns ──────────────────────────────────────────────
function populateDropdowns() {
  if (filterCat)    getUniqueValues('category').forEach(v => filterCat.add(new Option(v, v)));
  if (filterDesign) getUniqueValues('design').forEach(v => filterDesign.add(new Option(v, v)));
  if (filterColor)  getUniqueValues('colour').forEach(v => filterColor.add(new Option(v, v)));
  if (filterStyle)  getUniqueValues('styleCode').forEach(v => filterStyle.add(new Option(v, v)));

  if (builderCatProduct) {
    builderCatProduct.innerHTML = '<option value="">Select Product...</option>';
    getUniqueValues('productName').forEach(v => builderCatProduct.add(new Option(v, v)));
  }
}

// ── Product Search ─────────────────────────────────────────
function renderSearchTable() {
  if (!tbodySearch) return;
  const filtered = products.filter(p => {
    const q = filters.search.toLowerCase();
    const textMatch = p.productName.toLowerCase().includes(q) || p.styleCode.toLowerCase().includes(q);
    return textMatch
      && (!filters.category  || p.category  === filters.category)
      && (!filters.design    || p.design    === filters.design)
      && (!filters.colour    || p.colour    === filters.colour)
      && (!filters.styleCode || p.styleCode === filters.styleCode);
  });

  tbodySearch.innerHTML = filtered.length === 0
    ? `<tr><td colspan="12" class="empty-state">No products match your filters.</td></tr>`
    : filtered.map(p => `
      <tr>
        <td>${p.productName}</td><td>${p.design}</td><td>${p.colour}</td>
        <td>${p.styleCode}</td><td>${p.category}</td><td>${p.fabric}</td>
        <td class="currency">${formatCur(p.cost)}</td>
        <td class="currency">${formatCur(p.finalCost)}</td>
        <td class="currency">${formatCur(p.retailPrice)}</td>
        <td class="currency" style="color:var(--accent-gold)">${formatCur(p.wholesale50)}</td>
        <td class="currency" style="color:var(--accent-blue)">${formatCur(p.wholesale40)}</td>
        <td class="currency">${formatCur(p.wholesale30)}</td>
      </tr>`).join('');
}

// ── Order Builder ──────────────────────────────────────────
function handleAddToOrder() {
  const pName   = builderCatProduct?.value;
  const pDesign = builderCatDesign?.value;
  const pColour = builderCatColour?.value;
  const product = products.find(p => p.productName === pName && p.design === pDesign && p.colour === pColour);
  const tier    = builderTier?.value;
  
  const sizes = {
    xs: parseInt(builderQtyXS?.value) || 0,
    s: parseInt(builderQtyS?.value) || 0,
    m: parseInt(builderQtyM?.value) || 0,
    l: parseInt(builderQtyL?.value) || 0,
    xl: parseInt(builderQtyXL?.value) || 0,
    xxl: parseInt(builderQty2XL?.value) || 0,
  };
  const qty = calculateTotalQty(sizes);

  if (!product || qty < 1) {
    if (qty < 1 && product) showToast('Total quantity must be at least 1.', true);
    return;
  }

  const existing = orderItems.findIndex(i => i.product.styleCode === product.styleCode && i.tier === tier);
  if (existing > -1) {
    // If item exists, sum the sizes
    const exSizes = orderItems[existing].sizes || {xs:0, s:0, m:0, l:0, xl:0, xxl:0};
    orderItems[existing].sizes = {
      xs: exSizes.xs + sizes.xs,
      s: exSizes.s + sizes.s,
      m: exSizes.m + sizes.m,
      l: exSizes.l + sizes.l,
      xl: exSizes.xl + sizes.xl,
      xxl: exSizes.xxl + sizes.xxl
    };
    orderItems[existing].qty = calculateTotalQty(orderItems[existing].sizes);
  } else {
    orderItems.push({ product, tier, sizes, qty, unitPrice: product[tier] });
  }
  
  // Reset size inputs
  [builderQtyXS, builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL].forEach(el => {
    if (el) el.value = 0;
  });
  updateOrderViews();
}

// ── Order item state ───────────────────────────────────────
let lastDeleted        = null;
let undoTimer          = null;
let editingIndex       = null;

function updateNavBadge() {
  if (!builderNavBadge) return;
  const total = orderItems.reduce((s, i) => s + i.qty, 0);
  builderNavBadge.textContent = total;
  builderNavBadge.classList.toggle('hidden', total === 0);
}

function updateOrderViews() {
  let totalValue = 0, totalQty = 0, totalCost = 0;

  if (!tbodyBuilder || !tbodyQuote) return;

  if (orderItems.length === 0) {
    tbodyBuilder.innerHTML = `<tr><td colspan="12" class="empty-state">No items added yet. Use the form above to add products.</td></tr>`;
    tbodyQuote.innerHTML   = `<tr><td colspan="6"  class="empty-state">No items added yet.</td></tr>`;
  } else {
    tbodyBuilder.innerHTML = orderItems.map((item, i) => {
      const lineCost  = item.product.finalCost * item.qty;
      const lineTotal = item.unitPrice * item.qty;
      const profit    = lineTotal - lineCost;
      const margin    = lineTotal > 0 ? (profit / lineTotal) * 100 : 0;
      totalValue += lineTotal; totalCost += lineCost; totalQty += item.qty;
      const tierLabel = item.tier.replace('wholesale', 'WS ');
      return `<tr data-idx="${i}">
        <td style="color:var(--text-secondary);font-size:0.78rem">${i + 1}</td>
        <td style="font-weight:500">${item.product.productName}</td>
        <td style="color:var(--text-secondary)">${item.product.design}</td>
        <td style="color:var(--text-secondary)">${item.product.colour}</td>
        <td>${tierLabel}</td>
        <td class="currency internal-col">${formatCur(lineCost)}</td>
        <td class="currency" style="color:var(--accent-gold)">${formatCur(item.unitPrice)}</td>
        <td class="size-breakdown">${formatSizeBreakdown(item.sizes)}</td>
        <td>${item.qty}</td>
        <td class="currency">${formatCur(lineTotal)}</td>
        <td class="currency internal-col" style="color:var(--accent-green)">${formatCur(profit)}</td>
        <td class="internal-col" style="color:var(--accent-green)">${margin.toFixed(1)}%</td>
        <td class="actions-col internal-col">
          <div class="action-btn-group">
            <button class="action-btn action-btn--edit"  data-action="edit"  data-idx="${i}" title="Edit">✏️</button>
            <button class="action-btn action-btn--dupe"  data-action="dupe"  data-idx="${i}" title="Duplicate">⧉</button>
            <button class="action-btn action-btn--delete" data-action="delete" data-idx="${i}" title="Delete">🗑</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Event delegation — one listener, always fresh after re-render
    tbodyBuilder.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'edit')   openEditPanel(idx);
      if (btn.dataset.action === 'dupe')   duplicateItem(idx);
      if (btn.dataset.action === 'delete') deleteItemWithConfirm(idx);
    };

    tbodyQuote.innerHTML = orderItems.map(item => {
      const lineTotal = item.unitPrice * item.qty;
      const lineCost = item.product.finalCost * item.qty;
      const lineProfit = lineTotal - lineCost;
      const lineMargin = lineTotal > 0 ? (lineProfit / lineTotal) * 100 : 0;
      return `<tr>
        <td>${item.product.productName}</td>
        <td style="color:var(--text-secondary)">${item.product.styleCode}</td>
        <td>${item.tier.replace('wholesale','WS ')}</td>
        <td class="currency internal-col">${formatCur(lineCost)}</td>
        <td class="currency">${formatCur(item.unitPrice)}</td>
        <td class="size-breakdown">${formatSizeBreakdown(item.sizes)}</td>
        <td>${item.qty}</td>
        <td class="currency">${formatCur(lineTotal)}</td>
        <td class="currency internal-col" style="color:var(--accent-green)">${formatCur(lineProfit)}</td>
        <td class="internal-col" style="color:var(--accent-green)">${lineMargin.toFixed(1)}%</td>
      </tr>`;
    }).join('');
  }

  const totalProfit   = totalValue - totalCost;
  const overallMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  if (builderTotal)        builderTotal.textContent       = formatCur(totalValue);
  if (quoteItemCount)      quoteItemCount.textContent     = totalQty;
  if (quoteTotalCost)      quoteTotalCost.textContent     = formatCur(totalCost);
  if (quoteTotalSelling)   quoteTotalSelling.textContent  = formatCur(totalValue);
  if (quoteTotalProfit)    quoteTotalProfit.textContent   = formatCur(totalProfit);
  if (quoteOverallMargin)  quoteOverallMargin.textContent = `${overallMargin.toFixed(2)}%`;
  if (quoteGrandTotal)     quoteGrandTotal.textContent    = formatCur(totalValue);

  updateNavBadge();
}

// ── Save Quote ─────────────────────────────────────────────
async function handleSaveQuote() {
  const buyerName = quoteName?.value.trim() || '';
  const company   = quoteCompany?.value.trim() || '';
  const country   = quoteCountry?.value.trim() || '';
  const status    = quoteStatus?.value || 'Draft';

  if (!buyerName) { showToast('Please enter a buyer name.', true); return; }
  if (orderItems.length === 0) { showToast('Add at least one product to the order.', true); return; }

  const totalCost  = orderItems.reduce((s, i) => s + i.product.finalCost * i.qty, 0);
  const totalValue = orderItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalProfit= totalValue - totalCost;
  const marginPct  = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  const items = orderItems.map(i => ({
    productName: i.product.productName,
    styleCode:   i.product.styleCode,
    design:      i.product.design,
    colour:      i.product.colour,
    tier:        i.tier,
    sizes:       i.sizes || {xs:0, s:0, m:0, l:0, xl:0, xxl:0},
    qty:         i.qty,
    unitPrice:   i.unitPrice,
    finalCost:   i.product.finalCost,
  }));

  try {
    if (saveQuoteBtn) saveQuoteBtn.disabled = true;
    const { quoteNumber } = await saveQuote({
      buyerName, company, country, status,
      currency: currentCurrency,
      items, totalCost, totalValue, totalProfit, marginPct,
    });
    showToast(`✓ Quote ${quoteNumber} saved successfully!`);
    orderItems = [];
    updateOrderViews();
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
  } finally {
    if (saveQuoteBtn) saveQuoteBtn.disabled = false;
  }
}

// ── Quote doc buyer info ───────────────────────────────────
function updateQuoteDocInfo() {
  if (!docBuyerInfo) return;
  const name = quoteName?.value.trim() || '';
  const comp = quoteCompany?.value.trim() || '';
  const ctry = quoteCountry?.value.trim() || '';
  docBuyerInfo.innerHTML = (name || comp || ctry)
    ? `<strong>${name || 'Unknown Buyer'}</strong><br>${comp || 'No Company'}${ctry ? '<br>' + ctry : ''}`
    : 'Please enter buyer details.';
}

// ── CRM: Dashboard ─────────────────────────────────────────
async function renderDashboard() {
  const r = await getReport();
  const { symbol, rate } = exchangeRates[currentCurrency];
  const fc = (n) => `${symbol}${(n * rate).toFixed(2)}`;

  const el = (id) => document.getElementById(id);
  if (el('stat-buyers'))  el('stat-buyers').textContent  = r.totalBuyers;
  if (el('stat-quotes'))  el('stat-quotes').textContent  = r.totalQuotes;
  if (el('stat-revenue')) el('stat-revenue').textContent = fc(r.totalRevenue);
  if (el('stat-profit'))  el('stat-profit').textContent  = fc(r.totalProfit);

  // Recent quotes
  const rqEl = el('dash-recent-quotes');
  if (rqEl) {
    rqEl.innerHTML = r.recentQuotes.length === 0
      ? `<tr><td colspan="5" class="empty-state">No quotes saved yet.</td></tr>`
      : r.recentQuotes.map(q => `<tr>
          <td style="color:var(--accent-gold); font-family:monospace">${q.quoteNumber}</td>
          <td>${q.buyerName}</td>
          <td>${q.country || '—'}</td>
          <td>${formatDate(q.date)}</td>
          <td class="currency">${fc(q.totalValue)}</td>
        </tr>`).join('');
  }

  // Top products
  const tpEl = el('dash-top-products');
  if (tpEl) {
    tpEl.innerHTML = r.topProducts.length === 0
      ? `<tr><td colspan="3" class="empty-state">No data yet.</td></tr>`
      : r.topProducts.map(p => `<tr>
          <td>${p.name}</td>
          <td class="currency">${fc(p.revenue)}</td>
          <td>${p.qty}</td>
        </tr>`).join('');
  }

  // Countries bar chart
  const ccEl = el('dash-countries-chart');
  if (ccEl) {
    const maxRev = r.topCountries[0]?.revenue || 1;
    ccEl.innerHTML = r.topCountries.length === 0
      ? `<p style="color:var(--text-secondary); font-size:0.82rem; padding:1rem 0">No data yet.</p>`
      : r.topCountries.map(c => `
        <div class="country-bar-row">
          <span class="country-bar-label">${c.name}</span>
          <div class="country-bar-track"><div class="country-bar-fill" style="width:${(c.revenue/maxRev*100).toFixed(1)}%"></div></div>
          <span class="country-bar-val">${fc(c.revenue)}</span>
        </div>`).join('');
  }

  // Financials
  if (el('dash-cost'))     el('dash-cost').textContent     = fc(r.totalCost);
  if (el('dash-revenue2')) el('dash-revenue2').textContent = fc(r.totalRevenue);
  if (el('dash-profit2'))  el('dash-profit2').textContent  = fc(r.totalProfit);
  if (el('dash-margin'))   el('dash-margin').textContent   = `${r.overallMargin.toFixed(2)}%`;
}

// ── CRM: Buyers ────────────────────────────────────────────
async function renderBuyers() {
  const r = await getReport();
  buyerDrawer?.classList.add('hidden');

  if (!tbodyBuyers) return;
  tbodyBuyers.innerHTML = r.allBuyers.length === 0
    ? `<tr><td colspan="9" class="empty-state">No buyers yet. Save a quote to add buyers.</td></tr>`
    : r.allBuyers.map(b => `
      <tr class="expandable" data-name="${b.name}" title="Click to view quotes">
        <td style="color:var(--accent-gold); font-weight:500">${b.name}</td>
        <td>${b.company || '—'}</td>
        <td>${b.country || '—'}</td>
        <td>${b.totalQuotes}</td>
        <td class="currency">${formatCur(b.totalRevenue)}</td>
        <td class="currency" style="color:var(--accent-green)">${formatCur(b.totalProfit)}</td>
        <td>${formatDate(b.firstSeen)}</td>
        <td>${formatDate(b.lastSeen)}</td>
        <td class="actions-col" onclick="event.stopPropagation()">
          <div class="action-btn-group">
            <button class="action-btn action-btn--edit" data-action="edit-buyer" data-id="${b.id}" title="Edit Buyer">✏️</button>
            <button class="action-btn action-btn--delete" data-action="delete-buyer" data-id="${b.id}" title="Delete/Archive Buyer">🗑</button>
            <button class="action-btn action-btn--dupe" data-action="view-history" data-name="${b.name}" title="View History">📋</button>
          </div>
        </td>
      </tr>`).join('');

  // Event delegation
  tbodyBuyers.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      const row = e.target.closest('.expandable');
      if (row) openBuyerDrawer(row.dataset.name);
      return;
    }
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    const buyer = r.allBuyers.find(b => b.id === id);
    if (action === 'edit-buyer' && buyer) openBuyerEditModal(buyer);
    if (action === 'delete-buyer' && buyer) confirmDeleteBuyer(buyer);
    if (action === 'view-history') openBuyerDrawer(btn.dataset.name);
  };
}

async function openBuyerDrawer(name) {
  if (!buyerDrawer || !drawerBuyerName || !drawerQuotesBody) return;
  const quotes = await db_quotes.getByBuyer(name);
  drawerBuyerName.textContent = `Quotes for: ${name}`;

  drawerQuotesBody.innerHTML = quotes.length === 0
    ? `<tr><td colspan="6" class="empty-state">No quotes found.</td></tr>`
    : quotes.sort((a,b) => new Date(b.date)-new Date(a.date)).map(q => `<tr>
        <td style="color:var(--accent-gold); font-family:monospace">${q.quoteNumber}</td>
        <td>${formatDate(q.date)}</td>
        <td>${q.items.length}</td>
        <td class="currency">${formatCur(q.totalValue)}</td>
        <td class="currency" style="color:var(--accent-green)">${formatCur(q.totalProfit)}</td>
        <td>${q.marginPct?.toFixed(1)}%</td>
      </tr>`).join('');

  buyerDrawer.classList.remove('hidden');
  buyerDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── CRM: Orders ────────────────────────────────────────────
async function renderOrders(filterText = '') {
  const r = await getReport();
  orderDrawer?.classList.add('hidden');
  currentOrderDrawerQuote = null;

  const filtered = filterText
    ? r.allQuotes.filter(q => q.buyerName.toLowerCase().includes(filterText.toLowerCase()))
    : r.allQuotes;

  if (!tbodyOrders) return;
  tbodyOrders.innerHTML = filtered.length === 0
    ? `<tr><td colspan="12" class="empty-state">${filterText ? 'No matching orders.' : 'No orders yet.'}</td></tr>`
    : filtered.map(q => `
      <tr data-id="${q.id}">
        <td style="color:var(--accent-gold); font-family:monospace">${q.quoteNumber}</td>
        <td>${formatDate(q.date)}</td>
        <td style="font-weight:500">${q.buyerName}</td>
        <td>${q.company || '—'}</td>
        <td>${q.country || '—'}</td>
        <td>${statusBadge(q.status)}</td>
        <td>${q.items.length}</td>
        <td class="currency">${formatCur(q.totalValue)}</td>
        <td class="currency">${formatCur(q.totalCost)}</td>
        <td class="currency" style="color:var(--accent-green)">${formatCur(q.totalProfit)}</td>
        <td style="color:var(--accent-green)">${q.marginPct?.toFixed(1)}%</td>
        <td class="actions-col">
          <div class="action-btn-group">
            <button class="action-btn action-btn--edit" data-action="view-items" data-id="${q.id}" title="View Items">📋</button>
            <button class="action-btn action-btn--edit" data-action="edit-quote" data-id="${q.id}" title="Edit Quote">✏️</button>
            <button class="action-btn action-btn--dupe" data-action="dupe-quote" data-id="${q.id}" title="Duplicate Order">⧉</button>
            <button class="action-btn action-btn--delete" data-action="archive-quote" data-id="${q.id}" title="Archive Order">📦</button>
            <button class="action-btn action-btn--delete" data-action="delete-quote" data-id="${q.id}" title="Permanently Delete">🗑</button>
          </div>
        </td>
      </tr>`).join('');

  // Event delegation for orders table
  tbodyOrders.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const quote = filtered.find(q => q.id === id);
    if (btn.dataset.action === 'view-items'  && quote) openOrderDrawer(quote);
    if (btn.dataset.action === 'edit-quote'  && quote) openQuoteEditModal(quote);
    if (btn.dataset.action === 'dupe-quote'  && quote) duplicateQuoteAction(quote);
    if (btn.dataset.action === 'archive-quote' && quote) confirmArchiveQuote(quote);
    if (btn.dataset.action === 'delete-quote' && quote) confirmDeleteQuote(quote);
  };
}

function openOrderDrawer(quote) {
  if (!orderDrawer || !orderDrawerTitle || !orderDrawerItems) return;
  currentOrderDrawerQuote = quote;
  orderDrawerTitle.textContent = `${quote.quoteNumber} — ${quote.buyerName}`;
  orderDrawerItems.innerHTML = quote.items.map(item => `<tr>
    <td>${item.productName}</td>
    <td>${item.styleCode}</td>
    <td>${item.tier.replace('wholesale','WS ')}</td>
    <td class="currency internal-col">${formatCur(item.finalCost)}</td>
    <td class="currency">${formatCur(item.unitPrice)}</td>
    <td class="size-breakdown">${formatSizeBreakdown(item.sizes)}</td>
    <td>${item.qty}</td>
    <td class="currency">${formatCur(item.unitPrice * item.qty)}</td>
    <td class="currency internal-col" style="color:var(--accent-green)">${formatCur((item.unitPrice - item.finalCost) * item.qty)}</td>
  </tr>`).join('');

  orderDrawer.classList.remove('hidden');
  orderDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Load Into Builder from Order Drawer ─────────────────────
function loadQuoteIntoBuilder(quote) {
  if (!quote || !quote.items || quote.items.length === 0) {
    showToast('No items to load.', true);
    return;
  }
  const mapped = [];
  for (const item of quote.items) {
    const product = products.find(p => p.styleCode === item.styleCode && p.productName === item.productName);
    const sizes = item.sizes || {xs:0, s:0, m:0, l:0, xl:0, xxl:0};
    if (product) {
      mapped.push({ product, tier: item.tier, sizes, qty: item.qty, unitPrice: item.unitPrice });
    } else {
      // Fallback: rebuild a minimal product object from saved data
      mapped.push({
        product: {
          productName: item.productName,
          styleCode:   item.styleCode,
          design:      item.design || '—',
          colour:      item.colour || '—',
          fabric:      '—',
          cost:        item.finalCost,
          finalCost:   item.finalCost,
          retailPrice: item.unitPrice,
          wholesale50: item.unitPrice,
          wholesale40: item.unitPrice,
          wholesale30: item.unitPrice,
        },
        tier: item.tier,
        sizes,
        qty: item.qty,
        unitPrice: item.unitPrice,
      });
    }
  }
  orderItems = mapped;
  updateOrderViews();
  orderDrawer?.classList.add('hidden');
  activateView('builder-view');
  showToast(`✓ Loaded ${mapped.length} items from ${quote.quoteNumber} into Order Builder.`);
}

// ── Quote Edit Modal (CRM) ─────────────────────────────────
function openQuoteEditModal(quote) {
  const modal = document.getElementById('quote-edit-modal');
  if (!modal) return;
  const nameEl   = document.getElementById('qe-buyer-name');
  const compEl   = document.getElementById('qe-company');
  const ctryEl   = document.getElementById('qe-country');
  const statusEl = document.getElementById('qe-status');
  if (nameEl)   nameEl.value   = quote.buyerName || '';
  if (compEl)   compEl.value   = quote.company || '';
  if (ctryEl)   ctryEl.value   = quote.country || '';
  if (statusEl) statusEl.value = quote.status || 'Draft';

  document.getElementById('qe-save').onclick = async () => {
    const fields = {
      buyerName: nameEl?.value.trim() || quote.buyerName,
      company:   compEl?.value.trim() || '',
      country:   ctryEl?.value.trim() || '',
      status:    statusEl?.value || 'Draft',
    };
    try {
      await updateQuoteFields(quote.id, fields);
      modal.classList.add('hidden');
      showToast('✓ Quote updated successfully.');
      renderOrders(ordersSearch?.value || '');
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    }
  };

  document.getElementById('qe-close').onclick  = () => modal.classList.add('hidden');
  document.getElementById('qe-cancel').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
  modal.classList.remove('hidden');
}

// ── Confirm Delete Quote (CRM) ─────────────────────────────
function confirmDeleteQuote(quote) {
  const overlay = document.getElementById('delete-modal-overlay');
  const msgEl   = document.getElementById('delete-modal-msg');
  if (!overlay || !msgEl) return;
  msgEl.textContent = `Permanently delete quote "${quote.quoteNumber}" for ${quote.buyerName}? This cannot be undone.`;

  const btn = document.getElementById('delete-modal-confirm');
  btn.textContent = 'Delete';

  btn.onclick = async () => {
    try {
      await deleteQuote(quote.id);
      overlay.classList.add('hidden');
      showToast(`✓ Quote ${quote.quoteNumber} deleted.`);
      renderOrders(ordersSearch?.value || '');
      renderDashboard();
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    }
  };
  document.getElementById('delete-modal-cancel').onclick = () => overlay.classList.add('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
  overlay.classList.remove('hidden');
}

// ── CRM: Reports ───────────────────────────────────────────
async function renderReports() {
  const r = await getReport();
  const fc = (n) => formatCur(n);

  const rpcEl = document.getElementById('reports-products-chart');
  if (rpcEl) {
    const maxProd = r.topProducts[0]?.revenue || 1;
    rpcEl.innerHTML = r.topProducts.length === 0
      ? `<p style="color:var(--text-secondary); font-size:0.82rem; padding:1rem 0">No data yet.</p>`
      : r.topProducts.map(p => `
        <div class="bar-row">
          <span class="bar-label" title="${p.name}">${p.name}</span>
          <div class="bar-track"><div class="bar-fill bar-fill--gold" style="width:${(p.revenue/maxProd*100).toFixed(1)}%"></div></div>
          <span class="bar-val">${fc(p.revenue)}</span>
        </div>`).join('');
  }

  const rccEl = document.getElementById('reports-countries-chart');
  if (rccEl) {
    const maxCtry = r.topCountries[0]?.revenue || 1;
    rccEl.innerHTML = r.topCountries.length === 0
      ? `<p style="color:var(--text-secondary); font-size:0.82rem; padding:1rem 0">No data yet.</p>`
      : r.topCountries.map(c => `
        <div class="bar-row">
          <span class="bar-label">${c.name}</span>
          <div class="bar-track"><div class="bar-fill bar-fill--blue" style="width:${(c.revenue/maxCtry*100).toFixed(1)}%"></div></div>
          <span class="bar-val">${fc(c.revenue)}</span>
        </div>`).join('');
  }

  const rfEl = document.getElementById('reports-financials');
  if (rfEl) {
    const overallMarginPct = r.totalRevenue > 0 ? (r.totalProfit / r.totalRevenue * 100).toFixed(2) : '0.00';
    rfEl.innerHTML = `
      <div class="reports-fin-card">
        <div class="label">Total Buyers</div>
        <div class="value">${r.totalBuyers}</div>
      </div>
      <div class="reports-fin-card">
        <div class="label">Total Quotes</div>
        <div class="value">${r.totalQuotes}</div>
      </div>
      <div class="reports-fin-card">
        <div class="label">Total Revenue</div>
        <div class="value" style="color:var(--accent-gold)">${fc(r.totalRevenue)}</div>
      </div>
      <div class="reports-fin-card">
        <div class="label">Total Cost</div>
        <div class="value">${fc(r.totalCost)}</div>
      </div>
      <div class="reports-fin-card">
        <div class="label">Total Profit</div>
        <div class="value" style="color:var(--accent-green)">${fc(r.totalProfit)}</div>
      </div>
      <div class="reports-fin-card">
        <div class="label">Overall Margin</div>
        <div class="value" style="color:var(--accent-green)">${overallMarginPct}%</div>
      </div>`;
  }
}

// ── EDIT PANEL (modal for Order Builder items) ─────────────
function openEditPanel(index) {
  editingIndex = index;
  const item = orderItems[index];
  const overlay = document.getElementById('edit-modal-overlay');
  if (!overlay) return;
  const eProd   = document.getElementById('edit-product');
  const eDes    = document.getElementById('edit-design');
  const eCol    = document.getElementById('edit-colour');
  const eTier   = document.getElementById('edit-tier');
  const eQtyXS  = document.getElementById('edit-qty-xs');
  const eQtyS   = document.getElementById('edit-qty-s');
  const eQtyM   = document.getElementById('edit-qty-m');
  const eQtyL   = document.getElementById('edit-qty-l');
  const eQtyXL  = document.getElementById('edit-qty-xl');
  const eQty2XL = document.getElementById('edit-qty-2xl');
  const ePrice  = document.getElementById('edit-unit-price-preview');

  const refreshPrice = () => {
    const p = products.find(p => p.productName === eProd.value && p.design === eDes.value && p.colour === eCol.value);
    if (ePrice) ePrice.textContent = p ? formatCur(p[eTier.value]) : '—';
  };

  if (eProd) {
    eProd.innerHTML = '<option value="">Select...</option>';
    getUniqueValues('productName').forEach(v => eProd.add(new Option(v, v)));
    eProd.value = item.product.productName;
  }

  if (eDes) {
    eDes.innerHTML = '<option value="">Select...</option>';
    [...new Set(products.filter(p => p.productName === item.product.productName).map(p => p.design))].sort()
      .forEach(d => eDes.add(new Option(d, d)));
    eDes.value = item.product.design;
    eDes.disabled = false;
  }

  if (eCol) {
    eCol.innerHTML = '<option value="">Select...</option>';
    [...new Set(products.filter(p => p.productName === item.product.productName && p.design === item.product.design).map(p => p.colour))].sort()
      .forEach(c => eCol.add(new Option(c, c)));
    eCol.value = item.product.colour;
    eCol.disabled = false;
  }

  if (eTier) eTier.value = item.tier;
  const sizes = item.sizes || {xs:0, s:0, m:0, l:0, xl:0, xxl:0};
  if (eQtyXS)  eQtyXS.value  = sizes.xs;
  if (eQtyS)   eQtyS.value   = sizes.s;
  if (eQtyM)   eQtyM.value   = sizes.m;
  if (eQtyL)   eQtyL.value   = sizes.l;
  if (eQtyXL)  eQtyXL.value  = sizes.xl;
  if (eQty2XL) eQty2XL.value = sizes.xxl;
  refreshPrice();

  if (eProd) eProd.onchange = () => {
    if (eDes) { eDes.innerHTML = '<option value="">Select...</option>'; }
    if (eCol) { eCol.innerHTML = '<option value="">Select...</option>'; eCol.disabled = true; }
    if (eProd.value) {
      [...new Set(products.filter(p => p.productName === eProd.value).map(p => p.design))].sort()
        .forEach(d => eDes?.add(new Option(d, d)));
      if (eDes) eDes.disabled = false;
    } else { if (eDes) eDes.disabled = true; }
    refreshPrice();
  };

  if (eDes) eDes.onchange = () => {
    if (eCol) { eCol.innerHTML = '<option value="">Select...</option>'; }
    if (eDes.value) {
      [...new Set(products.filter(p => p.productName === eProd?.value && p.design === eDes.value).map(p => p.colour))].sort()
        .forEach(c => eCol?.add(new Option(c, c)));
      if (eCol) eCol.disabled = false;
    } else { if (eCol) eCol.disabled = true; }
    refreshPrice();
  };

  if (eCol)  eCol.onchange  = refreshPrice;
  if (eTier) eTier.onchange = refreshPrice;

  document.getElementById('edit-modal-save').onclick = () => {
    const product = products.find(p => p.productName === eProd?.value && p.design === eDes?.value && p.colour === eCol?.value);
    const sizes = {
      xs: parseInt(eQtyXS?.value) || 0,
      s: parseInt(eQtyS?.value) || 0,
      m: parseInt(eQtyM?.value) || 0,
      l: parseInt(eQtyL?.value) || 0,
      xl: parseInt(eQtyXL?.value) || 0,
      xxl: parseInt(eQty2XL?.value) || 0,
    };
    const qty = calculateTotalQty(sizes);
    if (!product) { showToast('Select a valid Product → Design → Colour.', true); return; }
    if (qty < 1)  { showToast('Quantity must be at least 1.', true); return; }
    orderItems[editingIndex] = { product, tier: eTier.value, sizes, qty, unitPrice: product[eTier.value] };
    overlay.classList.add('hidden');
    editingIndex = null;
    updateOrderViews();
    showToast('✓ Order line updated.');
  };

  document.getElementById('edit-modal-close').onclick  = () => overlay.classList.add('hidden');
  document.getElementById('edit-modal-cancel').onclick = () => overlay.classList.add('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
  overlay.classList.remove('hidden');
}

// ── DUPLICATE ──────────────────────────────────────────────
function duplicateItem(index) {
  const copy = JSON.parse(JSON.stringify(orderItems[index]));
  orderItems.splice(index + 1, 0, copy);
  updateOrderViews();
  showToast('✓ Item duplicated.');
}

// ── DELETE WITH CONFIRMATION (Order Builder) ───────────────
function deleteItemWithConfirm(index) {
  const item = orderItems[index];
  const overlay = document.getElementById('delete-modal-overlay');
  const msgEl   = document.getElementById('delete-modal-msg');
  if (!overlay || !msgEl) return;

  // Store old confirm handler and replace
  msgEl.textContent =
    `Remove "${item.product.productName} — ${item.product.design} / ${item.product.colour}" (Qty: ${item.qty}) from the order?`;

  document.getElementById('delete-modal-confirm').onclick = () => {
    lastDeleted = { item: JSON.parse(JSON.stringify(orderItems[index])), index };
    orderItems.splice(index, 1);
    overlay.classList.add('hidden');
    updateOrderViews();
    showUndoBanner(lastDeleted.item);
  };
  document.getElementById('delete-modal-cancel').onclick = () => overlay.classList.add('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
  overlay.classList.remove('hidden');
}

// ── UNDO BANNER ────────────────────────────────────────────
function showUndoBanner(item) {
  let banner = document.getElementById('undo-banner');
  if (!banner) {
    const ref = document.querySelector('#builder-view .table-container');
    if (!ref) return;
    banner = document.createElement('div');
    banner.id = 'undo-banner';
    banner.className = 'undo-banner';
    ref.parentNode.insertBefore(banner, ref);
  }
  banner.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
    <span>"${item.product.productName} — ${item.product.colour}" removed.</span>
    <button class="undo-btn" id="undo-btn-action">↩ Undo</button>`;
  banner.classList.remove('hidden');

  document.getElementById('undo-btn-action').onclick = () => {
    if (lastDeleted) {
      orderItems.splice(lastDeleted.index, 0, lastDeleted.item);
      lastDeleted = null;
      updateOrderViews();
      showToast('✓ Item restored.');
    }
    banner.classList.add('hidden');
    clearTimeout(undoTimer);
  };
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { banner.classList.add('hidden'); lastDeleted = null; }, 8000);
}

// Escape key closes all modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('edit-modal-overlay')?.classList.add('hidden');
    document.getElementById('delete-modal-overlay')?.classList.add('hidden');
    document.getElementById('quote-edit-modal')?.classList.add('hidden');
  }
});

// ── Event Listeners ────────────────────────────────────────
function setupEventListeners() {
  // Navigation: sidebar links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateView(e.currentTarget.getAttribute('data-target'));
    });
  });

  // Navigation: mobile links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateView(e.currentTarget.getAttribute('data-target'));
    });
  });

  // Dashboard quick-access buttons
  document.querySelectorAll('.quick-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => activateView(btn.getAttribute('data-target')));
  });

  // Filters
  const applyFilters = () => {
    filters.search    = searchInput?.value || '';
    filters.category  = filterCat?.value   || '';
    filters.design    = filterDesign?.value || '';
    filters.colour    = filterColor?.value  || '';
    filters.styleCode = filterStyle?.value  || '';
    renderSearchTable();
  };
  searchInput?.addEventListener('input', applyFilters);
  filterCat?.addEventListener('change', applyFilters);
  filterDesign?.addEventListener('change', applyFilters);
  filterColor?.addEventListener('change', applyFilters);
  filterStyle?.addEventListener('change', applyFilters);

  // Builder: cascading dropdowns
  builderCatProduct?.addEventListener('change', () => {
    const val = builderCatProduct.value;
    if (builderCatDesign) builderCatDesign.innerHTML = '<option value="">Select Design...</option>';
    if (builderCatColour) builderCatColour.innerHTML = '<option value="">Select Colour...</option>';
    if (builderCatColour) builderCatColour.disabled = true;
    resetBuilderInfo();
    if (val) {
      [...new Set(products.filter(p => p.productName === val).map(p => p.design))].sort()
        .forEach(d => builderCatDesign?.add(new Option(d, d)));
      if (builderCatDesign) builderCatDesign.disabled = false;
    } else {
      if (builderCatDesign) builderCatDesign.disabled = true;
    }
  });

  builderCatDesign?.addEventListener('change', () => {
    const pVal = builderCatProduct?.value, dVal = builderCatDesign.value;
    if (builderCatColour) builderCatColour.innerHTML = '<option value="">Select Colour...</option>';
    resetBuilderInfo();
    if (dVal) {
      [...new Set(products.filter(p => p.productName === pVal && p.design === dVal).map(p => p.colour))].sort()
        .forEach(c => builderCatColour?.add(new Option(c, c)));
      if (builderCatColour) builderCatColour.disabled = false;
    } else {
      if (builderCatColour) builderCatColour.disabled = true;
    }
  });

  builderCatColour?.addEventListener('change', () => {
    builderCatColour.value ? updateCostingPanel() : resetBuilderInfo();
  });

  builderTier?.addEventListener('change', updateCostingPanel);
  builderAddBtn?.addEventListener('click', handleAddToOrder);

  // Clear All button
  document.getElementById('builder-clear-all')?.addEventListener('click', () => {
    if (orderItems.length === 0) return;
    const overlay = document.getElementById('delete-modal-overlay');
    const msgEl   = document.getElementById('delete-modal-msg');
    if (overlay && msgEl) {
      msgEl.textContent = `Clear all ${orderItems.length} item(s) from the order builder?`;
      document.getElementById('delete-modal-confirm').onclick = () => {
        orderItems = [];
        overlay.classList.add('hidden');
        updateOrderViews();
        showToast('✓ Order cleared.');
      };
      document.getElementById('delete-modal-cancel').onclick = () => overlay.classList.add('hidden');
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };
      overlay.classList.remove('hidden');
    }
  });

  // Quote
  quoteName?.addEventListener('input', updateQuoteDocInfo);
  quoteCompany?.addEventListener('input', updateQuoteDocInfo);
  quoteCountry?.addEventListener('input', updateQuoteDocInfo);
  saveQuoteBtn?.addEventListener('click', handleSaveQuote);
  
  if (printClientBtn) {
    printClientBtn.addEventListener('click', () => {
      document.body.classList.add('print-client');
      window.print();
      setTimeout(() => document.body.classList.remove('print-client'), 500);
    });
  }
  if (printInternalBtn) {
    printInternalBtn.addEventListener('click', () => {
      document.body.classList.add('print-internal');
      window.print();
      setTimeout(() => document.body.classList.remove('print-internal'), 500);
    });
  }

  setupSizeMatrixSync();

  // Orders search
  ordersSearch?.addEventListener('input', (e) => renderOrders(e.target.value));

  // Drawers close
  document.getElementById('drawer-close')?.addEventListener('click', () => buyerDrawer?.classList.add('hidden'));
  document.getElementById('order-drawer-close')?.addEventListener('click', () => orderDrawer?.classList.add('hidden'));

  // Load into Builder from order drawer
  orderLoadBuilderBtn?.addEventListener('click', () => {
    if (currentOrderDrawerQuote) loadQuoteIntoBuilder(currentOrderDrawerQuote);
  });

  // Currency
  document.getElementById('global-currency')?.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    renderSearchTable();
    updateOrderViews();
    updateCostingPanel();
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView === 'dashboard-view') renderDashboard();
    if (activeView === 'buyers-view')    renderBuyers();
    if (activeView === 'orders-view')    renderOrders(ordersSearch?.value || '');
    if (activeView === 'reports-view')   renderReports();
  });
}

function setupSizeMatrixSync() {
  // Order Builder Sync
  if (builderQtyXS && builderSameQty) {
    builderQtyXS.addEventListener('input', () => {
      if (builderSameQty.checked) {
        const val = builderQtyXS.value;
        [builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL].forEach(el => el && (el.value = val));
      }
    });
    [builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL].forEach(el => {
      el?.addEventListener('input', () => builderSameQty.checked = false);
    });
  }
  // Edit Modal Sync
  const eQtyXS = document.getElementById('edit-qty-xs');
  const eQtyS = document.getElementById('edit-qty-s');
  const eQtyM = document.getElementById('edit-qty-m');
  const eQtyL = document.getElementById('edit-qty-l');
  const eQtyXL = document.getElementById('edit-qty-xl');
  const eQty2XL = document.getElementById('edit-qty-2xl');
  const eSameQty = document.getElementById('edit-same-qty');
  
  if (eQtyXS && eSameQty) {
    eQtyXS.addEventListener('input', () => {
      if (eSameQty.checked) {
        const val = eQtyXS.value;
        [eQtyS, eQtyM, eQtyL, eQtyXL, eQty2XL].forEach(el => el && (el.value = val));
      }
    });
    [eQtyS, eQtyM, eQtyL, eQtyXL, eQty2XL].forEach(el => {
      el?.addEventListener('input', () => eSameQty.checked = false);
    });
  }
}

// ── Costing Panel Helpers ──────────────────────────────────
function updateCostingPanel() {
  const pVal = builderCatProduct?.value;
  const dVal = builderCatDesign?.value;
  const cVal = builderCatColour?.value;
  const tier = builderTier?.value;
  if (!cVal) return resetBuilderInfo();

  const product = products.find(p => p.productName === pVal && p.design === dVal && p.colour === cVal);
  if (!product) return;

  if (infoStylecode)  infoStylecode.textContent  = product.styleCode;
  if (infoFabric)     infoFabric.textContent     = product.fabric;
  if (infoCost)       infoCost.textContent       = formatCur(product.cost);
  if (infoFinalcost)  infoFinalcost.textContent  = formatCur(product.finalCost);
  if (infoRetail)     infoRetail.textContent     = formatCur(product.retailPrice);
  const wsPrice = product[tier];
  if (infoSelectedWs) infoSelectedWs.textContent = formatCur(wsPrice);
  const profit = wsPrice - product.finalCost;
  const margin = wsPrice > 0 ? (profit / wsPrice) * 100 : 0;
  if (infoProfit) infoProfit.textContent = formatCur(profit);
  if (infoMargin) infoMargin.textContent = margin.toFixed(2) + '%';
  if (builderTier) builderTier.disabled = false;
  [builderQtyXS, builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL, builderSameQty]
    .forEach(el => { if (el) el.disabled = false; });
  if (builderAddBtn) builderAddBtn.disabled = false;
}

function resetBuilderInfo() {
  [infoStylecode, infoFabric, infoCost, infoFinalcost, infoRetail, infoSelectedWs, infoProfit, infoMargin]
    .forEach(el => { if (el) el.textContent = '—'; });
  if (builderTier)  builderTier.disabled  = true;
  [builderQtyXS, builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL, builderSameQty]
    .forEach(el => { if (el) el.disabled = true; });
  if (builderAddBtn) builderAddBtn.disabled = true;
}

// ── PWA ────────────────────────────────────────────────────
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(r => console.log('[SW] Registered:', r.scope))
      .catch(e => console.error('[SW] Failed:', e));
  }

  // Mobile bottom nav
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    // already registered above, no-op needed (double-safe)
  });

  // Install prompt
  let deferredPrompt = null;
  const banner     = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner) banner.style.display = 'block';
  });
  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (banner) banner.style.display = 'none';
  });
  dismissBtn?.addEventListener('click', () => { if (banner) banner.style.display = 'none'; });
  window.addEventListener('appinstalled', () => { if (banner) banner.style.display = 'none'; });
}

// ── New CRM Actions (Buyers, Dupe, Archive) ────────────────

function openBuyerEditModal(buyer) {
  const modal = document.getElementById('buyer-edit-modal');
  if (!modal) return;
  const nameEl = document.getElementById('be-buyer-name');
  const compEl = document.getElementById('be-company');
  const ctryEl = document.getElementById('be-country');
  
  if (nameEl) nameEl.value = buyer.name || '';
  if (compEl) compEl.value = buyer.company || '';
  if (ctryEl) ctryEl.value = buyer.country || '';

  document.getElementById('be-save').onclick = async () => {
    const fields = {
      name: nameEl?.value.trim() || buyer.name,
      company: compEl?.value.trim() || '',
      country: ctryEl?.value.trim() || '',
    };
    try {
      await updateBuyerFields(buyer.id, fields);
      modal.classList.add('hidden');
      showToast('✓ Buyer updated successfully.');
      renderBuyers();
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    }
  };

  document.getElementById('be-close').onclick  = () => modal.classList.add('hidden');
  document.getElementById('be-cancel').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
  modal.classList.remove('hidden');
}

function confirmDeleteBuyer(buyer) {
  const modal = document.getElementById('buyer-delete-modal');
  const msgEl = document.getElementById('bd-msg');
  if (!modal || !msgEl) return;
  msgEl.textContent = `Delete or archive buyer "${buyer.name}"? Archiving hides the buyer but preserves quote history. Deleting is permanent.`;

  document.getElementById('bd-archive').onclick = async () => {
    try {
      await archiveBuyer(buyer.id);
      modal.classList.add('hidden');
      showToast(`✓ Buyer ${buyer.name} archived.`);
      renderBuyers();
    } catch(err) {
      showToast(`Error: ${err.message}`, true);
    }
  };

  document.getElementById('bd-delete').onclick = async () => {
    try {
      await deleteBuyer(buyer.id);
      modal.classList.add('hidden');
      showToast(`✓ Buyer ${buyer.name} permanently deleted.`);
      renderBuyers();
    } catch(err) {
      showToast(`Error: ${err.message}`, true);
    }
  };

  document.getElementById('bd-close').onclick = () => modal.classList.add('hidden');
  document.getElementById('bd-cancel').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
  modal.classList.remove('hidden');
}

async function duplicateQuoteAction(quote) {
  try {
    await duplicateQuote(quote.id);
    showToast(`✓ Quote duplicated.`);
    renderOrders(ordersSearch?.value || '');
    renderDashboard();
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
  }
}

function confirmArchiveQuote(quote) {
  const overlay = document.getElementById('delete-modal-overlay');
  const msgEl   = document.getElementById('delete-modal-msg');
  if (!overlay || !msgEl) return;
  msgEl.textContent = `Archive quote "${quote.quoteNumber}"? It will be moved to Archived Orders.`;

  const btn = document.getElementById('delete-modal-confirm');
  btn.textContent = 'Archive';

  btn.onclick = async () => {
    try {
      await archiveQuote(quote.id);
      btn.textContent = 'Delete'; // reset
      overlay.classList.add('hidden');
      showToast(`✓ Quote archived.`);
      renderOrders(ordersSearch?.value || '');
      renderDashboard();
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    }
  };
  
  document.getElementById('delete-modal-cancel').onclick = () => {
    btn.textContent = 'Delete'; // reset
    overlay.classList.add('hidden');
  };
  overlay.onclick = (e) => { 
    if (e.target === overlay) {
      btn.textContent = 'Delete'; // reset
      overlay.classList.add('hidden');
    }
  };
  overlay.classList.remove('hidden');
}

async function renderArchivedOrders() {
  const r = await getReport();
  const tbody = document.getElementById('archived-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = r.archivedQuotes.length === 0
    ? `<tr><td colspan="10" class="empty-state">No archived orders.</td></tr>`
    : r.archivedQuotes.map(q => `
      <tr data-id="${q.id}">
        <td style="color:var(--accent-gold); font-family:monospace">${q.quoteNumber}</td>
        <td>${formatDate(q.date)}</td>
        <td style="font-weight:500">${q.buyerName}</td>
        <td>${q.company || '—'}</td>
        <td>${q.country || '—'}</td>
        <td>${statusBadge(q.status)}</td>
        <td>${q.items.length}</td>
        <td class="currency">${formatCur(q.totalValue)}</td>
        <td>${formatDate(q.archivedAt)}</td>
        <td class="actions-col">
          <div class="action-btn-group">
            <button class="action-btn action-btn--edit" data-action="restore-quote" data-id="${q.id}" title="Restore">🔄</button>
          </div>
        </td>
      </tr>`).join('');

  tbody.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const quote = r.archivedQuotes.find(q => q.id === id);
    if (btn.dataset.action === 'restore-quote' && quote) restoreQuoteAction(quote);
  };
}

async function restoreQuoteAction(quote) {
  try {
    await restoreQuote(quote.id);
    showToast(`✓ Quote ${quote.quoteNumber} restored.`);
    renderArchivedOrders();
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
  }
}

// Escape key closes new modals too
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('buyer-edit-modal')?.classList.add('hidden');
    document.getElementById('buyer-delete-modal')?.classList.add('hidden');
  }
});

// ── Run ────────────────────────────────────────────────────
init();
