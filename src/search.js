import { db_products } from './db.js';
import { formatCurrency } from './utils/calc.js';

let products = [];
let currentIndex = -1;
let currentResults = [];

// Highlight utility
function highlightMatch(text, terms) {
  if (!text) return '';
  let highlighted = text;
  terms.forEach(term => {
    if (!term) return;
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="search-highlight">$1</mark>');
  });
  return highlighted;
}

export async function initGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const dropdown = document.getElementById('global-search-dropdown');
  const clearBtn = document.getElementById('global-search-clear');
  const overlay = document.getElementById('quickview-modal-overlay');
  
  const qvTier = document.getElementById('quickview-tier');
  const qvSameQty = document.getElementById('qv-same-qty');
  const qvQtyInputs = ['xs', 's', 'm', 'l', 'xl', '2xl'].map(s => document.getElementById(`qv-qty-${s}`));
  
  if (!input || !dropdown) return;

  // Load products once
  products = await db_products.getAll();

  // Handle global "/" shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });

  // Debounce setup
  let timeout;
  
  input.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      performSearch(val);
    }, 250); // 250ms debounce
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (dropdown.classList.contains('hidden')) return;
    const items = dropdown.querySelectorAll('.search-dropdown-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIndex >= 0 && currentIndex < items.length) {
        items[currentIndex].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      input.blur();
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
  
  input.addEventListener('focus', () => {
    if (overlay) overlay.classList.add('hidden');
    
    if (input.value.trim().length > 0 && currentResults.length > 0) {
      dropdown.classList.remove('hidden');
    }
  });

  // Close modal logic
  document.getElementById('quickview-cancel')?.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  // Dynamic Price Update on Tier Change
  qvTier?.addEventListener('change', updateQuickViewPrice);

  // Same Qty Logic
  qvSameQty?.addEventListener('change', (e) => {
    if (e.target.checked && qvQtyInputs[0]) {
      const val = qvQtyInputs[0].value;
      qvQtyInputs.forEach(el => { if(el) el.value = val; });
    }
  });

  qvQtyInputs[0]?.addEventListener('input', (e) => {
    if (qvSameQty?.checked) {
      const val = e.target.value;
      qvQtyInputs.forEach(el => { if(el) el.value = val; });
    }
  });
  
  // Add to Order from Modal
  document.getElementById('quickview-add')?.addEventListener('click', () => {
    if (activeQuickViewProduct) {
      const tier = qvTier?.value || 'wholesale50';
      const sizes = {
        xs: parseInt(qvQtyInputs[0]?.value) || 0,
        s: parseInt(qvQtyInputs[1]?.value) || 0,
        m: parseInt(qvQtyInputs[2]?.value) || 0,
        l: parseInt(qvQtyInputs[3]?.value) || 0,
        xl: parseInt(qvQtyInputs[4]?.value) || 0,
        xxl: parseInt(qvQtyInputs[5]?.value) || 0,
      };
      const detail = { product: activeQuickViewProduct, tier, sizes };
      document.dispatchEvent(new CustomEvent('search:add-to-order', { detail }));
      overlay.classList.add('hidden');
      
      input.value = '';
      clearBtn.classList.add('hidden');
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
    }
  });
}

