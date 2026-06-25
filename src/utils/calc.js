/**
 * Centralized Calculation Engine
 * Ensures single source of truth for numeric operations across the app.
 */

/**
 * Safely converts any input (string, currency, null) into a number.
 * Removes currency symbols, commas, and spaces.
 * Returns 0 if invalid.
 */
export function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  if (typeof value === 'string') {
    // Strip everything except numbers, decimal point, and minus sign
    const cleanStr = value.replace(/[^0-9.-]+/g, "");
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }
  
  console.warn(`toNumber received unexpected type: ${typeof value}`, value);
  return 0;
}

/**
 * Calculates the line total strictly using numeric inputs.
 * Logs a warning if strings are passed.
 */
export function calcLineTotal(unitPrice, totalQty) {
  if (typeof unitPrice !== 'number' || typeof totalQty !== 'number') {
    console.warn('calcLineTotal received non-numeric inputs', { unitPrice, totalQty });
  }
  const price = toNumber(unitPrice);
  const qty = toNumber(totalQty);
  return price * qty;
}

/**
 * Safely sums the properties of a size matrix object.
 */
export function calcSizeTotal(sizesObj) {
  if (!sizesObj || typeof sizesObj !== 'object') return 0;
  
  const { xs = 0, s = 0, m = 0, l = 0, xl = 0, xxl = 0 } = sizesObj;
  return toNumber(xs) + toNumber(s) + toNumber(m) + toNumber(l) + toNumber(xl) + toNumber(xxl);
}

/**
 * Formats a numeric value into a currency string for UI display.
 * MUST NOT be used in calculations.
 * 
 * @param {number} value - The numeric value to format
 * @param {string} currency - The target currency code (e.g. 'USD')
 * @param {object} rates - The exchange rates dictionary containing { symbol, rate }
 */
export function formatCurrency(value, currency, rates) {
  const num = toNumber(value);
  if (!rates || !rates[currency]) {
    console.warn(`formatCurrency: Missing exchange rates for ${currency}`);
    return `$${num.toFixed(2)}`; // fallback
  }
  
  const { symbol, rate } = rates[currency];
  return `${symbol}${(num * rate).toFixed(2)}`;
}

/**
 * Calculates the total factory production days for an order's items based on quantity and lead times.
 * @param {Array} items - Array of order items
 * @param {Object} pdfSettings - Global settings containing silhouette lead times
 * @param {number} fallbackLeadTime - Fallback lead time if neither product nor silhouette has one
 */
export function calcProductionDays(items, pdfSettings, fallbackLeadTime = 7) {
  if (!items || items.length === 0) return 0;
  
  const silLeadTimes = pdfSettings?.silhouetteLeadTimes || {};
  
  // 1. Group quantities by rule (Silhouette or Product Name)
  const groupQty = {};
  const groupLeadTime = {};
  
  for (const item of items) {
    const p = item.product || {};
    const qty = toNumber(item.qty);
    
    let key = 'fallback';
    let leadTime = fallbackLeadTime;
    
    const pName = p.productName || item.productName;
    
    if (p.leadTime) {
      key = pName; // Product-specific override
      leadTime = p.leadTime;
    } else if (p.silhouette && silLeadTimes[p.silhouette]) {
      key = p.silhouette;
      leadTime = silLeadTimes[p.silhouette];
    } else if (pName && silLeadTimes[pName]) {
      key = pName;
      leadTime = silLeadTimes[pName];
    }
    
    groupQty[key] = (groupQty[key] || 0) + qty;
    groupLeadTime[key] = leadTime;
  }
  
  let totalOrderTimeline = 0;
  
  // 2. Calculate proportional timeline for each group and sum them up (sequential production)
  for (const key in groupQty) {
    const totalQty = groupQty[key];
    const leadTime = groupLeadTime[key];
    
    // Determine MOQ for this group
    let moq = 100;
    if (pdfSettings?.silhouetteMoqs && pdfSettings.silhouetteMoqs[key]) {
      moq = pdfSettings.silhouetteMoqs[key];
    }
    
    // Proportional scaling for all orders.
    const timeline = Math.ceil((totalQty / moq) * leadTime);
    
    totalOrderTimeline += timeline;
  }
  
  return totalOrderTimeline;
}

