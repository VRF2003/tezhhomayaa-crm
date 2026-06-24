<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Tezhhomayaa" />
    <meta name="application-name" content="Tezhhomayaa" />
    <meta name="theme-color" content="#c5a059" />
    <meta name="description" content="B2B Wholesale CRM — Tezhhomayaa Malaysia Fashion Show 2026" />
    <meta name="msapplication-TileColor" content="#080808" />
    <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
    <link rel="manifest" href="/manifest.json" />
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>Tezhhomayaa Wholesale CRM</title>
    <script type="module" crossorigin src="/assets/index-CLMifuLU.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-CLmb_YA_.css">
  </head>
  <body>

    <!-- Toast Notification -->
    <div id="toast" class="toast" role="alert" aria-live="polite"></div>

    <div id="app" class="app-container">

      <!-- ── Sidebar ─────────────────────────────────── -->
      <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-mobile-header" style="display:none; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
          <h3 style="font-family: var(--font-heading); color: var(--text-primary); font-size: 1.1rem;">Menu</h3>
          <button id="sidebar-close-btn" class="icon-btn" aria-label="Close Menu">✕</button>
        </div>
        <div class="brand">
          <img src="/logo.png" alt="Tezhhomayaa" style="max-height: 40px; width: auto; max-width: 100%; object-fit: contain;">
        </div>
        <ul class="nav-menu">
          <li><a class="nav-link" data-target="dashboard-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </a></li>
          <li><a class="nav-link" data-target="search-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Product Search
          </a></li>
          <li><a class="nav-link" data-target="builder-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            Order Builder
            <span id="builder-nav-badge" class="nav-badge hidden">0</span>
          </a></li>
          <li><a class="nav-link" data-target="quote-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Buyer Quote
          </a></li>

          <li class="nav-section-label">CRM</li>

          <li><a class="nav-link" data-target="buyers-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Buyers
          </a></li>
          <li><a class="nav-link" data-target="orders-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
            Orders
          </a></li>
          <li><a class="nav-link" data-target="archived-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="5" rx="2"/><path d="M4 9v9a2 2 0 002 2h12a2 2 0 002-2V9"/><path d="M10 13h4"/></svg>
            Archived Orders
          </a></li>
          <li><a class="nav-link" data-target="reports-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Reports
          </a></li>
          <li><a class="nav-link" data-target="settings-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings (Admin)
          </a></li>
        </ul>

        <div class="sidebar-footer">
          <div class="currency-selector">
            <label for="global-currency">Currency</label>
            <select id="global-currency">
              <option value="USD">USD ($)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="INR">INR (₹)</option>
              <option value="MYR">MYR (RM)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </aside>

      <!-- ── Main Content ────────────────────────────── -->
      <main class="main-content">
        <header class="header">
          <div>
            <h2 id="view-title">Dashboard</h2>
            <p id="view-subtitle" class="view-subtitle"></p>
          </div>
          <div class="header-actions" id="header-actions"></div>
        </header>

        <!-- ══ DASHBOARD VIEW ══════════════════════════ -->
        <section id="dashboard-view" class="view active">

          <div class="stat-grid" id="stat-grid">
            <div class="stat-card">
              <div class="stat-icon stat-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div class="stat-body">
                <div class="stat-label">Total Buyers</div>
                <div class="stat-value" id="stat-buyers">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon--gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div class="stat-body">
                <div class="stat-label">Total Quotes</div>
                <div class="stat-value" id="stat-quotes">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon--green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div class="stat-body">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value currency" id="stat-revenue">$0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon--purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <div class="stat-body">
                <div class="stat-label">Total Profit</div>
                <div class="stat-value currency" id="stat-profit">$0</div>
              </div>
            </div>
          </div>

          <!-- Quick Access Buttons -->
          <div class="dash-quick-actions" style="margin-bottom:var(--spacing-xl)">
            <button class="quick-btn" data-target="search-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Product Search
            </button>
            <button class="quick-btn" data-target="builder-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
              Order Builder
            </button>
            <button class="quick-btn" data-target="quote-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Buyer Quote
            </button>
            <button class="quick-btn" data-target="orders-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              CRM Orders
            </button>
            <button class="quick-btn" data-target="reports-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Reports
            </button>
          </div>

          <div class="dashboard-grid">
            <!-- Recent Quotes -->
            <div class="dash-panel">
              <h3 class="dash-panel-title">Recent Quotes</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead><tr><th>Quote #</th><th>Buyer</th><th>Country</th><th>Date</th><th>Total</th></tr></thead>
                  <tbody id="dash-recent-quotes"><tr><td colspan="5" class="empty-state">No quotes yet</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Top Products -->
            <div class="dash-panel">
              <h3 class="dash-panel-title">Top Products</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead><tr><th>Product</th><th>Revenue</th><th>Units</th></tr></thead>
                  <tbody id="dash-top-products"><tr><td colspan="3" class="empty-state">No data yet</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Top Countries -->
            <div class="dash-panel">
              <h3 class="dash-panel-title">Top Countries</h3>
              <div id="dash-countries-chart" class="countries-chart"></div>
            </div>

            <!-- Margin Overview -->
            <div class="dash-panel">
              <h3 class="dash-panel-title">Financials Overview</h3>
              <div id="dash-financials" class="financials-grid">
                <div class="fin-row"><span class="fin-label">Total Cost</span><span class="fin-val currency" id="dash-cost">$0</span></div>
                <div class="fin-row"><span class="fin-label">Total Revenue</span><span class="fin-val currency" id="dash-revenue2">$0</span></div>
                <div class="fin-row fin-row--highlight"><span class="fin-label">Total Profit</span><span class="fin-val currency" id="dash-profit2">$0</span></div>
                <div class="fin-row fin-row--highlight"><span class="fin-label">Overall Margin</span><span class="fin-val" id="dash-margin">0%</span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ PRODUCT SEARCH VIEW ═════════════════════ -->
        <section id="search-view" class="view">
          <div class="filters-bar">
            <div class="filter-group">
              <label>Search</label>
              <input type="text" id="search-input" placeholder="Product or style code...">
            </div>
            <div class="filter-group">
              <label>Category</label>
              <select id="filter-category"><option value="">All</option></select>
            </div>
            <div class="filter-group">
              <label>Design</label>
              <select id="filter-design"><option value="">All</option></select>
            </div>
            <div class="filter-group">
              <label>Colour</label>
              <select id="filter-colour"><option value="">All</option></select>
            </div>
            <div class="filter-group">
              <label>Style Code</label>
              <select id="filter-stylecode"><option value="">All</option></select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;">
            <button id="add-product-btn" class="primary-btn" style="background:var(--accent-gold); color:var(--bg-dark); border-color:var(--accent-gold);">+ Add Product</button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>Product</th><th>Design</th><th>Colour</th><th>Style Code</th>
                <th>Category</th><th>Fabric</th><th>Cost</th><th>Final Cost</th>
                <th>Retail</th><th>WS 50</th><th>WS 40</th><th>WS 30</th>
                <th>Status</th><th>MOQ</th><th class="actions-col">Actions</th>
              </tr></thead>
              <tbody id="product-table-body"></tbody>
            </table>
          </div>
        </section>

        <!-- ══ ORDER BUILDER VIEW ══════════════════════ -->
        <section id="builder-view" class="view">
          <div class="order-builder-form">
            <h3>Add Items to Order</h3>
            <br>
            <div class="form-group">
              <div class="filter-group" style="flex:1">
                <label>1. Select Product</label>
                <select id="builder-cat-product"><option value="">Select Product...</option></select>
              </div>
              <div class="filter-group" style="flex:1">
                <label>2. Select Design</label>
                <select id="builder-cat-design" disabled><option value="">Select Design...</option></select>
              </div>
              <div class="filter-group" style="flex:1">
                <label>3. Select Colour</label>
                <select id="builder-cat-colour" disabled><option value="">Select Colour...</option></select>
              </div>
            </div>

            <div class="costing-panel">
              <div class="costing-section">
                <h4 class="panel-section-title gold">Product Specifications &amp; Costing</h4>
                <div class="costing-grid costing-grid--3">
                  <div><label>Style Code</label><div id="info-stylecode" class="info-value">—</div></div>
                  <div><label>Fabric</label><div id="info-fabric" class="info-value">—</div></div>
                  <div><label>Costing With Admin</label><div id="info-cost" class="info-value currency">—</div></div>
                  <div><label>Final Cost (Logistics)</label><div id="info-finalcost" class="info-value currency">—</div></div>
                  <div><label>Retail Price</label><div id="info-retail" class="info-value currency">—</div></div>
                  <div><label>Selected Wholesale Price</label><div id="info-selected-ws" class="info-value currency gold-text large">—</div></div>
                </div>
              </div>
              <div class="costing-section">
                <h4 class="panel-section-title blue">Margin Analysis (Per Unit)</h4>
                <div class="costing-grid costing-grid--2">
                  <div><label>Profit Per Unit</label><div id="info-profit" class="info-value currency green-text large">—</div></div>
                  <div><label>Margin %</label><div id="info-margin" class="info-value green-text large">—</div></div>
                </div>
              </div>
            </div>

            <div class="form-group" style="align-items:flex-end; margin-top:1rem">
              <div class="filter-group">
                <label>4. Wholesale Tier</label>
                <select id="builder-tier" disabled>
                  <option value="wholesale50">Wholesale 50</option>
                  <option value="wholesale40">Wholesale 40</option>
                  <option value="wholesale30">Wholesale 30</option>
                </select>
              </div>
              <div class="filter-group">
                <label>5. Size Matrix</label>
                <!-- LIVE MOQ PANEL -->
                <div id="live-moq-panel" style="display:none; background:rgba(255,255,255,0.03); padding:12px; border-radius:var(--radius-sm); margin-bottom:15px; border-left:4px solid var(--accent-gold);">
                </div>

                <div class="size-matrix-container">
                  <div class="size-matrix">
                    <div class="size-matrix-col"><label>XS</label><input type="number" id="builder-qty-xs" min="0" value="0" disabled></div>
                    <div class="size-matrix-col"><label>S</label><input type="number" id="builder-qty-s" min="0" value="0" disabled></div>
                    <div class="size-matrix-col"><label>M</label><input type="number" id="builder-qty-m" min="0" value="0" disabled></div>
                    <div class="size-matrix-col"><label>L</label><input type="number" id="builder-qty-l" min="0" value="0" disabled></div>
                    <div class="size-matrix-col"><label>XL</label><input type="number" id="builder-qty-xl" min="0" value="0" disabled></div>
                    <div class="size-matrix-col"><label>2XL</label><input type="number" id="builder-qty-2xl" min="0" value="0" disabled></div>
                  </div>
                  <label class="same-qty-check">
                    <input type="checkbox" id="builder-same-qty" disabled> Same Quantity For All Sizes
                  </label>
                </div>
              </div>
              <div class="filter-group" style="flex-grow:1; align-items:flex-end">
                <button id="builder-add-btn" class="primary-btn" disabled>+ Add to Order</button>
              </div>
            </div>
          </div>

          <div class="clear-all-bar">
            <button id="builder-clear-all" class="clear-all-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Clear All
            </button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>#</th><th>Product</th><th>Design</th><th>Colour</th><th>Tier</th>
                <th class="internal-col">Cost</th><th>Selling Price</th><th>Size Breakdown</th><th>Total Qty</th>
                <th>Line Total</th><th class="internal-col">Profit</th><th class="internal-col">Profit %</th>
                <th class="actions-col internal-col">Actions</th>
              </tr></thead>
              <tbody id="builder-table-body"></tbody>
            </table>
          </div>
          <div class="summary-panel">
            <div style="text-align:right">
              <span style="color:var(--text-secondary); margin-right:1rem">Total Order Value:</span>
              <span id="builder-total" class="summary-total">$0.00</span>
            </div>
          </div>
          
          <div id="builder-moq-status" class="dash-panel" style="margin-top:15px; display:none;">
            <h3 class="dash-panel-title">Silhouette MOQ Progress</h3>
            <div id="builder-moq-cards" class="moq-cards-grid"></div>
          </div>
        </section>

        <!-- ══ EDIT ITEM MODAL ══════════════════════════ -->
        <div id="edit-modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div class="modal-box">
            <div class="modal-header">
              <h3 id="edit-modal-title">Edit Order Item</h3>
              <button id="edit-modal-close" class="icon-btn" aria-label="Close">✕</button>
            </div>
            <div class="modal-body">
              <div class="modal-row">
                <div class="filter-group" style="flex:1">
                  <label>Product</label>
                  <select id="edit-product"><option value="">Select...</option></select>
                </div>
                <div class="filter-group" style="flex:1">
                  <label>Design</label>
                  <select id="edit-design" disabled><option value="">Select...</option></select>
                </div>
                <div class="filter-group" style="flex:1">
                  <label>Colour</label>
                  <select id="edit-colour" disabled><option value="">Select...</option></select>
                </div>
              </div>
              <div class="modal-row">
                <div class="filter-group">
                  <label>Wholesale Tier</label>
                  <select id="edit-tier">
                    <option value="wholesale50">Wholesale 50</option>
                    <option value="wholesale40">Wholesale 40</option>
                    <option value="wholesale30">Wholesale 30</option>
                  </select>
                </div>
                <div class="filter-group">
                  <label>Size Matrix</label>
                  <div class="size-matrix-container">
                    <div class="size-matrix">
                      <div class="size-matrix-col"><label>XS</label><input type="number" id="edit-qty-xs" min="0" value="0"></div>
                      <div class="size-matrix-col"><label>S</label><input type="number" id="edit-qty-s" min="0" value="0"></div>
                      <div class="size-matrix-col"><label>M</label><input type="number" id="edit-qty-m" min="0" value="0"></div>
                      <div class="size-matrix-col"><label>L</label><input type="number" id="edit-qty-l" min="0" value="0"></div>
                      <div class="size-matrix-col"><label>XL</label><input type="number" id="edit-qty-xl" min="0" value="0"></div>
                      <div class="size-matrix-col"><label>2XL</label><input type="number" id="edit-qty-2xl" min="0" value="0"></div>
                    </div>
                    <label class="same-qty-check">
                      <input type="checkbox" id="edit-same-qty"> Same Quantity For All Sizes
                    </label>
                  </div>
                </div>
                <div class="filter-group" style="flex:1">
                  <label>Unit Price (preview)</label>
                  <div id="edit-unit-price-preview" style="padding-top:8px; font-family:monospace; color:var(--accent-gold)">—</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="edit-modal-cancel" class="secondary-btn">Cancel</button>
              <button id="edit-modal-save" class="primary-btn">Save Changes</button>
            </div>
          </div>
        </div>

        <!-- ══ DELETE CONFIRM MODAL ═════════════════════ -->
        <div id="delete-modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div class="modal-box modal-box--sm">
            <div class="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div class="modal-body">
              <p id="delete-modal-msg" style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6"></p>
            </div>
            <div class="modal-footer">
              <button id="delete-modal-cancel" class="secondary-btn">Cancel</button>
              <button id="delete-modal-confirm" class="primary-btn" style="background:#e04040">Delete</button>
            </div>
          </div>
        </div>

        <!-- ══ BUYER QUOTE VIEW ════════════════════════ -->
        <section id="quote-view" class="view">
          <div class="quote-grid">
            <div class="quote-buyer-info">
              <h3 style="margin-bottom:1rem">Buyer Details</h3>
              <div class="filter-group"><label>Buyer Name <span style="color:#e04040">*</span></label><input type="text" id="quote-name" placeholder="John Doe"></div>
              <div class="filter-group"><label>Company <span style="color:#e04040">*</span></label><input type="text" id="quote-company" placeholder="Aurelia Boutiques"></div>
              <div class="filter-group"><label>Country <span style="color:#e04040">*</span></label><input type="text" id="quote-country" placeholder="Malaysia"></div>
              <div class="filter-group"><label>Mobile Number <span style="color:#e04040">*</span></label><input type="tel" id="quote-mobile" placeholder="+1 234 567 8900"></div>
              <div class="filter-group"><label>Email Address <span style="color:#e04040">*</span></label><input type="email" id="quote-email" placeholder="john@example.com"></div>
              <div class="filter-group"><label>WhatsApp Number</label><input type="tel" id="quote-whatsapp" placeholder="+1 234 567 8900"></div>
              <div class="filter-group"><label>Payment Terms</label><input type="text" id="quote-payment-terms" placeholder="e.g. 50% Advance"></div>
              <div class="filter-group">
                <label>Buyer Type</label>
                <select id="quote-buyer-type">
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Online Store">Online Store</option>
                  <option value="Chain Store">Chain Store</option>
                  <option value="Boutique">Boutique</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Quote Status</label>
                <select id="quote-status">
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <br>
              <button id="save-quote-btn" class="primary-btn" style="width:100%">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Quote to CRM
              </button>
              <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
                <button id="print-client-btn" class="print-btn" style="flex:1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Client PDF
                </button>
                <button id="print-internal-btn" class="print-btn" style="flex:1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Internal PDF
                </button>
              </div>
              <p id="quote-save-hint" class="save-hint">Add buyer name &amp; at least one item to save.</p>
            </div>

            <div class="quote-document">
              <div class="quote-doc-inner">
                <div class="quote-doc-header">
                  <h2 class="gold-text">Formal Quotation</h2>
                  <p id="doc-buyer-info" style="color:var(--text-secondary); font-size:0.85rem">Please enter buyer details.</p>
                </div>
                <div class="table-container">
                  <table class="data-table">
                    <thead><tr>
                      <th>Product</th><th>Style Code</th><th>Tier</th>
                      <th class="internal-col">Cost</th><th>Unit Price</th>
                      <th>Size Breakdown</th><th>Total Qty</th>
                      <th>Line Total</th>
                      <th class="internal-col">Profit</th><th class="internal-col">Margin %</th>
                    </tr></thead>
                    <tbody id="quote-table-body"></tbody>
                  </table>
                </div>
                <div class="summary-panel" style="flex-direction:column; align-items:flex-end; gap:0.5rem; margin-top:2rem">
                  <div class="summary-row"><span>Items:</span><span id="quote-item-count" style="font-weight:500">0</span></div>
                  <div class="summary-row internal-col"><span>Total Cost:</span><span id="quote-total-cost" class="currency" style="font-weight:500">$0.00</span></div>
                  <div class="summary-row"><span title="Calculated as max(ceil(qty/100 * leadTime)) across all products">Est. Delivery (Days):</span><span id="quote-calc-delivery" style="font-weight:500">0</span></div>
                  <div class="summary-row"><span title="Override calculated delivery timeline">Override Delivery (Days):</span><input type="number" id="quote-override-delivery" style="width:60px; padding:2px; text-align:right;"></div>
                  <div class="summary-row"><span>Total Selling Value:</span><span id="quote-total-selling" class="currency" style="font-weight:500">$0.00</span></div>
                  <div class="summary-row green-text internal-col"><span>Total Profit:</span><span id="quote-total-profit" class="currency" style="font-weight:500">$0.00</span></div>
                  <div class="summary-row green-text internal-col"><span>Overall Margin %:</span><span id="quote-overall-margin" style="font-weight:500">0.00%</span></div>
                  <div class="summary-row summary-row--total">
                    <span>Grand Total:</span>
                    <span id="quote-grand-total" class="summary-total">$0.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ BUYERS VIEW ═════════════════════════════ -->
        <section id="buyers-view" class="view">
          <div class="filters-bar">
            <div class="filter-group">
              <label>Search Buyer</label>
              <input type="text" id="buyers-search" placeholder="Name, company, email, phone...">
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>Buyer Name</th><th>Company</th><th>Country</th>
                <th>Quotes</th><th>Total Revenue</th><th>Total Profit</th>
                <th>First Seen</th><th>Last Seen</th><th class="actions-col">Actions</th>
              </tr></thead>
              <tbody id="buyers-table-body"><tr><td colspan="9" class="empty-state">No buyers yet. Save a quote to add buyers.</td></tr></tbody>
            </table>
          </div>

          <!-- Buyer History Drawer -->
          <div id="buyer-drawer" class="buyer-drawer hidden">
            <div class="drawer-header">
              <h3 id="drawer-buyer-name">Buyer History</h3>
              <button id="drawer-close" class="icon-btn" aria-label="Close">✕</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead><tr><th>Quote #</th><th>Date</th><th>Items</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr></thead>
                <tbody id="drawer-quotes-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ══ ORDERS VIEW ═════════════════════════════ -->
        <section id="orders-view" class="view">
          <div class="filters-bar">
            <div class="filter-group">
              <label>Search Buyer</label>
              <input type="text" id="orders-search" placeholder="Buyer name...">
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>Quote #</th><th>Date</th><th>Buyer</th><th>Company</th>
                <th>Country</th><th>Status</th><th>Items</th><th>Revenue</th><th>Cost</th>
                <th>Profit</th><th>Margin %</th><th class="actions-col">Actions</th>
              </tr></thead>
              <tbody id="orders-table-body"><tr><td colspan="12" class="empty-state">No orders yet. Save a quote to get started.</td></tr></tbody>
            </table>
          </div>

          <!-- Order expand drawer -->
          <div id="order-drawer" class="buyer-drawer hidden">
            <div class="drawer-header">
              <div style="display:flex; flex-direction:column; gap:4px">
                <h3 id="order-drawer-title">Order Details</h3>
                <div style="display:flex; gap:8px; flex-wrap:wrap">
                  <button id="order-load-builder-btn" class="load-builder-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                    Load into Builder
                  </button>
                  <button class="load-builder-btn" onclick="printSavedQuote(currentOrderDrawerQuote, 'client')">Download Client PDF</button>
                  <button class="load-builder-btn" onclick="printSavedQuote(currentOrderDrawerQuote, 'internal')">Download Internal PDF</button>
                  <button class="load-builder-btn" id="order-sync-gsheet-btn" style="color:var(--accent-green); border-color:var(--accent-green)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Sync to Sheets
                  </button>
                </div>
              </div>
              <button id="order-drawer-close" class="icon-btn" aria-label="Close">✕</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead><tr><th>Product</th><th>Style Code</th><th>Tier</th><th class="internal-col">Cost</th><th>Unit Price</th><th>Size Breakdown</th><th>Total Qty</th><th>Line Total</th><th class="internal-col">Profit</th></tr></thead>
                <tbody id="order-drawer-items"></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ══ ARCHIVED VIEW ═══════════════════════════ -->
        <section id="archived-view" class="view">
          <div class="table-container">
            <table class="data-table">
              <thead><tr>
                <th>Order #</th><th>Date</th><th>Buyer Name</th><th>Company</th><th>Country</th><th>Status</th>
                <th>Lines</th><th>Total Qty</th><th>Value</th><th class="actions-col">Actions</th>
              </tr></thead>
              <tbody id="archived-table-body"><tr><td colspan="10" class="empty-state">No archived orders.</td></tr></tbody>
            </table>
          </div>
        </section>

        <!-- ══ REPORTS VIEW ════════════════════════════ -->
        <section id="reports-view" class="view">
          <div class="reports-grid">
            <div class="dash-panel">
              <h3 class="dash-panel-title">Top Products by Revenue</h3>
              <div id="reports-products-chart" class="bar-chart-container"></div>
            </div>
            <div class="dash-panel">
              <h3 class="dash-panel-title">Revenue by Country</h3>
              <div id="reports-countries-chart" class="bar-chart-container"></div>
            </div>
            <div class="dash-panel" style="grid-column: 1 / -1">
              <h3 class="dash-panel-title">All-Time Financial Summary</h3>
              <div id="reports-financials" class="reports-fin-grid"></div>
            </div>
          </div>
        </section>

        <!-- ══ SETTINGS VIEW (PDF Designer) ═════════════ -->
        <section id="settings-view" class="view">
          <div class="settings-grid">
            
            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">PDF Themes</h3>
              <div class="filter-group">
                <label>Select Luxury Theme</label>
                <select id="set-theme">
                  <option value="luxury-beige">Luxury Beige (Default)</option>
                  <option value="black-gold">Black & Gold</option>
                  <option value="minimal-white">Minimal White</option>
                  <option value="fashion-week">Fashion Week Premium</option>
                  <option value="middle-east">Middle East Luxury</option>
                </select>
              </div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">Branding Assets</h3>
              <div class="filter-group"><label>Company Logo</label><input type="file" id="set-logo" accept="image/*"></div>
              <div class="filter-group"><label>Watermark Logo</label><input type="file" id="set-watermark" accept="image/*"></div>
              <div class="filter-group"><label>Signature Image</label><input type="file" id="set-signature" accept="image/*"></div>
              <div class="filter-group"><label>Company Stamp</label><input type="file" id="set-stamp" accept="image/*"></div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">Company Information</h3>
              <div class="filter-group"><label>Company Name</label><input type="text" id="set-comp-name" placeholder="Tezhhomayaa"></div>
              <div class="filter-group"><label>Tagline</label><input type="text" id="set-tagline" placeholder="Bridge To Luxury"></div>
              <div class="filter-group"><label>Website</label><input type="text" id="set-website" placeholder="www.tezhhomayaa.com"></div>
              <div class="filter-group"><label>Email</label><input type="text" id="set-email" placeholder="sales@tezhhomayaa.com"></div>
              <div class="filter-group"><label>Phone</label><input type="text" id="set-phone" placeholder="+60 123 456 789"></div>
              <div class="filter-group"><label>Address</label><textarea id="set-address" rows="2" placeholder="Malaysia Fashion Show HQ"></textarea></div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">Commercial Terms</h3>
              <div class="filter-group"><label>Global MOQ</label><input type="text" id="set-moq" placeholder="100 pieces per style"></div>
              <div class="filter-group"><label>Payment Terms</label><input type="text" id="set-payment" placeholder="50% Advance, 50% Before Shipment"></div>
              <div class="filter-group"><label>Delivery Timeline</label><input type="text" id="set-delivery" placeholder="45-60 Days"></div>
              <div class="filter-group"><label>Shipping Terms</label><input type="text" id="set-shipping" placeholder="FOB Malaysia"></div>
              <div class="filter-group"><label>Validity Period</label><input type="text" id="set-validity" placeholder="30 Days"></div>
              <div class="filter-group"><label>PDF Delivery Buffer (Days)</label><input type="number" id="set-delivery-buffer" placeholder="3" min="0"></div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">Silhouette Rules (MOQ & Lead Time)</h3>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem">Define required MOQs and "Lead Time per 100 pcs" per Silhouette. These automatically apply to products in the Order Builder.</p>
              <div id="moq-list-container" style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px; max-height:200px; overflow-y:auto;">
                <!-- Dynamically populated Silhouette rows -->
              </div>
              <div class="filter-group" style="display:flex; flex-direction:row; gap:10px">
                <input type="text" id="new-moq-silhouette" placeholder="Enter or select Silhouette..." list="settings-sil-list" style="flex:2">
                <datalist id="settings-sil-list"></datalist>
                <input type="number" id="new-moq-qty" placeholder="MOQ" style="flex:1" title="Minimum Order Qty">
                <input type="number" id="new-sil-leadtime" placeholder="Lead Time" style="flex:1" title="Lead Time per 100 pcs (days)">
                <button id="add-moq-btn" class="secondary-btn">Add</button>
              </div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title">PDF Options</h3>
              <div class="filter-group" style="flex-direction:row; justify-content:space-between">
                <label>Show Product Images</label>
                <input type="checkbox" id="set-opt-images" checked>
              </div>
              <div class="filter-group" style="flex-direction:row; justify-content:space-between">
                <label>Show QR Code</label>
                <input type="checkbox" id="set-opt-qr" checked>
              </div>
              <div class="filter-group" style="flex-direction:row; justify-content:space-between">
                <label>Show Watermark</label>
                <input type="checkbox" id="set-opt-watermark" checked>
              </div>
              <div class="filter-group" style="flex-direction:row; justify-content:space-between">
                <label>Hide Margin & Profit</label>
                <input type="checkbox" id="set-opt-hide-margin">
              </div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title" style="color:var(--accent-green)">Google Sheets Integration</h3>
              <div class="filter-group">
                <label>Google Apps Script Web App URL</label>
                <input type="text" id="set-gsheet-url" placeholder="https://script.google.com/macros/s/.../exec">
                <small style="color:var(--text-secondary); margin-top:4px">Paste the published Web App URL from your Google Sheet script.</small>
              </div>
              <div class="filter-group" style="flex-direction:row; justify-content:space-between; align-items:center; margin-top:1rem">
                <label>Auto-sync on save</label>
                <input type="checkbox" id="set-gsheet-autosync" checked>
              </div>
              <div class="filter-group" style="margin-top:1rem">
                <button id="test-gsheet-btn" class="secondary-btn" style="width:100%; padding:10px">Test Connection</button>
              </div>
            </div>

            <div class="dash-panel settings-panel">
              <h3 class="dash-panel-title" style="color:var(--accent-gold)">Database Management</h3>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem">Backup your CRM data locally or restore from a previous backup. The backup includes all quotes, buyers, and settings.</p>
              <div style="display:flex; flex-direction:column; gap:10px">
                <button id="export-db-btn" class="secondary-btn" style="width:100%; padding:10px">Export CRM Backup (JSON)</button>
                <button id="import-db-trigger" class="secondary-btn" style="width:100%; padding:10px; color:var(--accent-gold); border-color:var(--accent-gold)">Import CRM Backup (JSON)</button>
                <input type="file" id="import-db-file" accept=".json" style="display:none">
              </div>
            </div>

            <div class="dash-panel settings-panel" style="grid-column: 1 / -1; display:flex; justify-content:flex-end">
              <button id="save-settings-btn" class="primary-btn" style="min-width:200px; padding:12px; font-size:1.1rem">Save PDF Settings</button>
            </div>

          </div>
        </section>

      </main>
    </div>

    <!-- ══ QUOTE EDIT MODAL (CRM Orders) ═══════════════════════ -->
    <div id="quote-edit-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="qe-modal-title">
      <div class="modal-box modal-box--sm" style="max-width:460px">
        <div class="modal-header">
          <h3 id="qe-modal-title">Edit Quote</h3>
          <button id="qe-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="filter-group"><label>Buyer Name <span style="color:#e04040">*</span></label><input type="text" id="qe-buyer-name" placeholder="Buyer Name"></div>
          <div class="filter-group"><label>Company <span style="color:#e04040">*</span></label><input type="text" id="qe-company" placeholder="Company"></div>
          <div class="filter-group"><label>Country <span style="color:#e04040">*</span></label><input type="text" id="qe-country" placeholder="Country"></div>
          <div class="filter-group"><label>Mobile Number <span style="color:#e04040">*</span></label><input type="tel" id="qe-mobile" placeholder="Mobile Number"></div>
          <div class="filter-group"><label>Email Address <span style="color:#e04040">*</span></label><input type="email" id="qe-email" placeholder="Email Address"></div>
          <div class="filter-group"><label>WhatsApp Number</label><input type="tel" id="qe-whatsapp" placeholder="WhatsApp Number"></div>
          <div class="filter-group">
            <label>Buyer Type</label>
            <select id="qe-buyer-type">
              <option value="Distributor">Distributor</option>
              <option value="Retailer">Retailer</option>
              <option value="Online Store">Online Store</option>
              <option value="Chain Store">Chain Store</option>
              <option value="Boutique">Boutique</option>
              <option value="Corporate">Corporate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select id="qe-status">
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button id="qe-cancel" class="secondary-btn">Cancel</button>
          <button id="qe-save" class="primary-btn">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ══ BUYER EDIT MODAL ════════════════════════════ -->
    <div id="buyer-edit-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="be-modal-title">
      <div class="modal-box modal-box--sm" style="max-width:460px">
        <div class="modal-header">
          <h3 id="be-modal-title">Edit Buyer</h3>
          <button id="be-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="filter-group"><label>Buyer Name <span style="color:#e04040">*</span></label><input type="text" id="be-buyer-name" placeholder="Buyer Name"></div>
          <div class="filter-group"><label>Company <span style="color:#e04040">*</span></label><input type="text" id="be-company" placeholder="Company"></div>
          <div class="filter-group"><label>Country <span style="color:#e04040">*</span></label><input type="text" id="be-country" placeholder="Country"></div>
          <div class="filter-group"><label>Mobile Number <span style="color:#e04040">*</span></label><input type="tel" id="be-mobile" placeholder="Mobile Number"></div>
          <div class="filter-group"><label>Email Address <span style="color:#e04040">*</span></label><input type="email" id="be-email" placeholder="Email Address"></div>
          <div class="filter-group"><label>WhatsApp Number</label><input type="tel" id="be-whatsapp" placeholder="WhatsApp Number"></div>
          <div class="filter-group">
            <label>Buyer Type</label>
            <select id="be-buyer-type">
              <option value="Distributor">Distributor</option>
              <option value="Retailer">Retailer</option>
              <option value="Online Store">Online Store</option>
              <option value="Chain Store">Chain Store</option>
              <option value="Boutique">Boutique</option>
              <option value="Corporate">Corporate</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button id="be-cancel" class="secondary-btn">Cancel</button>
          <button id="be-save" class="primary-btn">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ══ PRODUCT FORM MODAL ══════════════════════════ -->
    <div id="product-form-modal" class="modal-overlay hidden" role="dialog" aria-modal="true">
      <div class="modal-box" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 id="pm-title">Add Product</h3>
          <button id="pm-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
          <input type="hidden" id="pm-id">
          
          <div class="filter-group">
            <label>Product Name <span style="color:#e04040">*</span></label>
            <input type="text" id="pm-name" placeholder="E.g. Luxury Handbag">
          </div>
          <div class="filter-group">
            <label>Category <span style="color:#e04040">*</span></label>
            <input type="text" id="pm-category" placeholder="E.g. Bags">
          </div>
          <div class="filter-group">
            <label>Silhouette</label>
            <input type="text" id="pm-silhouette" placeholder="E.g. A-Line (Leave empty for Uncategorized)" list="pm-sil-list">
            <datalist id="pm-sil-list"></datalist>
          </div>
          <div class="filter-group" style="grid-column: 1 / -1; background: var(--bg-dark); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <label style="margin-bottom: 8px;">Product Rules (MOQ & Lead Time)</label>
            <label style="display:flex; align-items:center; gap:8px; font-weight:normal; margin-bottom: 8px;">
              <input type="checkbox" id="pm-use-silhouette-moq" checked> Use Silhouette Rules
            </label>
            <div id="pm-override-moq-container" style="display:none; grid-template-columns: 1fr 1fr; gap:10px;">
              <div>
                <label style="font-size: 0.8rem; margin-bottom: 4px;">Custom MOQ</label>
                <input type="number" id="pm-override-moq" placeholder="Enter custom MOQ" min="1">
              </div>
              <div>
                <label style="font-size: 0.8rem; margin-bottom: 4px;">Lead Time (per 100pcs)</label>
                <input type="number" id="pm-leadtime" placeholder="Days (e.g. 7)" min="1">
              </div>
            </div>
          </div>
          <div class="filter-group">
            <label>Design <span style="color:#e04040">*</span></label>
            <input type="text" id="pm-design" placeholder="E.g. Classic">
          </div>
          <div class="filter-group">
            <label>Colour <span style="color:#e04040">*</span></label>
            <input type="text" id="pm-colour" placeholder="E.g. Black">
          </div>
          <div class="filter-group">
            <label>Style Code <span style="color:#e04040">*</span></label>
            <input type="text" id="pm-stylecode" placeholder="E.g. BAG-001">
          </div>
          <div class="filter-group">
            <label>Fabric</label>
            <input type="text" id="pm-fabric" placeholder="E.g. Leather">
          </div>
          <div class="filter-group">
            <label>Cost</label>
            <input type="number" step="0.01" id="pm-cost" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>Final Cost</label>
            <input type="number" step="0.01" id="pm-finalcost" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>Retail Price</label>
            <input type="number" step="0.01" id="pm-retail" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>WS 50 Price</label>
            <input type="number" step="0.01" id="pm-ws50" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>WS 40 Price</label>
            <input type="number" step="0.01" id="pm-ws40" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>WS 30 Price</label>
            <input type="number" step="0.01" id="pm-ws30" placeholder="0.00">
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select id="pm-status">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Product Image (Optional)</label>
            <input type="file" id="pm-image" accept="image/*">
            <img id="pm-image-preview" src="" alt="Preview" style="display:none; max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 4px;">
          </div>
        </div>
        <div class="modal-footer">
          <button id="pm-cancel" class="secondary-btn">Cancel</button>
          <button id="pm-save" class="primary-btn">Save Product</button>
        </div>
      </div>
    </div>

    <!-- ══ PRODUCT DELETE MODAL ══════════════════════════ -->
    <div id="product-delete-modal" class="modal-overlay hidden" role="dialog" aria-modal="true">
      <div class="modal-box modal-box--sm">
        <div class="modal-header">
          <h3>Delete Product</h3>
          <button id="pd-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p id="pd-msg" style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6"></p>
        </div>
        <div class="modal-footer" style="flex-wrap:wrap; gap:10px">
          <button id="pd-cancel" class="secondary-btn">Cancel</button>
          <button id="pd-confirm" class="primary-btn" style="background:#e04040">Permanently Delete</button>
        </div>
      </div>
    </div>

    <!-- ══ BUYER DELETE MODAL ══════════════════════════ -->
    <div id="buyer-delete-modal" class="modal-overlay hidden" role="dialog" aria-modal="true">
      <div class="modal-box modal-box--sm">
        <div class="modal-header">
          <h3>Delete Buyer</h3>
          <button id="bd-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p id="bd-msg" style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6"></p>
        </div>
        <div class="modal-footer" style="flex-wrap:wrap; gap:10px">
          <button id="bd-cancel" class="secondary-btn">Cancel</button>
          <button id="bd-archive" class="primary-btn">Archive</button>
          <button id="bd-delete" class="primary-btn" style="background:#e04040">Permanently Delete</button>
        </div>
      </div>
    </div>

    <!-- ══ IMPORT CONFIRM MODAL ══════════════════════════ -->
    <div id="import-confirm-modal" class="modal-overlay hidden" role="dialog" aria-modal="true">
      <div class="modal-box modal-box--sm">
        <div class="modal-header">
          <h3 style="color:#e04040">Warning: Overwrite Data</h3>
          <button id="ic-close" class="icon-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.5">
            You are about to import a backup file. <strong>This will completely overwrite your existing CRM data</strong>, including all quotes and buyers. Are you sure you want to proceed?
          </p>
        </div>
        <div class="modal-footer">
          <button id="ic-cancel" class="secondary-btn">Cancel</button>
          <button id="ic-confirm" class="primary-btn" style="background:#e04040; border-color:#e04040">Proceed & Overwrite</button>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-bottom-nav" aria-label="Main navigation">
      <a class="mobile-nav-link" data-target="builder-view" aria-label="Order Builder">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
        <span>Builder</span>
      </a>
      <a class="mobile-nav-link" data-target="quote-view" aria-label="Buyer Quote">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Quote</span>
      </a>
      <a class="mobile-nav-link" data-target="buyers-view" aria-label="Buyers">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>Buyers</span>
      </a>
      <a class="mobile-nav-link" data-target="orders-view" aria-label="Orders">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
        <span>Orders</span>
      </a>
      <a class="mobile-nav-link" id="mobile-menu-btn" aria-label="More Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <span>Menu</span>
      </a>
    </nav>
    
    <div id="mobile-sidebar-overlay" class="modal-overlay hidden" style="z-index: 999;"></div>

    <!-- PWA Install Banner -->
    <div id="pwa-install-banner" style="display:none;" role="alert">
      <div class="pwa-banner-content">
        <img src="/icons/icon-72x72.png" alt="App icon" width="40" height="40" style="border-radius:8px">
        <div><strong>Install Tezhhomayaa CRM</strong><p>Offline access &amp; Add to Home Screen</p></div>
        <button id="pwa-install-btn" class="primary-btn" style="white-space:nowrap">Install</button>
        <button id="pwa-dismiss-btn" aria-label="Dismiss" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px">✕</button>
      </div>
    </div>

  </body>
</html>
