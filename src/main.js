import './style.css';
import { products, getUniqueValues, loadProducts } from './data.js';
import { openDB, db_quotes, db_buyers, db_settings, executeMigrations, exportDatabase, importDatabase, db_products } from './db.js';
import { saveQuote, getReport, deleteQuote, updateQuoteFields, archiveQuote, restoreQuote, duplicateQuote, archiveBuyer, deleteBuyer, updateBuyerFields } from './crm.js';
import { testGoogleSheetsConnection, syncOrderToSheets } from './gsheets.js';
import { generateLuxuryPDF } from './pdf.js';
import { toNumber, calcLineTotal, calcSizeTotal, formatCurrency, calcProductionDays, calculateQueueWaiting, calcFinalCommitment } from './utils/calc.js';
import { initGlobalSearch } from './search.js';

// ── State ──────────────────────────────────────────────────
export let orderItems = [];
export let filters = { search: '', category: '', design: '', colour: '', styleCode: '' };
export let currentCurrency = 'USD';
let currentOrderDrawerQuote = null; // track open drawer quote for "Load into Builder"
let pdfSettings = {}; // track global PDF Settings

export const exchangeRates = {
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
const quoteMobile       = document.getElementById('quote-mobile');
const quoteEmail        = document.getElementById('quote-email');
const quoteWhatsapp     = document.getElementById('quote-whatsapp');
const quoteBuyerType    = document.getElementById('quote-buyer-type');
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
const formatCur = (num) => formatCurrency(num, currentCurrency, exchangeRates);

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
  return calcSizeTotal(sizes);
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
  console.log(`[Navigation] actvateView called with target: ${targetId}`);
  try {
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
  if (targetId === 'search-view')    console.log('[View] Rendering Product Search'); // handled automatically by initial load usually, but logging
  if (targetId === 'builder-view')   console.log('[View] Rendering Order Builder');
  if (targetId === 'quote-view')     console.log('[View] Rendering Buyer Quote');
  if (targetId === 'buyers-view')    renderBuyers();
  if (targetId === 'orders-view')    renderOrders();
  if (targetId === 'archived-view')  renderArchivedOrders();
  if (targetId === 'reports-view')   renderReports();
  if (targetId === 'production-view') renderProductionDashboard();
  if (targetId === 'settings-view')  console.log('[View] Rendering Settings');
  
  } catch(err) {
    console.error(`[Navigation Error] Failed during activateView('${targetId}'):`, err);
  }
}

// ── Settings Controller ────────────────────────────────────
const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

async function uploadToCloudinary(file) {
  showToast('Uploading image to Cloudinary...', false);
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

async function loadSettings() {
  try {
    const s = await db_settings.get() || {};
    pdfSettings = s;
    if (s.theme) document.getElementById('set-theme').value = s.theme;
    if (s.compName) document.getElementById('set-comp-name').value = s.compName;
    if (s.tagline) document.getElementById('set-tagline').value = s.tagline;
    if (s.website) document.getElementById('set-website').value = s.website;
    if (s.email) document.getElementById('set-email').value = s.email;
    if (s.phone) document.getElementById('set-phone').value = s.phone;
    if (s.address) document.getElementById('set-address').value = s.address;
    if (s.moq) document.getElementById('set-moq').value = s.moq;
    if (s.payment) document.getElementById('set-payment').value = s.payment;
    if (s.delivery) document.getElementById('set-delivery').value = s.delivery;
    if (s.shipping) document.getElementById('set-shipping').value = s.shipping;
    if (s.validity) document.getElementById('set-validity').value = s.validity;
    document.getElementById('set-opt-images').checked = s.optImages !== false;
    document.getElementById('set-opt-qr').checked = s.optQr !== false;
    document.getElementById('set-opt-watermark').checked = s.optWatermark !== false;
    document.getElementById('set-opt-hide-margin').checked = s.optHideMargin === true;
    if (s.gsheetUrl) document.getElementById('set-gsheet-url').value = s.gsheetUrl;
    document.getElementById('set-gsheet-autosync').checked = s.gsheetAutoSync !== false;
    
    if (s.deliveryBuffer != null) document.getElementById('set-delivery-buffer').value = s.deliveryBuffer;
    
    // Factory Calendar
    if (s.factoryCalendar) {
      document.querySelectorAll('.set-off-day').forEach(cb => {
        cb.checked = s.factoryCalendar.weeklyOffDays?.includes(parseInt(cb.value));
      });
      document.getElementById('set-holidays').value = (s.factoryCalendar.holidays || []).join(', ');
    }

    // Silhouette MOQs & Lead Times
    if (!pdfSettings.silhouetteMoqs) pdfSettings.silhouetteMoqs = {};
    if (!pdfSettings.silhouetteLeadTimes) pdfSettings.silhouetteLeadTimes = {};
    renderMoqSettings();

    // Show Image Previews
    const showPreview = (id, url) => {
      const img = document.getElementById(id);
      if (img && url) {
        img.src = url;
        img.style.display = 'block';
      }
    };
    showPreview('set-logo-preview', s.logoUrl);
    showPreview('set-watermark-preview', s.watermarkUrl);
    showPreview('set-signature-preview', s.signatureUrl);
    showPreview('set-stamp-preview', s.stampUrl);

  } catch (err) {
    console.error("Failed to load settings", err);
  }
}

function renderMoqSettings() {
  const container = document.getElementById('moq-list-container');
  if (!container) return;
  const moqs = pdfSettings.silhouetteMoqs || {};
  const leadTimes = pdfSettings.silhouetteLeadTimes || {};
  
  const silDatalist = document.getElementById('settings-sil-list');
  if (silDatalist) {
    const uniqueSils = getUniqueValues('silhouette');
    const allSils = new Set([...Object.keys(moqs), ...Object.keys(leadTimes), ...uniqueSils]);
    silDatalist.innerHTML = Array.from(allSils).map(sil => `<option value="${sil}">`).join('');
  }

  const allSils = new Set([...Object.keys(moqs), ...Object.keys(leadTimes)]);
  
  if (allSils.size === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:10px">No Silhouette Rules defined</div>';
    return;
  }
  
  container.innerHTML = Array.from(allSils).map(sil => {
    const q = moqs[sil] ? `${moqs[sil]} pcs` : 'N/A';
    const l = leadTimes[sil] ? `${leadTimes[sil]} days` : 'N/A';
    return `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color)">
      <div>
        <strong style="color:var(--text-primary)">${sil}</strong>: MOQ: ${q} | Lead Time: ${l}
      </div>
      <div style="display:flex; gap:8px;">
        <button class="icon-btn edit-moq-btn" data-sil="${sil}" data-moq="${moqs[sil] || ''}" data-lead="${leadTimes[sil] || ''}" style="color:var(--text-secondary)">✎</button>
        <button class="icon-btn delete-moq-btn" data-sil="${sil}" style="color:#e04040">✕</button>
      </div>
    </div>
    `;
  }).join('');
  
  container.querySelectorAll('.delete-moq-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const sil = e.currentTarget.getAttribute('data-sil');
      delete pdfSettings.silhouetteMoqs[sil];
      delete pdfSettings.silhouetteLeadTimes[sil];
      await db_settings.put(pdfSettings);
      renderMoqSettings();
      showToast(`Removed rules for ${sil}`);
      if (document.getElementById('builder-view').classList.contains('active')) renderBuilder();
    });
  });

  container.querySelectorAll('.edit-moq-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sil = e.currentTarget.getAttribute('data-sil');
      const moq = e.currentTarget.getAttribute('data-moq');
      const lead = e.currentTarget.getAttribute('data-lead');
      
      document.getElementById('new-moq-silhouette').value = sil;
      document.getElementById('new-moq-qty').value = moq;
      const leadInput = document.getElementById('new-sil-leadtime');
      if(leadInput) leadInput.value = lead;
      
      const addBtn = document.getElementById('add-moq-btn');
      if(addBtn) addBtn.textContent = 'Save Rule';
    });
  });
}