// Helper to calculate production days for a single item or grouped quantity
export function calcItemProductionDays(qty, p, pdfSettings, fallbackLeadTime = 7) {
  const silLeadTimes = pdfSettings?.silhouetteLeadTimes || {};
  const silMoqs = pdfSettings?.silhouetteMoqs || {};
  
  let key = 'fallback';
  let leadTime = fallbackLeadTime;
  
  if (p.leadTime) {
    key = p.productName;
    leadTime = p.leadTime;
  } else if (silLeadTimes[p.silhouette]) {
    key = p.silhouette;
    leadTime = silLeadTimes[p.silhouette];
  } else if (silLeadTimes[p.productName]) {
    key = p.productName;
    leadTime = silLeadTimes[p.productName];
  }
  
  let moq = 100;
  if (silMoqs[key]) moq = silMoqs[key];
  
  return Math.ceil((qty / moq) * leadTime);
}

/**
 * Calculates the total queue waiting time for a target order, given all quotes.
 * It filters for Confirmed orders, sorts them by priority and confirmation date, 
 * and sums the production days of all orders ahead of the target order.
 */
export function calculateQueueWaiting(targetQuote, allQuotes) {
  // Priority Mapping
  const priorityScore = {
    'VIP': 4,
    'Urgent': 3,
    'Priority': 2,
    'Normal': 1
  };
  
  const getScore = (q) => priorityScore[q.production?.priority || 'Normal'] || 1;
  const getConfirmationDate = (q) => q.production?.confirmedAt || q.date || new Date().toISOString();

  // Find all confirmed orders
  const confirmedQueue = allQuotes.filter(q => 
    q.status === 'Confirmed' && 
    q.id !== targetQuote.id // Exclude self
  );

  // Sort queue by Manual Sort Index first, then Priority (desc), then Confirmation Date (asc)
  confirmedQueue.sort((a, b) => {
    const msA = a.production?.manualSortIndex;
    const msB = b.production?.manualSortIndex;
    
    if (msA != null && msB != null) return msA - msB;
    if (msA != null) return -1;
    if (msB != null) return 1;

    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher priority first
    }
    // Tie-breaker: oldest confirmation date first
    return new Date(getConfirmationDate(a)) - new Date(getConfirmationDate(b));
  });

  // Where does targetQuote fit in this queue?
  let queueWaiting = 0;
  const targetScore = getScore(targetQuote);
  const targetDate = new Date(getConfirmationDate(targetQuote));

  for (const q of confirmedQueue) {
    const qScore = getScore(q);
    const qDate = new Date(getConfirmationDate(q));
    
    // Is 'q' ahead of 'targetQuote'?
    if (qScore > targetScore || (qScore === targetScore && qDate < targetDate)) {
      queueWaiting += (q.production?.productionDays || 0);
    }
  }

  return queueWaiting;
}

/**
 * Calculates the final committed delivery timeline.
 */
export function calcFinalCommitment(productionDays, queueWaiting, bufferDays, manualOverride) {
  let total = productionDays + queueWaiting;
  if (manualOverride != null && manualOverride !== '') {
    total += toNumber(manualOverride);
  }
  return total + toNumber(bufferDays);
}

/**
 * Adds business days to a date, skipping configured weekends and holidays.
 * @param {Date|string} startDate 
 * @param {number} daysToAdd 
 * @param {Object} factorySettings - contains weeklyOffDays (array of numbers 0=Sun..6=Sat) and holidays (array of "YYYY-MM-DD")
 */
export function addWorkingDays(startDate, daysToAdd, factorySettings = {}) {
  const date = new Date(startDate);
  
  // Default to Sunday (0) and Saturday (6) if not configured
  const offDays = factorySettings.weeklyOffDays || [0, 6]; 
  const holidays = factorySettings.holidays || []; // e.g. ["2026-12-25"]

  let remainingDays = daysToAdd;
  
  if (remainingDays === 0) {
     while (
      offDays.includes(date.getDay()) || 
      holidays.includes(date.toISOString().split('T')[0])
    ) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  while (remainingDays > 0) {
    date.setDate(date.getDate() + 1);
    
    const isOffDay = offDays.includes(date.getDay());
    const isHoliday = holidays.includes(date.toISOString().split('T')[0]);
    
    if (!isOffDay && !isHoliday) {
      remainingDays--;
    }
  }
  
  return date;
}
