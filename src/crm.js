// ============================================================
// crm.js — CRM business logic for Tezhhomayaa Wholesale CRM
// ============================================================

import { db_quotes, db_buyers, db_settings } from './db.js';
import { syncOrderToSheets } from './gsheets.js';
import { calcProductionDays, calculateQueueWaiting, calcFinalCommitment, addWorkingDays } from './utils/calc.js';

// ── Quote number generator ────────────────────────────────
function generateQuoteNumber() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `TZH-${ymd}-${rand}`;
}

// ── Save a Quote + upsert Buyer ──────────────────────────
export async function saveQuote({ buyerName, company, country, currency, items, totalCost, totalValue, totalProfit, marginPct, mobile, email, whatsapp, buyerType, status, paymentTerms, overrideDelivery }) {
  if (!buyerName || items.length === 0) {
    throw new Error('Buyer name and at least one item are required.');
  }

  const quoteNumber = generateQuoteNumber();
  const date = new Date().toISOString();

  const s = await DatabaseService.getSettings() || {};
  const productionDays = calcProductionDays(items, s);

  const quoteRecord = {
    quoteNumber, date,
    buyerName, company, country, currency, phone: mobile, email, whatsapp, buyerType, status,
    paymentTerms, overrideDelivery,
    items, totalCost, totalValue, totalProfit, marginPct
  };

  if (status === 'Confirmed') {
    quoteRecord.production = {
      productionDays,
      queueWaiting: 0,
      bufferDays: s.deliveryBuffer || 3,
      finalCommitment: 0,
      priority: 'Normal',
      manualOverride: null,
      overrideReason: '',
      confirmedAt: date,
      productionStatus: 'Scheduled',
      productionNotes: [],
      auditLog: [],
      manualSortIndex: null,
    };
  }

  const quoteId = await DatabaseService.addQuote(quoteRecord);

  if (status === 'Confirmed') {
    await recalculateProductionQueue();
  }

  // 2. Upsert buyer
  const existingBuyers = await DatabaseService.getBuyerByName(buyerName);
  if (existingBuyers.length > 0) {
    const buyer = existingBuyers[0];
    buyer.company     = company || buyer.company;
    buyer.country     = country || buyer.country;
    buyer.phone       = mobile || buyer.phone;
    buyer.email       = email || buyer.email;
    buyer.whatsapp    = whatsapp || buyer.whatsapp;
    buyer.buyerType   = buyerType || buyer.buyerType;
    if (paymentTerms) buyer.paymentTerms = paymentTerms;
    buyer.lastSeen    = date;
    buyer.totalQuotes += 1;
    buyer.totalRevenue += totalValue;
    buyer.totalProfit  += totalProfit;
    await DatabaseService.saveBuyer(buyer);
  } else {
    await DatabaseService.addBuyer({
      name: buyerName, company, country, phone: mobile, email, whatsapp, buyerType,
      paymentTerms,
      firstSeen: date, lastSeen: date,
      totalQuotes: 1,
      totalRevenue: totalValue,
      totalProfit: totalProfit,
    });
  }

  // 3. Auto-sync to Google Sheets if enabled
  try {
    const s = await DatabaseService.getSettings();
    if (s && s.gsheetAutoSync !== false && s.gsheetUrl) {
      // Fire and forget (or await if we want to block, but fire and forget is safer for UX)
      syncOrderToSheets(quoteRecord, s.gsheetUrl).catch(e => console.error("Auto-sync to sheets failed", e));
    }
  } catch (e) {
    console.error("Error checking sync settings", e);
  }

  return { quoteId, quoteNumber };
}