function updateActiveItem(items) {
  items.forEach((item, idx) => {
    if (idx === currentIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function performSearch(query) {
  const terms = query.toLowerCase().split(/[\s,]+/).filter(t => t);
  if (terms.length === 0) return;

  const results = products.filter(p => {
    // All terms must match at least one field (AND logic for terms)
    return terms.every(term => {
      return (p.productName || '').toLowerCase().includes(term) ||
             (p.styleCode || '').toLowerCase().includes(term) ||
             (p.design || '').toLowerCase().includes(term) ||
             (p.colour || '').toLowerCase().includes(term);
    });
  }).slice(0, 10); // Top 10 matches

  currentResults = results;
  currentIndex = -1;
  renderDropdown(results, terms);
}

function renderDropdown(results, terms) {
  const dropdown = document.getElementById('global-search-dropdown');
  if (results.length === 0) {
    dropdown.innerHTML = '<div style="padding: 12px; color: var(--text-muted); text-align: center;">No products found.</div>';
    dropdown.classList.remove('hidden');
    return;
  }

  dropdown.innerHTML = results.map((p, idx) => {
    const hlName = highlightMatch(p.productName, terms);
    const hlStyle = highlightMatch(p.styleCode, terms);
    const hlDesign = highlightMatch(p.design, terms);
    const hlColour = highlightMatch(p.colour, terms);
    
    const imgSrc = p.image ? `<img src="${p.image}" class="search-dropdown-img">` : `<div class="search-dropdown-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa">No Img</div>`;
    
    return `
      <div class="search-dropdown-item" data-id="${p.id}" tabindex="0">
        ${imgSrc}
        <div class="search-dropdown-details">
          <div class="search-dropdown-title">${hlName || 'Unknown Product'}</div>
          <div class="search-dropdown-meta">
            ${hlStyle ? `Style: ${hlStyle}` : ''} 
            ${hlDesign ? `| Design: ${hlDesign}` : ''} 
            ${hlColour ? `| Colour: ${hlColour}` : ''}
          </div>
          <div class="search-dropdown-meta" style="color: var(--accent-gold); margin-top:2px;">
            $${parseFloat(p.wholesale50 || 0).toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  dropdown.classList.remove('hidden');

  // Attach click events
  dropdown.querySelectorAll('.search-dropdown-item').forEach((el, idx) => {
    el.addEventListener('click', (e) => {
      const prod = results[idx];
      dropdown.classList.add('hidden');
      
      if (e.shiftKey) {
        // Shift+Click => Add directly with default tier and 0 sizes
        const defaultSizes = {xs:0, s:0, m:0, l:0, xl:0, xxl:0};
        document.dispatchEvent(new CustomEvent('search:add-to-order', { 
          detail: { product: prod, tier: 'wholesale50', sizes: defaultSizes }
        }));
        
        dropdown.innerHTML = '';
        const inputEl = document.getElementById('global-search-input');
        const clearBtnEl = document.getElementById('global-search-clear');
        if (inputEl) inputEl.value = '';
        if (clearBtnEl) clearBtnEl.classList.add('hidden');
      } else {
        // Click => Open Modal
        openQuickViewModal(prod);
      }
    });
  });
}

let activeQuickViewProduct = null;

function updateQuickViewPrice() {
  if (!activeQuickViewProduct) return;
  const tierVal = document.getElementById('quickview-tier')?.value || 'wholesale50';
  let price = 0;
  if (tierVal === 'wholesale50') price = activeQuickViewProduct.wholesale50 || 0;
  if (tierVal === 'wholesale40') price = activeQuickViewProduct.wholesale40 || 0;
  if (tierVal === 'wholesale30') price = activeQuickViewProduct.wholesale30 || 0;
  
  const priceEl = document.getElementById('qv-price-display');
  if (priceEl) priceEl.innerText = `$${parseFloat(price).toFixed(2)}`;
}

function openQuickViewModal(prod) {
  const overlay = document.getElementById('quickview-modal-overlay');
  const content = document.getElementById('quickview-content');
  activeQuickViewProduct = prod;

  // Reset inputs
  ['xs', 's', 'm', 'l', 'xl', '2xl'].forEach(s => {
    const el = document.getElementById(`qv-qty-${s}`);
    if (el) el.value = 0;
  });
  const sameQty = document.getElementById('qv-same-qty');
  if (sameQty) sameQty.checked = false;
  const tierSelect = document.getElementById('quickview-tier');
  if (tierSelect) tierSelect.value = 'wholesale50';

  const imgSrc = prod.image ? `<img id="quickview-img" src="${prod.image}">` : `<div id="quickview-img" style="display:flex;align-items:center;justify-content:center;color:#666;">No Image</div>`;
  
  content.innerHTML = `
    ${imgSrc}
    <div style="flex: 1; color: var(--text-primary); font-size: 0.95rem;">
      <div style="font-size: 1.2rem; font-weight: 600; color: var(--accent-gold); margin-bottom: 8px;">${prod.productName || 'Unknown'}</div>
      <div style="margin-bottom: 4px;"><strong>Style Code:</strong> ${prod.styleCode || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Design:</strong> ${prod.design || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Colour:</strong> ${prod.colour || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Category:</strong> ${prod.category || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Fabric:</strong> ${prod.fabric || 'N/A'}</div>
      <div style="margin-bottom: 12px; font-size: 1.1rem; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
        <strong>Selling Price:</strong> <span style="color: var(--text-primary); font-weight:600; margin-right:1rem;">$${parseFloat(prod.retailPrice || 0).toFixed(2)}</span>
        <strong>Wholesale Price:</strong> <span id="qv-price-display" style="color: var(--accent-gold); font-weight:600;">$0.00</span>
      </div>
    </div>
  `;

  updateQuickViewPrice();

  overlay.classList.remove('hidden');
}

// Global hook to access the selected product from main.js
export function getActiveQuickViewProduct() {
  return activeQuickViewProduct;
}