async function saveSettings() {
  try {
    const s = { ...pdfSettings };
    s.theme = document.getElementById('set-theme').value;
    s.compName = document.getElementById('set-comp-name').value;
    s.tagline = document.getElementById('set-tagline').value;
    s.website = document.getElementById('set-website').value;
    s.email = document.getElementById('set-email').value;
    s.phone = document.getElementById('set-phone').value;
    s.address = document.getElementById('set-address').value;
    s.moq = document.getElementById('set-moq').value;
    s.payment = document.getElementById('set-payment').value;
    s.delivery = document.getElementById('set-delivery').value;
    s.deliveryBuffer = parseInt(document.getElementById('set-delivery-buffer').value) || 0;
    s.shipping = document.getElementById('set-shipping').value;
    s.validity = document.getElementById('set-validity').value;
    s.optImages = document.getElementById('set-opt-images').checked;
    s.optQr = document.getElementById('set-opt-qr').checked;
    s.optWatermark = document.getElementById('set-opt-watermark').checked;
    s.optHideMargin = document.getElementById('set-opt-hide-margin').checked;
    s.gsheetUrl = document.getElementById('set-gsheet-url').value;
    s.gsheetAutoSync = document.getElementById('set-gsheet-autosync').checked;
    
    const offDaysNodes = document.querySelectorAll('.set-off-day:checked');
    const offDays = Array.from(offDaysNodes).map(n => parseInt(n.value));
    
    const holidaysRaw = document.getElementById('set-holidays').value || '';
    const holidays = holidaysRaw.split(',').map(d => d.trim()).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));
    
    s.factoryCalendar = {
      weeklyOffDays: offDays,
      holidays: holidays
    };

    const logoF = document.getElementById('set-logo').files[0];
    const wmF = document.getElementById('set-watermark').files[0];
    const sigF = document.getElementById('set-signature').files[0];
    const stampF = document.getElementById('set-stamp').files[0];

    if (logoF) s.logoUrl = await uploadToCloudinary(logoF);
    if (wmF) s.watermarkUrl = await uploadToCloudinary(wmF);
    if (sigF) s.signatureUrl = await uploadToCloudinary(sigF);
    if (stampF) s.stampUrl = await uploadToCloudinary(stampF);

    await db_settings.put(s);
    pdfSettings = s;
    showToast('✓ PDF Settings saved successfully.');
  } catch (err) {
    showToast(`Error: ${err.message}`, true);
  }
}

// ── Init ───────────────────────────────────────────────────
async function init() {
  await openDB();
  await executeMigrations();
  await loadSettings();
  await loadProducts();
  populateDropdowns();
  setupEventListeners();
  initGlobalSearch();
  renderSearchTable();
  updateOrderViews();
  activateView('dashboard-view');
  setupPWA();
}

// ── Dropdowns ──────────────────────────────────────────────
function populateDropdowns() {
  if (filterCat)    { filterCat.innerHTML = '<option value="">All</option>'; getUniqueValues('category').forEach(v => filterCat.add(new Option(v, v))); }
  if (filterDesign) { filterDesign.innerHTML = '<option value="">All</option>'; getUniqueValues('design').forEach(v => filterDesign.add(new Option(v, v))); }
  if (filterColor)  { filterColor.innerHTML = '<option value="">All</option>'; getUniqueValues('colour').forEach(v => filterColor.add(new Option(v, v))); }
  if (filterStyle)  { filterStyle.innerHTML = '<option value="">All</option>'; getUniqueValues('styleCode').forEach(v => filterStyle.add(new Option(v, v))); }

  if (builderCatProduct) {
    builderCatProduct.innerHTML = '<option value="">Select Product...</option>';
    getUniqueValues('productName').forEach(v => builderCatProduct.add(new Option(v, v)));
  }

  // Populate Silhouette datalists (combining products and settings)
  const productSils = getUniqueValues('silhouette');
  const moqs = pdfSettings?.silhouetteMoqs || {};
  const leadTimes = pdfSettings?.silhouetteLeadTimes || {};
  const allSils = new Set([...productSils, ...Object.keys(moqs), ...Object.keys(leadTimes)]);
  
  const pmSilList = document.getElementById('pm-sil-list');
  if (pmSilList) {
    pmSilList.innerHTML = Array.from(allSils).map(sil => `<option value="${sil}">`).join('');
  }
  const epSilList = document.getElementById('ep-sil-list');
  if (epSilList) {
    epSilList.innerHTML = Array.from(allSils).map(sil => `<option value="${sil}">`).join('');
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
    ? `<tr><td colspan="13" class="empty-state">No products match your filters.</td></tr>`
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
        <td>
          <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; 
            background:${(p.status||'Active')==='Active' ? 'rgba(46,125,50,0.2)' : 'rgba(224,64,64,0.2)'}; 
            color:${(p.status||'Active')==='Active' ? 'var(--accent-green)' : '#e04040'}">
            ${p.status || 'Active'}
          </span>
        </td>
        <td>${p.overrideMoq != null ? `<strong>${p.overrideMoq}</strong>` : '<span style="color:var(--text-secondary); font-size:0.8rem">Sil. Default</span>'}</td>
        <td class="actions-cell">
          <button class="icon-btn edit-product-btn" data-stylecode="${p.styleCode}" title="Edit Product">✏️</button>
          <button class="icon-btn delete-product-btn" data-stylecode="${p.styleCode}" title="Delete Product">🗑️</button>
        </td>
      </tr>`).join('');
}

  // Global Search integration
  document.addEventListener('search:add-to-order', (e) => {
    const { product, tier, sizes } = e.detail;
    activateView('builder-view');
    
    // Calculate total qty
    const qty = (sizes.xs || 0) + (sizes.s || 0) + (sizes.m || 0) + (sizes.l || 0) + (sizes.xl || 0) + (sizes.xxl || 0);

    // If no quantity is specified (e.g. from Shift+Click), just populate the form
    if (qty < 1) {
      if (builderCatProduct) {
        builderCatProduct.value = product.productName;
        updateBuilderInfo();
        builderCatProduct.focus();
        showToast(`Selected ${product.productName}. Please enter quantities and click Add.`);
      }
      return;
    }

    // Determine unit price
    let unitPrice = 0;
    if (tier === 'wholesale50') unitPrice = product.wholesale50 || 0;
    if (tier === 'wholesale40') unitPrice = product.wholesale40 || 0;
    if (tier === 'wholesale30') unitPrice = product.wholesale30 || 0;

    // Check if item already exists in cart
    const existing = orderItems.findIndex(i => i.product.styleCode === product.styleCode && i.tier === tier);
    if (existing > -1) {
      const exSizes = orderItems[existing].sizes || {xs:0, s:0, m:0, l:0, xl:0, xxl:0};
      orderItems[existing].sizes = {
        xs: exSizes.xs + sizes.xs,
        s: exSizes.s + sizes.s,
        m: exSizes.m + sizes.m,
        l: exSizes.l + sizes.l,
        xl: exSizes.xl + sizes.xl,
        xxl: exSizes.xxl + sizes.xxl
      };
      orderItems[existing].qty = (orderItems[existing].sizes.xs || 0) + (orderItems[existing].sizes.s || 0) + (orderItems[existing].sizes.m || 0) + (orderItems[existing].sizes.l || 0) + (orderItems[existing].sizes.xl || 0) + (orderItems[existing].sizes.xxl || 0);
    } else {
      orderItems.push({ product, tier, sizes, qty, unitPrice });
    }
    
    updateOrderViews();
    showToast(`Added ${qty}x ${product.productName} to your order.`);
  });

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
      const lineCost  = calcLineTotal(item.product.finalCost, item.qty);
      const lineTotal = calcLineTotal(item.unitPrice, item.qty);
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
        <td class="currency internal-col" style="color:var(--accent-green)">${!pdfSettings?.optHideMargin ? formatCur(profit) : '—'}</td>
        <td class="internal-col" style="color:var(--accent-green)">${!pdfSettings?.optHideMargin ? margin.toFixed(1) + '%' : '—'}</td>
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
      const lineTotal = calcLineTotal(item.unitPrice, item.qty);
      const lineCost = calcLineTotal(item.product.finalCost, item.qty);
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
        <td class="currency internal-col" style="color:var(--accent-green)">${!pdfSettings?.optHideMargin ? formatCur(lineProfit) : '—'}</td>
        <td class="internal-col" style="color:var(--accent-green)">${!pdfSettings?.optHideMargin ? lineMargin.toFixed(1) + '%' : '—'}</td>
      </tr>`;
    }).join('');
  }

  const totalProfit   = totalValue - totalCost;
  const overallMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  if (builderTotal) builderTotal.textContent = formatCur(totalValue);
    
    // Hybrid MOQ Logic
    const moqs = pdfSettings.silhouetteMoqs || {};
    const moqContainer = document.getElementById('builder-moq-status');
    const moqCardsGrid = document.getElementById('builder-moq-cards');
    
    if (moqContainer && moqCardsGrid) {
      if (orderItems.length === 0) {
        moqContainer.style.display = 'none';
      } else {
        const silTotals = {};
        const overrideTotals = {};
        
        orderItems.forEach(item => {
          if (item.product.overrideMoq != null) {
            // Track in Individual Override Pool
            const pName = item.product.productName;
            if (!overrideTotals[pName]) {
              overrideTotals[pName] = { qty: 0, required: item.product.overrideMoq };
            }
            overrideTotals[pName].qty += item.qty;
          } else {
            // Track in Silhouette Pool
            const sil = item.product.silhouette || 'Uncategorized';
            silTotals[sil] = (silTotals[sil] || 0) + item.qty;
          }
        });
        
        let moqHtml = '';
        let hasCards = false;
        
        // 1. Render Silhouette Cards
        for (const [sil, required] of Object.entries(moqs)) {
          const cartQty = silTotals[sil] || 0;
          if (cartQty === 0) continue; 
          
          hasCards = true;
          const remaining = Math.max(0, required - cartQty);
          const { pct, color } = getMoqProgress(cartQty, required);
          const isComplete = pct === 100;
          
          moqHtml += `
            <div class="moq-progress-container">
              <div class="moq-progress-header">
                <div class="moq-progress-title">${sil}</div>
                <div class="moq-progress-stats" style="color: ${color}">
                  <strong>${cartQty}</strong> / ${required} (${pct}%)
                </div>
              </div>
              <div class="moq-progress-bg">
                <div class="moq-progress-fill" style="width: ${pct}%; background-color: ${color}"></div>
              </div>
              ${isComplete ? `
                <div class="moq-benefits">
                  <strong>✓ MOQ Achieved! Benefits Unlocked:</strong>
                  <ul>
                    <li>Wholesale pricing secured</li>
                    <li>Priority production scheduling</li>
                  </ul>
                </div>
              ` : `
                <div class="moq-upsell">
                  <div class="moq-upsell-title">Almost there!</div>
                  <div style="color: var(--text-secondary)">Add <strong>${remaining}</strong> more items to unlock wholesale pricing.</div>
                </div>
              `}
            </div>
          `;
        }
        
        // 2. Render Override Cards
        for (const [pName, data] of Object.entries(overrideTotals)) {
          hasCards = true;
          const cartQty = data.qty;
          const required = data.required;
          const remaining = Math.max(0, required - cartQty);
          const { pct, color } = getMoqProgress(cartQty, required);
          const isComplete = pct === 100;
          
          moqHtml += `
            <div class="moq-progress-container">
              <div class="moq-progress-header">
                <div class="moq-progress-title">${pName} <span style="font-size:0.7rem; background:#444; padding:2px 6px; border-radius:10px; margin-left:5px;">Override</span></div>
                <div class="moq-progress-stats" style="color: ${color}">
                  <strong>${cartQty}</strong> / ${required} (${pct}%)
                </div>
              </div>
              <div class="moq-progress-bg">
                <div class="moq-progress-fill" style="width: ${pct}%; background-color: ${color}"></div>
              </div>
              ${isComplete ? `
                <div class="moq-benefits">
                  <strong>✓ MOQ Achieved! Benefits Unlocked:</strong>
                  <ul>
                    <li>Wholesale pricing secured</li>
                    <li>Priority production scheduling</li>
                  </ul>
                </div>
              ` : `
                <div class="moq-upsell">
                  <div class="moq-upsell-title">Almost there!</div>
                  <div style="color: var(--text-secondary)">Add <strong>${remaining}</strong> more pieces of ${pName} to unlock wholesale pricing.</div>
                </div>
              `}
            </div>
          `;
        }
        
        if (hasCards) {
          moqContainer.style.display = 'block';
          moqCardsGrid.innerHTML = moqHtml;
        } else {
          moqContainer.style.display = 'none';
        }
      }
    }

  if (quoteItemCount)      quoteItemCount.textContent     = totalQty;
  if (quoteTotalCost)      quoteTotalCost.textContent     = formatCur(totalCost);
  
  const productionDays = calcProductionDays(orderItems, pdfSettings);
  let finalCommit = productionDays;
  
  const quoteCalcDel = document.getElementById('quote-calc-delivery');
  if (quoteCalcDel) quoteCalcDel.textContent = finalCommit;
  if (quoteTotalSelling)   quoteTotalSelling.textContent  = formatCur(totalValue);
  if (quoteTotalProfit)    quoteTotalProfit.textContent   = !pdfSettings?.optHideMargin ? formatCur(totalProfit) : '—';
  if (quoteOverallMargin)  quoteOverallMargin.textContent = !pdfSettings?.optHideMargin ? `${overallMargin.toFixed(2)}%` : '—';
  if (quoteGrandTotal)     quoteGrandTotal.textContent    = formatCur(totalValue);

  updateNavBadge();
  updateLiveMoqStatus();
}