// ── Dashboard Report ─────────────────────────────────────
export async function getReport() {
  const [allDbQuotes, allDbBuyers] = await Promise.all([
    DatabaseService.getQuotes(),
    DatabaseService.getBuyers(),
  ]);

  const quotes = allDbQuotes.filter(q => !q.archived);
  const archivedQuotes = allDbQuotes.filter(q => q.archived).sort((a, b) => new Date(b.archivedAt || b.date) - new Date(a.archivedAt || a.date));
  const buyers = allDbBuyers.filter(b => !b.archived);

  const totalRevenue = quotes.reduce((s, q) => s + q.totalValue, 0);
  const totalProfit  = quotes.reduce((s, q) => s + q.totalProfit, 0);
  const totalCost    = quotes.reduce((s, q) => s + q.totalCost, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Top products by revenue
  const productMap = {};
  quotes.forEach(q => {
    q.items.forEach(item => {
      const key = item.productName;
      if (!productMap[key]) productMap[key] = { revenue: 0, qty: 0, profit: 0 };
      productMap[key].revenue += item.unitPrice * item.qty;
      productMap[key].qty     += item.qty;
      productMap[key].profit  += (item.unitPrice - item.finalCost) * item.qty;
    });
  });
  const topProducts = Object.entries(productMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top countries by revenue
  const countryMap = {};
  quotes.forEach(q => {
    const c = q.country || 'Unknown';
    if (!countryMap[c]) countryMap[c] = { revenue: 0, quotes: 0 };
    countryMap[c].revenue += q.totalValue;
    countryMap[c].quotes  += 1;
  });
  const topCountries = Object.entries(countryMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Recent quotes (last 5, newest first)
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return {
    totalBuyers:  buyers.length,
    totalQuotes:  quotes.length,
    totalRevenue,
    totalProfit,
    totalCost,
    overallMargin,
    topProducts,
    topCountries,
    recentQuotes,
    allQuotes:    [...quotes].sort((a, b) => new Date(b.date) - new Date(a.date)),
    allBuyers:    [...buyers].sort((a, b) => b.totalRevenue - a.totalRevenue),
    archivedQuotes,
  };
}

// ── Delete a Quote ────────────────────────────────────────
export async function deleteQuote(id) {
  await DatabaseService.deleteQuote(id);
}

// ── Update Quote Status ───────────────────────────────────
export async function updateQuoteStatus(id, status) {
  const quote = await DatabaseService.getQuoteById(id);
  if (quote) {
    quote.status = status;
    await DatabaseService.saveQuote(quote);
  }
}

// ── Update Quote Fields ───────────────────────────────────
export async function updateQuoteFields(id, fields) {
  const quote = await DatabaseService.getQuoteById(id);
  if (quote) {
    const wasConfirmed = quote.status === 'Confirmed';
    Object.assign(quote, fields);
    
    // Initialize production metadata if changing to Confirmed
    if (quote.status === 'Confirmed' && (!quote.production || !wasConfirmed)) {
      const s = await DatabaseService.getSettings() || {};
      quote.production = {
        productionDays: calcProductionDays(quote.items, s),
        queueWaiting: 0,
        bufferDays: s.deliveryBuffer || 3,
        finalCommitment: 0,
        priority: 'Normal',
        manualOverride: null,
        overrideReason: '',
        confirmedAt: new Date().toISOString(),
        productionStatus: 'Scheduled',
        productionNotes: [],
        auditLog: [],
        manualSortIndex: null,
      };
    } else if (quote.status !== 'Confirmed') {
      delete quote.production; // Clear if not confirmed
    }

    await DatabaseService.saveQuote(quote);

    if (quote.status === 'Confirmed' || wasConfirmed) {
      await recalculateProductionQueue();
    }
  }
}

export async function recalculateProductionQueue() {
  const allQuotes = await DatabaseService.getQuotes();
  const confirmedQuotes = allQuotes.filter(q => q.status === 'Confirmed' && !q.archived);
  const settings = await DatabaseService.getSettings() || {};
  const factorySettings = settings.factoryCalendar || {};
  
  for (const q of confirmedQuotes) {
    if (!q.production) continue;
    if (q.production.productionStatus === 'Completed') continue;
    
    const queueWaiting = calculateQueueWaiting(q, allQuotes);
    const finalCommit = calcFinalCommitment(
      q.production.productionDays, 
      queueWaiting, 
      q.production.bufferDays, 
      q.production.manualOverride
    );

    const confirmedAt = q.production.confirmedAt || q.date;
    const expectedStartDate = addWorkingDays(confirmedAt, queueWaiting, factorySettings).toISOString();
    const expectedFinishDate = addWorkingDays(expectedStartDate, q.production.productionDays, factorySettings).toISOString();

    let needsUpdate = false;
    if (
      q.production.queueWaiting !== queueWaiting || 
      q.production.finalCommitment !== finalCommit ||
      q.production.expectedStartDate !== expectedStartDate ||
      q.production.expectedFinishDate !== expectedFinishDate
    ) {
      q.production.queueWaiting = queueWaiting;
      q.production.finalCommitment = finalCommit;
      q.production.expectedStartDate = expectedStartDate;
      q.production.expectedFinishDate = expectedFinishDate;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await DatabaseService.saveQuote(q);
    }
  }
}

// ── Archive / Restore Quote ───────────────────────────────
export async function archiveQuote(id) {
  const quote = await DatabaseService.getQuoteById(id);
  if (quote) {
    quote.archived = true;
    quote.archivedAt = new Date().toISOString();
    await DatabaseService.saveQuote(quote);
  }
}

export async function restoreQuote(id) {
  const quote = await DatabaseService.getQuoteById(id);
  if (quote) {
    quote.archived = false;
    delete quote.archivedAt;
    await DatabaseService.saveQuote(quote);
  }
}

// ── Duplicate Quote ───────────────────────────────────────
export async function duplicateQuote(id) {
  const quote = await DatabaseService.getQuoteById(id);
  if (quote) {
    const newQuote = { ...quote };
    delete newQuote.id;
    newQuote.quoteNumber = generateQuoteNumber();
    newQuote.date = new Date().toISOString();
    await DatabaseService.addQuote(newQuote);
  }
}

// ── Buyer Actions ─────────────────────────────────────────
export async function archiveBuyer(id) {
  const buyer = await DatabaseService.getBuyerById(id);
  if (buyer) {
    buyer.archived = true;
    await DatabaseService.saveBuyer(buyer);
  }
}

export async function deleteBuyer(id) {
  await DatabaseService.deleteBuyer(id);
}

export async function updateBuyerFields(id, fields) {
  const buyer = await DatabaseService.getBuyerById(id);
  if (buyer) {
    Object.assign(buyer, fields);
    await DatabaseService.saveBuyer(buyer);
  }
}