// ── Save Quote ─────────────────────────────────────────────
async function handleSaveQuote() {
  const buyerName = quoteName?.value.trim() || '';
  const company   = quoteCompany?.value.trim() || '';
  const country   = quoteCountry?.value.trim() || '';
  const mobile    = quoteMobile?.value.trim() || '';
  const email     = quoteEmail?.value.trim() || '';
  const whatsapp  = quoteWhatsapp?.value.trim() || '';
  const paymentTerms = document.getElementById('quote-payment-terms')?.value.trim() || '';
  const overrideDelivery = parseInt(document.getElementById('quote-override-delivery')?.value) || null;
  const buyerType = quoteBuyerType?.value || '';
  const status    = quoteStatus?.value || 'Draft';

  if (!buyerName || !company || !country || !mobile) { showToast('Please complete all required buyer fields.', true); return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) { showToast('Please enter a valid email address.', true); return; }
  if (orderItems.length === 0) { showToast('Add at least one product to the order.', true); return; }

  // ── MOQ Validation ──
  const moqs = pdfSettings?.silhouetteMoqs || {};
  const silTotals = {};
  const overrideTotals = {};

  orderItems.forEach(item => {
    if (item.product.overrideMoq != null) {
      const pName = item.product.productName;
      if (!overrideTotals[pName]) {
        overrideTotals[pName] = { qty: 0, required: item.product.overrideMoq };
      }
      overrideTotals[pName].qty += item.qty;
    } else {
      const sil = item.product.silhouette || 'Uncategorized';
      silTotals[sil] = (silTotals[sil] || 0) + item.qty;
    }
  });

  const failedMoqs = [];
  
  // Validate Silhouette Pools
  for (const [sil, required] of Object.entries(moqs)) {
    const cartQty = silTotals[sil] || 0;
    if (cartQty > 0 && cartQty < required) {
      failedMoqs.push(`${sil}: ${cartQty} / ${required} (Need ${required - cartQty} more)`);
    }
  }
  
  // Validate Override Pools
  for (const [pName, data] of Object.entries(overrideTotals)) {
    if (data.qty > 0 && data.qty < data.required) {
      failedMoqs.push(`${pName} (Override): ${data.qty} / ${data.required} (Need ${data.required - data.qty} more)`);
    }
  }

  if (failedMoqs.length > 0) {
    showToast(`Cannot save quote. MOQ not met for:\n${failedMoqs.join('\n')}`, true);
    return;
  }
  // ────────────────────

  const totalCost  = orderItems.reduce((s, i) => s + i.product.finalCost * i.qty, 0);
  const totalValue = orderItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalProfit= totalValue - totalCost;
  const marginPct  = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  const items = orderItems.map(i => ({
    product:     i.product,
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
      buyerName, company, country, mobile, email, whatsapp, buyerType, status,
      paymentTerms, overrideDelivery,
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
  const mob  = quoteMobile?.value.trim() || '';
  const eml  = quoteEmail?.value.trim() || '';
  const wa   = quoteWhatsapp?.value.trim() || '';
  
  let html = name ? `<strong>${name}</strong><br>` : '';
  if (comp) html += `${comp}<br>`;
  if (ctry) html += `${ctry}<br>`;
  if (mob) html += `Mobile: ${mob}<br>`;
  if (eml) html += `Email: ${eml}<br>`;
  if (wa)  html += `WhatsApp: ${wa}<br>`;
  
  docBuyerInfo.innerHTML = html || 'Please enter buyer details.';

  if (saveQuoteBtn) {
    const isEmailValid = !eml || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eml);
    const isValid = name && comp && ctry && mob && isEmailValid;
    saveQuoteBtn.disabled = !isValid;
  }
}

// ── CRM: Dashboard ─────────────────────────────────────────
async function renderDashboard() {
  console.log('[View] Rendering Dashboard');
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
  console.log('[View] Rendering Buyers');
  const r = await getReport();
  buyerDrawer?.classList.add('hidden');

  const buyersSearchEl = document.getElementById('buyers-search');
  const term = buyersSearchEl ? buyersSearchEl.value.toLowerCase() : '';

  let filteredBuyers = r.allBuyers;
  if (term) {
    filteredBuyers = filteredBuyers.filter(b => 
      (b.name && b.name.toLowerCase().includes(term)) ||
      (b.company && b.company.toLowerCase().includes(term)) ||
      (b.email && b.email.toLowerCase().includes(term)) ||
      (b.phone && b.phone.toLowerCase().includes(term)) ||
      (b.whatsapp && b.whatsapp.toLowerCase().includes(term))
    );
  }

  if (!tbodyBuyers) return;
  tbodyBuyers.innerHTML = filteredBuyers.length === 0
    ? `<tr><td colspan="9" class="empty-state">No buyers found.</td></tr>`
    : filteredBuyers.map(b => `
      <tr class="expandable" data-name="${b.name}" title="Click to view quotes">
        <td style="color:var(--accent-gold); font-weight:500">${b.name}</td>
        <td>${b.company || '—'}</td>
        <td>${b.country || '—'}</td>
        <td>${b.totalQuotes}</td>
        <td class="currency">${formatCur(b.totalRevenue)}</td>
        <td class="currency" style="color:var(--accent-green)">${formatCur(b.totalProfit)}</td>
        <td>${formatDate(b.firstSeen)}</td>
        <td>${formatDate(b.lastSeen)}</td>
        <td class="actions-col">
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
  console.log('[View] Rendering Orders');
  const r = await getReport();
  orderDrawer?.classList.add('hidden');
  currentOrderDrawerQuote = null;

  let filtered = r.allQuotes;
  if (filterText) {
    const term = filterText.toLowerCase();
    filtered = filtered.filter(q => 
      (q.buyerName && q.buyerName.toLowerCase().includes(term)) ||
      (q.company && q.company.toLowerCase().includes(term)) ||
      (q.email && q.email.toLowerCase().includes(term)) ||
      (q.phone && q.phone.toLowerCase().includes(term)) ||
      (q.whatsapp && q.whatsapp.toLowerCase().includes(term)) ||
      (q.quoteNumber && q.quoteNumber.toLowerCase().includes(term))
    );
  }

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
  orderDrawerItems.innerHTML = quote.items.map(item => {
    const lineCost = calcLineTotal(item.finalCost, item.qty);
    const lineTotal = calcLineTotal(item.unitPrice, item.qty);
    const lineProfit = lineTotal - lineCost;
    return `<tr>
      <td>${item.productName}</td>
      <td>${item.styleCode}</td>
      <td>${item.tier.replace('wholesale','WS ')}</td>
      <td class="currency internal-col">${formatCur(item.finalCost)}</td>
      <td class="currency">${formatCur(item.unitPrice)}</td>
      <td class="size-breakdown">${formatSizeBreakdown(item.sizes)}</td>
      <td>${item.qty}</td>
      <td class="currency">${formatCur(lineTotal)}</td>
      <td class="currency internal-col" style="color:var(--accent-green)">${formatCur(lineProfit)}</td>
    </tr>`;
  }).join('');

  orderDrawer.classList.remove('hidden');
  orderDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Download Saved Quote as PDF ──────────────────────────────
window.printSavedQuote = async function(quote, mode) {
  // Show a simple loading toast
  showToast('Generating PDF...');
  try {
    await generateLuxuryPDF(quote, mode, pdfSettings, exchangeRates);
  } catch (error) {
    showToast('Failed to generate PDF.', true);
  }
};

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
  const mobEl    = document.getElementById('qe-mobile');
  const emlEl    = document.getElementById('qe-email');
  const waEl     = document.getElementById('qe-whatsapp');
  const typeEl   = document.getElementById('qe-buyer-type');
  const statusEl = document.getElementById('qe-status');
  
  if (nameEl)   nameEl.value   = quote.buyerName || '';
  if (compEl)   compEl.value   = quote.company || '';
  if (ctryEl)   ctryEl.value   = quote.country || '';
  if (mobEl)    mobEl.value    = quote.phone || quote.mobile || '';
  if (emlEl)    emlEl.value    = quote.email || '';
  if (waEl)     waEl.value     = quote.whatsapp || '';
  if (typeEl)   typeEl.value   = quote.buyerType || '';
  if (statusEl) statusEl.value = quote.status || 'Draft';

  const prodPanel = document.getElementById('qe-production-panel');
  if (prodPanel) {
    if (quote.status === 'Confirmed' && quote.production) {
      prodPanel.style.display = 'block';
      const qePriority = document.getElementById('qe-priority');
      const qeQueueWaiting = document.getElementById('qe-queue-waiting');
      const qeProductionDays = document.getElementById('qe-production-days');
      const qeFinalCommit = document.getElementById('qe-final-commit');
      const qeOverrideDays = document.getElementById('qe-override-days');
      const qeOverrideReason = document.getElementById('qe-override-reason');
      const qeProdStatus = document.getElementById('qe-production-status');
      const qeProdNote = document.getElementById('qe-production-note');

      if (qePriority) qePriority.value = quote.production.priority || 'Normal';
      if (qeQueueWaiting) qeQueueWaiting.textContent = `${quote.production.queueWaiting || 0} Days`;
      if (qeProductionDays) qeProductionDays.textContent = `${quote.production.productionDays || 0} Days`;
      if (qeFinalCommit) qeFinalCommit.textContent = `${quote.production.finalCommitment || 0} Days`;
      
      if (qeOverrideDays) qeOverrideDays.value = quote.production.manualOverride || '';
      if (qeOverrideReason) qeOverrideReason.value = quote.production.overrideReason || '';
      if (qeProdStatus) qeProdStatus.value = quote.production.productionStatus || 'Scheduled';
      if (qeProdNote) qeProdNote.value = ''; // Reset note field
    } else {
      prodPanel.style.display = 'none';
    }
  }

  document.getElementById('qe-save').onclick = async () => {
    const email = emlEl?.value.trim() || '';
    if (emlEl && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', true);
      return;
    }
    
    const fields = {
      buyerName: nameEl?.value.trim() || quote.buyerName,
      company:   compEl?.value.trim() || '',
      country:   ctryEl?.value.trim() || '',
      phone:     mobEl?.value.trim() || '',
      email:     email,
      whatsapp:  waEl?.value.trim() || '',
      buyerType: typeEl?.value || '',
      status:    statusEl?.value || 'Draft',
    };

    // If changing production fields
    if (quote.status === 'Confirmed' && quote.production && prodPanel?.style.display !== 'none') {
      const qePriority = document.getElementById('qe-priority')?.value;
      const overrideVal = document.getElementById('qe-override-days')?.value;
      const overrideReason = document.getElementById('qe-override-reason')?.value;
      const prodStatus = document.getElementById('qe-production-status')?.value;
      const prodNote = document.getElementById('qe-production-note')?.value?.trim();
      
      if (overrideVal && !overrideReason) {
        showToast('Please provide a reason for the manual override.', true);
        return;
      }
      
      if (!fields.production) fields.production = { ...quote.production };
      fields.production.priority = qePriority || 'Normal';
      fields.production.manualOverride = overrideVal ? Number(overrideVal) : null;
      fields.production.overrideReason = overrideReason || '';
      if (prodStatus) fields.production.productionStatus = prodStatus;
      
      if (prodNote) {
        if (!fields.production.productionNotes) fields.production.productionNotes = [];
        fields.production.productionNotes.push({
          text: prodNote,
          timestamp: new Date().toISOString()
        });
      }
    }

    try {
      await updateQuoteFields(quote.id, fields);
      modal.classList.add('hidden');
      showToast('✓ Quote updated successfully.');
      renderOrders(ordersSearch?.value || '');
      if (typeof renderProductionDashboard === 'function') {
        renderProductionDashboard();
      }
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
      const targetId = e.currentTarget.getAttribute('data-target');
      console.log(`[Click] Sidebar nav-link clicked -> ${targetId}`);
      activateView(targetId);
    });
  });

  // Settings Save Button
  const saveSetBtn = document.getElementById('save-settings-btn');
  if (saveSetBtn) {
    saveSetBtn.addEventListener('click', saveSettings);
  }

  // Google Sheets Test Connection
  const testGsheetBtn = document.getElementById('test-gsheet-btn');
  if (testGsheetBtn) {
    testGsheetBtn.addEventListener('click', async () => {
      const url = document.getElementById('set-gsheet-url').value;
      if (!url) return showToast('Please enter a Web App URL first.', true);
      testGsheetBtn.textContent = 'Testing...';
      testGsheetBtn.disabled = true;
      try {
        await testGoogleSheetsConnection(url);
        showToast('✓ Connection to Google Sheets successful!');
      } catch (err) {
        showToast(`Connection failed: ${err.message}`, true);
      } finally {
        testGsheetBtn.textContent = 'Test Connection';
        testGsheetBtn.disabled = false;
      }
    });
  }

  // Google Sheets Sync Order Button
  const syncOrderBtn = document.getElementById('order-sync-gsheet-btn');
  if (syncOrderBtn) {
    syncOrderBtn.addEventListener('click', async () => {
      if (!currentOrderDrawerQuote) return;
      const url = pdfSettings?.gsheetUrl;
      if (!url) return showToast('Please configure Google Sheets URL in Settings first.', true);
      
      const originalText = syncOrderBtn.innerHTML;
      syncOrderBtn.innerHTML = 'Syncing...';
      syncOrderBtn.disabled = true;
      try {
        await syncOrderToSheets(currentOrderDrawerQuote, url);
        showToast(`✓ Order ${currentOrderDrawerQuote.quoteNumber} synced to Google Sheets!`);
      } catch (err) {
        showToast(`Sync failed: ${err.message}`, true);
      } finally {
        syncOrderBtn.innerHTML = originalText;
        syncOrderBtn.disabled = false;
      }
    });
  }

  // MOQ Management Add Button
  const addMoqBtn = document.getElementById('add-moq-btn');
  if (addMoqBtn) {
    addMoqBtn.addEventListener('click', async () => {
      const silInput = document.getElementById('new-moq-silhouette');
      const qtyInput = document.getElementById('new-moq-qty');
      const leadInput = document.getElementById('new-sil-leadtime');
      const sil = silInput.value.trim();
      const qty = parseInt(qtyInput.value) || 0;
      const leadTime = parseInt(leadInput.value) || 0;
      
      if (!sil || (qty <= 0 && leadTime <= 0)) return showToast('Please enter a valid silhouette and at least one rule (MOQ or Lead Time)', true);
      
      if (!pdfSettings.silhouetteMoqs) pdfSettings.silhouetteMoqs = {};
      if (!pdfSettings.silhouetteLeadTimes) pdfSettings.silhouetteLeadTimes = {};
      if (qty > 0) pdfSettings.silhouetteMoqs[sil] = qty;
      if (leadTime > 0) pdfSettings.silhouetteLeadTimes[sil] = leadTime;
      
      await db_settings.put(pdfSettings);
      
      silInput.value = '';
      qtyInput.value = '';
      if (leadInput) leadInput.value = '';
      
      const addBtn = document.getElementById('add-moq-btn');
      if(addBtn) addBtn.textContent = 'Add';
      
      renderMoqSettings();
      showToast(`Saved rules for ${sil}`);
      if (document.getElementById('builder-view').classList.contains('active')) renderBuilder();
    });
  }

  // Navigation: mobile links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('data-target');
      console.log(`[Click] Mobile nav-link clicked -> ${targetId}`);
      activateView(targetId);
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
  quoteMobile?.addEventListener('input', updateQuoteDocInfo);
  quoteEmail?.addEventListener('input', updateQuoteDocInfo);
  quoteWhatsapp?.addEventListener('input', updateQuoteDocInfo);
  quoteBuyerType?.addEventListener('change', updateQuoteDocInfo);
  saveQuoteBtn?.addEventListener('click', handleSaveQuote);
  
  const buildCurrentQuote = () => {
    return {
      buyerName: quoteName?.value.trim() || 'Draft Buyer',
      company: quoteCompany?.value.trim() || '',
      country: quoteCountry?.value.trim() || '',
      mobile: quoteMobile?.value.trim() || '',
      email: quoteEmail?.value.trim() || '',
      id: 'DRAFT',
      status: 'Draft',
      items: orderItems,
      paymentTerms: document.getElementById('quote-payment-terms')?.value.trim() || '',
      overrideDelivery: document.getElementById('quote-override-delivery')?.value ? parseInt(document.getElementById('quote-override-delivery').value, 10) : null
    };
  };

  if (printClientBtn) {
    printClientBtn.addEventListener('click', async () => {
      showToast('Generating Client PDF...');
      try {
        await generateLuxuryPDF(buildCurrentQuote(), 'client', pdfSettings, exchangeRates);
      } catch (e) {
        showToast('Failed to generate PDF.', true);
      }
    });
  }
  if (printInternalBtn) {
    printInternalBtn.addEventListener('click', async () => {
      showToast('Generating Internal PDF...');
      try {
        await generateLuxuryPDF(buildCurrentQuote(), 'internal', pdfSettings, exchangeRates);
      } catch (e) {
        showToast('Failed to generate PDF.', true);
      }
    });
  }

  setupSizeMatrixSync();

  // CRM & Search
  ordersSearch?.addEventListener('input', (e) => renderOrders(e.target.value));
  document.getElementById('buyers-search')?.addEventListener('input', () => renderBuyers());

  // Drawers close
  document.getElementById('drawer-close')?.addEventListener('click', () => buyerDrawer?.classList.add('hidden'));
  document.getElementById('order-drawer-close')?.addEventListener('click', () => orderDrawer?.classList.add('hidden'));

  // Mobile Sidebar Toggle
  const mainSidebar = document.getElementById('main-sidebar');
  const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
  
  const closeMobileSidebar = () => {
    mainSidebar?.classList.remove('sidebar-open');
    mobileSidebarOverlay?.classList.add('hidden');
    document.body.style.overflow = '';
  };
  
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    mainSidebar?.classList.add('sidebar-open');
    mobileSidebarOverlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  
  document.getElementById('sidebar-close-btn')?.addEventListener('click', closeMobileSidebar);
  mobileSidebarOverlay?.addEventListener('click', closeMobileSidebar);
  
  // Close sidebar when a nav link is clicked on mobile
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        closeMobileSidebar();
      }
    });
  });

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

  // Database Migration Event
  window.addEventListener('db-migrated', (e) => {
    showToast(`✓ Database migration to v\${e.detail.version} successful!`);
  });

  // Database Backup / Restore
  const exportDbBtn = document.getElementById('export-db-btn');
  const importDbTrigger = document.getElementById('import-db-trigger');
  const importDbFile = document.getElementById('import-db-file');
  const importConfirmModal = document.getElementById('import-confirm-modal');
  let pendingImportData = null;

  if (exportDbBtn) {
    exportDbBtn.addEventListener('click', async () => {
      try {
        await exportDatabase();
        showToast('✓ Backup exported successfully.');
      } catch (err) {
        showToast(`Export failed: \${err.message}`, true);
      }
    });
  }

  if (importDbTrigger && importDbFile) {
    importDbTrigger.addEventListener('click', () => importDbFile.click());
    importDbFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        pendingImportData = ev.target.result;
        importConfirmModal?.classList.remove('hidden');
        importDbFile.value = ''; // Reset
      };
      reader.readAsText(file);
    });
  }

  if (importConfirmModal) {
    document.getElementById('ic-cancel')?.addEventListener('click', () => {
      pendingImportData = null;
      importConfirmModal.classList.add('hidden');
    });
    document.getElementById('ic-close')?.addEventListener('click', () => {
      pendingImportData = null;
      importConfirmModal.classList.add('hidden');
    });
    importConfirmModal.addEventListener('click', (e) => {
      if (e.target === importConfirmModal) {
        pendingImportData = null;
        importConfirmModal.classList.add('hidden');
      }
    });
    
    document.getElementById('ic-confirm')?.addEventListener('click', async () => {
      if (!pendingImportData) return;
      const btn = document.getElementById('ic-confirm');
      const originalText = btn.textContent;
      btn.textContent = 'Importing...';
      btn.disabled = true;
      try {
        await importDatabase(pendingImportData);
        importConfirmModal.classList.add('hidden');
        showToast('✓ Backup restored successfully.');
        // Refresh UI
        renderDashboard();
        renderBuyers();
        renderOrders('');
      } catch (err) {
        showToast(`Import failed: \${err.message}`, true);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        pendingImportData = null;
      }
    });
  }

  // ── Product Management ─────────────────────────────────────
  const addProductBtn = document.getElementById('add-product-btn');
  const pmModal = document.getElementById('product-form-modal');
  const pmSave = document.getElementById('pm-save');
  const pdModal = document.getElementById('product-delete-modal');
  let pmBase64Image = null;
  let productToDelete = null;

  document.getElementById('pm-image')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const preview = document.getElementById('pm-image-preview');
        if (preview) {
          preview.style.opacity = '0.5';
          preview.style.display = 'block';
        }
        
        // Upload to Cloudinary instantly
        const secureUrl = await uploadToCloudinary(file);
        pmBase64Image = secureUrl; // We'll keep the variable name pmBase64Image to avoid breaking other logic, but it now stores a URL.
        
        if (preview) {
          preview.src = secureUrl;
          preview.style.opacity = '1';
        }
        showToast('Product image uploaded securely!', false);
      } catch (err) {
        showToast('Image upload failed: ' + err.message, true);
        e.target.value = '';
        if (document.getElementById('pm-image-preview')) {
          document.getElementById('pm-image-preview').style.display = 'none';
        }
      }
    }
  });

  const closePmModal = () => {
    pmModal?.classList.add('hidden');
    pmBase64Image = null;
    document.getElementById('pm-image-preview').style.display = 'none';
  };

  document.getElementById('pm-close')?.addEventListener('click', closePmModal);
  document.getElementById('pm-cancel')?.addEventListener('click', closePmModal);

  addProductBtn?.addEventListener('click', () => {
    // Clear form
    document.getElementById('pm-id').value = '';
    document.getElementById('pm-name').value = '';
    document.getElementById('pm-category').value = '';
    document.getElementById('pm-silhouette').value = '';
    document.getElementById('pm-use-silhouette-moq').checked = true;
    document.getElementById('pm-override-moq-container').style.display = 'none';
    document.getElementById('pm-override-moq').value = '';
    document.getElementById('pm-leadtime').value = '';
    document.getElementById('pm-design').value = '';
    document.getElementById('pm-colour').value = '';
    document.getElementById('pm-stylecode').value = '';
    document.getElementById('pm-fabric').value = '';
    document.getElementById('pm-cost').value = '';
    document.getElementById('pm-finalcost').value = '';
    document.getElementById('pm-retail').value = '';
    document.getElementById('pm-ws50').value = '';
    document.getElementById('pm-ws40').value = '';
    document.getElementById('pm-ws30').value = '';
    document.getElementById('pm-status').value = 'Active';
    document.getElementById('pm-image').value = '';
    document.getElementById('pm-image-preview').style.display = 'none';
    document.getElementById('pm-title').textContent = 'Add Product';
    
    document.getElementById('pm-stylecode').readOnly = false;
    pmBase64Image = null;
    pmModal?.classList.remove('hidden');
  });

  document.getElementById('pm-use-silhouette-moq')?.addEventListener('change', (e) => {
    document.getElementById('pm-override-moq-container').style.display = e.target.checked ? 'none' : 'grid';
  });

  pmSave?.addEventListener('click', async () => {
    const pName = document.getElementById('pm-name').value.trim();
    const pCategory = document.getElementById('pm-category').value.trim();
    const pDesign = document.getElementById('pm-design').value.trim();
    const pColour = document.getElementById('pm-colour').value.trim();
    const pStylecode = document.getElementById('pm-stylecode').value.trim();
    
    if (!pName || !pCategory || !pDesign || !pColour || !pStylecode) {
      return showToast('Please fill all required fields (*).', true);
    }

    const newProd = {
      productName: pName,
      category: pCategory,
      silhouette: document.getElementById('pm-silhouette').value.trim() || 'Uncategorized',
      overrideMoq: document.getElementById('pm-use-silhouette-moq').checked ? null : (parseInt(document.getElementById('pm-override-moq').value) || null),
      leadTime: document.getElementById('pm-use-silhouette-moq').checked ? null : (parseInt(document.getElementById('pm-leadtime').value) || null),
      design: pDesign,
      colour: pColour,
      styleCode: pStylecode,
      fabric: document.getElementById('pm-fabric').value.trim(),
      cost: parseFloat(document.getElementById('pm-cost').value) || 0,
      finalCost: parseFloat(document.getElementById('pm-finalcost').value) || 0,
      retailPrice: parseFloat(document.getElementById('pm-retail').value) || 0,
      wholesale50: parseFloat(document.getElementById('pm-ws50').value) || 0,
      wholesale40: parseFloat(document.getElementById('pm-ws40').value) || 0,
      wholesale30: parseFloat(document.getElementById('pm-ws30').value) || 0,
      status: document.getElementById('pm-status').value,
      image: pmBase64Image
    };

    const editId = document.getElementById('pm-id').value;
    if (editId) {
      newProd.id = parseInt(editId);
    } else {
      // Check for duplicate style code ONLY when adding new
      const existing = await db_products.getByStyleCode(pStylecode);
      if (existing && existing.length > 0) {
        newProd.id = existing[0].id; // Overwrite if it exists
      }
    }

    try {
      await db_products.put(newProd);
      showToast('✓ Product saved successfully.');
      closePmModal();
      await loadProducts();
      populateDropdowns();
      renderSearchTable();
    } catch (err) {
      showToast(`Error saving product: \${err.message}`, true);
    }
  });

  const closePdModal = () => {
    pdModal?.classList.add('hidden');
    productToDelete = null;
  };

  document.getElementById('pd-close')?.addEventListener('click', closePdModal);
  document.getElementById('pd-cancel')?.addEventListener('click', closePdModal);

  document.getElementById('pd-confirm')?.addEventListener('click', async () => {
    if (!productToDelete) return;
    try {
      await db_products.delete(productToDelete.id);
      showToast('✓ Product deleted successfully.');
      closePdModal();
      await loadProducts();
      populateDropdowns();
      renderSearchTable();
    } catch (err) {
      showToast(`Error deleting product: \${err.message}`, true);
    }
  });

  tbodySearch?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-product-btn');
    if (editBtn) {
      const code = editBtn.getAttribute('data-stylecode');
      const prod = products.find(p => p.styleCode === code);
      if (!prod) return;
      
      document.getElementById('pm-title').textContent = 'Edit Product';
      document.getElementById('pm-name').value = prod.productName || '';
      document.getElementById('pm-category').value = prod.category || '';
      document.getElementById('pm-silhouette').value = prod.silhouette || '';
      
      const hasOverride = prod.overrideMoq != null || prod.leadTime != null;
      document.getElementById('pm-use-silhouette-moq').checked = !hasOverride;
      document.getElementById('pm-override-moq-container').style.display = hasOverride ? 'grid' : 'none';
      document.getElementById('pm-override-moq').value = prod.overrideMoq || '';
      document.getElementById('pm-leadtime').value = prod.leadTime || '';

      document.getElementById('pm-design').value = prod.design || '';
      document.getElementById('pm-colour').value = prod.colour || '';
      document.getElementById('pm-stylecode').value = prod.styleCode || '';
      document.getElementById('pm-stylecode').readOnly = true; // Prevent changing PK
      document.getElementById('pm-fabric').value = prod.fabric || '';
      document.getElementById('pm-cost').value = prod.cost || '';
      document.getElementById('pm-finalcost').value = prod.finalCost || '';
      document.getElementById('pm-retail').value = prod.retailPrice || '';
      document.getElementById('pm-ws50').value = prod.wholesale50 || '';
      document.getElementById('pm-ws40').value = prod.wholesale40 || '';
      document.getElementById('pm-ws30').value = prod.wholesale30 || '';
      document.getElementById('pm-status').value = prod.status || 'Active';
      
      if (prod.id) {
        document.getElementById('pm-id').value = prod.id;
      } else {
        document.getElementById('pm-id').value = '';
      }
      
      if (prod.image) {
        pmBase64Image = prod.image;
        document.getElementById('pm-image-preview').src = prod.image;
        document.getElementById('pm-image-preview').style.display = 'block';
      } else {
        pmBase64Image = null;
        document.getElementById('pm-image-preview').style.display = 'none';
      }
      
      pmModal?.classList.remove('hidden');
    }

    const delBtn = e.target.closest('.delete-product-btn');
    if (delBtn) {
      const code = delBtn.getAttribute('data-stylecode');
      const prodLocal = await db_products.getByStyleCode(code);
      if (!prodLocal || prodLocal.length === 0) {
        return showToast('Cannot delete CSV imported products. Only manually created products can be deleted.', true);
      }
      productToDelete = prodLocal[0];
      document.getElementById('pd-msg').textContent = `Are you sure you want to permanently delete "\${productToDelete.productName}" (\${productToDelete.styleCode})?`;
      pdModal?.classList.remove('hidden');
    }
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
      updateLiveMoqStatus();
    });
    [builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL].forEach(el => {
      el?.addEventListener('input', () => {
        builderSameQty.checked = false;
        updateLiveMoqStatus();
      });
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
  if (infoProfit) infoProfit.textContent = !pdfSettings?.optHideMargin ? formatCur(profit) : '—';
  if (infoMargin) infoMargin.textContent = !pdfSettings?.optHideMargin ? margin.toFixed(2) + '%' : '—';
  if (builderTier) builderTier.disabled = false;
  [builderQtyXS, builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL, builderSameQty]
    .forEach(el => { if (el) el.disabled = false; });
  if (builderAddBtn) builderAddBtn.disabled = false;
  updateLiveMoqStatus();
}

function getMoqProgress(qty, required) {
  if (required <= 0) return { pct: 100, color: 'var(--accent-green)' };
  const pct = Math.min(100, Math.round((qty / required) * 100)) || 0;
  let color = 'var(--accent-green)';
  if (pct < 60) color = '#e04040';
  else if (pct < 100) color = '#e0a800';
  return { pct, color };
}

function updateLiveMoqStatus() {
  const panel = document.getElementById('live-moq-panel');
  if (!panel) return;
  
  const pVal = builderCatProduct?.value;
  const dVal = builderCatDesign?.value;
  const cVal = builderCatColour?.value;
  
  if (!pVal || !dVal || !cVal) {
    panel.style.display = 'none';
    return;
  }
  
  const product = products.find(p => p.productName === pVal && p.design === dVal && p.colour === cVal);
  if (!product) {
    panel.style.display = 'none';
    return;
  }
  
  const isOverride = product.overrideMoq != null;
  const sil = product.silhouette || 'Uncategorized';
  const moqs = pdfSettings?.silhouetteMoqs || {};
  
  let requiredMoq;
  let titlePrefix;
  if (isOverride) {
    requiredMoq = product.overrideMoq;
    titlePrefix = `Live MOQ: ${product.productName}`;
  } else {
    requiredMoq = moqs[sil];
    titlePrefix = `Live MOQ: ${sil}`;
  }
  
  if (!requiredMoq) {
    panel.style.display = 'none';
    return;
  }
  
  // Calculate qty in cart for this pool
  let cartQty = 0;
  orderItems.forEach(item => {
    if (isOverride) {
      // Individual pool: only count this exact product name
      if (item.product.productName === product.productName) {
        cartQty += item.qty;
      }
    } else {
      // Silhouette pool: count items in the silhouette, EXCEPT those that have their own override
      if ((item.product.silhouette || 'Uncategorized') === sil && item.product.overrideMoq == null) {
        cartQty += item.qty;
      }
    }
  });
  
  // Calculate qty currently inputted in size matrix
  const inputQty = [builderQtyXS, builderQtyS, builderQtyM, builderQtyL, builderQtyXL, builderQty2XL]
    .reduce((sum, el) => sum + (parseInt(el?.value) || 0), 0);
    
  const totalQty = cartQty + inputQty;
  const remaining = Math.max(0, requiredMoq - totalQty);
  
  const { pct, color } = getMoqProgress(totalQty, requiredMoq);
  const isComplete = pct === 100;

  let upsellHtml = '';
  if (!isComplete && !isOverride) {
    // Find up to 3 OTHER standard products from the same silhouette
    const upsells = products
      .filter(p => p.silhouette === sil && p.productName !== pVal && p.overrideMoq == null)
      .reduce((unique, p) => {
        if (!unique.some(u => u.productName === p.productName)) {
          unique.push(p);
        }
        return unique;
      }, [])
      .slice(0, 3);
      
    let upsellItemsHtml = upsells.map(u => `<div class="moq-upsell-item">${u.productName}</div>`).join('');
    if (upsellItemsHtml) {
      upsellHtml = `
        <div class="moq-upsell" style="margin-top:10px;">
          <div class="moq-upsell-title">Smart Upsell</div>
          <div style="color:var(--text-secondary); margin-bottom:5px;">Consider adding these to hit your MOQ:</div>
          <div class="moq-upsell-items">${upsellItemsHtml}</div>
        </div>
      `;
    }
  }
  
  panel.innerHTML = `
    <div class="moq-progress-container" style="margin-bottom:0; background:var(--bg-dark)">
      <div class="moq-progress-header">
        <div class="moq-progress-title">${titlePrefix} ${isOverride ? '<span style="font-size:0.7rem; background:#444; padding:2px 6px; border-radius:10px; margin-left:5px;">Override</span>' : ''}</div>
        <div class="moq-progress-stats" style="color: ${color}">
          <strong>${totalQty}</strong> / ${requiredMoq} (${pct}%)
        </div>
      </div>
      <div class="moq-progress-bg">
        <div class="moq-progress-fill" style="width: ${pct}%; background-color: ${color}"></div>
      </div>
      ${isComplete ? `
        <div class="moq-benefits">
          <strong>✓ MOQ Achieved! Benefits Unlocked:</strong>
          <ul>
            <li>Wholesale pricing secured</li>
            <li>Priority production scheduling</li>
            <li>Guaranteed factory confirmation</li>
          </ul>
        </div>
      ` : `
        <div style="color: var(--text-secondary); font-size:0.85rem; margin-top:5px;">
          Add <strong>${remaining}</strong> more items to unlock wholesale pricing and priority dispatch.
        </div>
        ${upsellHtml}
      `}
    </div>
  `;
  panel.style.display = 'block';
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
      .then(reg => {
        console.log('[SW] Registered:', reg.scope);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            // If the new worker is installed and there's already an active controller
            // it means this is an update, not the very first installation.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('New version available! Updating...', false);
              // Tell the new worker to skip waiting and activate immediately
              setTimeout(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }, 1500);
            }
          });
        });
      })
      .catch(e => console.error('[SW] Failed:', e));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
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
  const mobEl  = document.getElementById('be-mobile');
  const emlEl  = document.getElementById('be-email');
  const waEl   = document.getElementById('be-whatsapp');
  const typeEl = document.getElementById('be-buyer-type');
  
  if (nameEl) nameEl.value = buyer.name || '';
  if (compEl) compEl.value = buyer.company || '';
  if (ctryEl) ctryEl.value = buyer.country || '';
  if (mobEl)  mobEl.value  = buyer.phone || buyer.mobile || '';
  if (emlEl)  emlEl.value  = buyer.email || '';
  if (waEl)   waEl.value   = buyer.whatsapp || '';
  if (typeEl) typeEl.value = buyer.buyerType || '';

  document.getElementById('be-save').onclick = async () => {
    const email = emlEl?.value.trim() || '';
    if (emlEl && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', true);
      return;
    }
    
    const fields = {
      name: nameEl?.value.trim() || buyer.name,
      company: compEl?.value.trim() || '',
      country: ctryEl?.value.trim() || '',
      phone: mobEl?.value.trim() || '',
      email: email,
      whatsapp: waEl?.value.trim() || '',
      buyerType: typeEl?.value || '',
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

// ── Production Planner Dashboard ──────────────────────────
async function renderProductionDashboard() {
  const r = await getReport();
  const confirmedOrders = r.allQuotes.filter(q => q.status === 'Confirmed' && !q.archived);
  
  // KPI Calculations
  const totalReservedDays = confirmedOrders.reduce((sum, q) => sum + (q.production?.productionDays || 0), 0);
  const lateOrders = confirmedOrders.filter(q => {
    if (!q.production?.expectedFinishDate) return false;
    const finish = new Date(q.production.expectedFinishDate);
    const commit = new Date(q.production.confirmedAt || q.date);
    commit.setDate(commit.getDate() + (q.production.finalCommitment || 0));
    return finish > commit;
  }).length;
  
  const inProd = confirmedOrders.filter(q => ['Cutting','Printing','Embroidery','Stitching','QC'].includes(q.production?.productionStatus)).length;
  const waiting = confirmedOrders.filter(q => ['Waiting','Scheduled'].includes(q.production?.productionStatus)).length;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + totalReservedDays);

  const kpisHtml = `
    <div class="kpi-card"><h4>Active Orders</h4><div class="kpi-value">${confirmedOrders.length}</div></div>
    <div class="kpi-card"><h4>Total Reserved Days</h4><div class="kpi-value">${totalReservedDays}</div></div>
    <div class="kpi-card"><h4>In Production</h4><div class="kpi-value">${inProd}</div></div>
    <div class="kpi-card"><h4>Waiting</h4><div class="kpi-value">${waiting}</div></div>
    <div class="kpi-card"><h4>Late Orders</h4><div class="kpi-value" style="color:var(--accent-red)">${lateOrders}</div></div>
    <div class="kpi-card"><h4>Next Slot</h4><div class="kpi-value" style="font-size:1.1rem">${formatDate(nextDate.toISOString())}</div></div>
  `;
  const kpiEl = document.getElementById('production-kpis');
  if (kpiEl) kpiEl.innerHTML = kpisHtml;

  renderProductionQueue(confirmedOrders);
}

function renderProductionQueue(confirmedOrders) {
  const tbody = document.getElementById('production-table-body');
  const timeline = document.getElementById('production-timeline-container');
  if (!tbody || !timeline) return;

  const searchEl = document.getElementById('production-search');
  const prioEl = document.getElementById('production-filter-priority');
  const statEl = document.getElementById('production-filter-status');
  
  const searchQ = (searchEl?.value || '').toLowerCase();
  const filterPrio = prioEl?.value || '';
  const filterStat = statEl?.value || '';

  // Sort queue by Manual Sort Index first, then Priority (desc), then Confirmation Date (asc)
  const priorityScore = { 'VIP': 4, 'Urgent': 3, 'Priority': 2, 'Normal': 1 };
  const getScore = (q) => priorityScore[q.production?.priority || 'Normal'] || 1;
  const getConfirmationDate = (q) => q.production?.confirmedAt || q.date;

  let sortedQueue = [...confirmedOrders].sort((a, b) => {
    const msA = a.production?.manualSortIndex;
    const msB = b.production?.manualSortIndex;
    if (msA != null && msB != null) return msA - msB;
    if (msA != null) return -1;
    if (msB != null) return 1;

    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(getConfirmationDate(a)) - new Date(getConfirmationDate(b));
  });

  // Filter
  sortedQueue = sortedQueue.filter(q => {
    const textMatch = q.quoteNumber.toLowerCase().includes(searchQ) || q.buyerName.toLowerCase().includes(searchQ);
    const prioMatch = !filterPrio || q.production?.priority === filterPrio;
    const statMatch = !filterStat || q.production?.productionStatus === filterStat;
    return textMatch && prioMatch && statMatch;
  });

  // ── Render Timeline ──
  timeline.innerHTML = sortedQueue.length === 0 ? '<div style="color:var(--text-secondary); text-align:center; padding: 20px;">No active orders match filters.</div>' : '';
  
  let currentAccumulatedDays = 0;
  
  sortedQueue.forEach((q, idx) => {
    const p = q.production || {};
    const wait = p.queueWaiting || 0;
    const prod = p.productionDays || 0;
    const status = p.productionStatus || 'Scheduled';
    const prio = (p.priority || 'Normal').toLowerCase();
    
    const row = document.createElement('div');
    row.className = `timeline-row priority-${prio}`;
    row.draggable = true;
    row.dataset.id = q.id;
    row.dataset.index = idx;
    
    // Label
    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.innerHTML = `<span>${q.quoteNumber}</span><small>${q.buyerName}</small>`;
    
    // Track
    const track = document.createElement('div');
    track.className = 'timeline-track';
    
    // We scale based on total max days (e.g., 60 days = 100%)
    const maxScaleDays = 60; 
    
    const waitWidth = Math.min(100, (wait / maxScaleDays) * 100);
    const prodWidth = Math.min(100, (prod / maxScaleDays) * 100);
    
    const waitBar = document.createElement('div');
    waitBar.className = 'timeline-bar timeline-waiting';
    waitBar.style.width = `${waitWidth}%`;
    waitBar.style.left = '0';
    
    const prodBar = document.createElement('div');
    prodBar.className = `timeline-bar bar-${status === 'Completed' ? 'completed' : prio}`;
    prodBar.style.width = `${prodWidth}%`;
    prodBar.style.left = `${waitWidth}%`;
    prodBar.textContent = `${prod}d`;
    
    track.appendChild(waitBar);
    track.appendChild(prodBar);
    
    row.appendChild(label);
    row.appendChild(track);
    
    // Drag events
    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      e.dataTransfer.setData('text/plain', idx);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
    });
    row.addEventListener('dragover', e => e.preventDefault());
    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const dropIdx = idx;
      if (draggedIdx !== dropIdx) {
        await handleManualReorder(sortedQueue, draggedIdx, dropIdx);
      }
    });

    timeline.appendChild(row);
  });

  // ── Render Table ──
  tbody.innerHTML = sortedQueue.length === 0
    ? `<tr><td colspan="9" class="empty-state">Queue is empty.</td></tr>`
    : sortedQueue.map(q => `
      <tr data-id="${q.id}">
        <td style="color:var(--accent-gold); font-family:monospace">${q.quoteNumber}</td>
        <td style="font-weight:500">${q.buyerName}</td>
        <td><span class="status-badge bar-${(q.production?.priority || 'Normal').toLowerCase()}">${q.production?.priority || 'Normal'}</span></td>
        <td><span class="status-badge ${q.production?.productionStatus?.toLowerCase().replace(' ', '-')}">${q.production?.productionStatus || 'Scheduled'}</span></td>
        <td>${q.production?.expectedStartDate ? formatDate(q.production.expectedStartDate) : '—'}</td>
        <td>${q.production?.expectedFinishDate ? formatDate(q.production.expectedFinishDate) : '—'}</td>
        <td>${q.production?.queueWaiting || 0}</td>
        <td style="font-weight:700; color:var(--primary)">${q.production?.finalCommitment || 0} Days</td>
        <td class="actions-col">
          <button class="action-btn action-btn--edit" data-action="open-prod-quote" data-id="${q.id}" title="Edit Order Status">✏️</button>
        </td>
      </tr>`).join('');

  tbody.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const quote = sortedQueue.find(q => q.id === id);
    if (btn.dataset.action === 'open-prod-quote' && quote) {
      if (!quote.production) {
         updateQuoteFields(quote.id, { status: 'Confirmed' }).then(() => {
             showToast('Migrated order to ERP production engine.');
             renderProductionDashboard();
         });
      } else {
         openQuoteEditModal(quote); // Use existing edit modal which now has status fields
      }
    }
  };

  // Bind filter events if not already bound
  if (!searchEl.dataset.bound) {
    searchEl.dataset.bound = "true";
    searchEl.addEventListener('input', () => renderProductionQueue(confirmedOrders));
    prioEl.addEventListener('change', () => renderProductionQueue(confirmedOrders));
    statEl.addEventListener('change', () => renderProductionQueue(confirmedOrders));
  }
}

async function handleManualReorder(sortedQueue, draggedIdx, dropIdx) {
  // Move item in array
  const item = sortedQueue.splice(draggedIdx, 1)[0];
  sortedQueue.splice(dropIdx, 0, item);
  
  // Assign manualSortIndex sequentially
  for (let i = 0; i < sortedQueue.length; i++) {
    const q = sortedQueue[i];
    q.production.manualSortIndex = i;
    
    // Audit Log
    if (!q.production.auditLog) q.production.auditLog = [];
    q.production.auditLog.push({
      action: 'Manual Sort Reorder',
      timestamp: new Date().toISOString(),
      details: `Reordered to position ${i}`
    });
    
    await db_quotes.put(q);
  }
  
  showToast('Queue successfully reordered. Recalculating timeline...');
  await recalculateProductionQueue();
  renderProductionDashboard();
}

// ── Run ────────────────────────────────────────────────────
init();
