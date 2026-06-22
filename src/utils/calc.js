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
 * Calculates the maximum delivery timeline across all items in an order.
 * @param {Array} items - Array of order items
 * @param {Object} pdfSettings - Global settings containing silhouette lead times
 * @param {number} fallbackLeadTime - Fallback lead time if neither product nor silhouette has one
 */
export function calcDeliveryTimeline(items, pdfSettings, fallbackLeadTime = 7) {
  if (!items || items.length === 0) return 0;
  
  const silLeadTimes = pdfSettings?.silhouetteLeadTimes || {};
  
  // 1. Group quantities by rule (Silhouette or Product Name)
  const groupQty = {};
  const groupLeadTime = {};
  
  for (const item of items) {
    const p = item.product;
    const qty = toNumber(item.qty);
    
    let key = 'fallback';
    let leadTime = fallbackLeadTime;
    
    if (p.leadTime) {
      key = p.productName; // Product-specific override
      leadTime = p.leadTime;
    } else if (silLeadTimes[p.silhouette]) {
      key = p.silhouette;
      leadTime = silLeadTimes[p.silhouette];
    } else if (silLeadTimes[p.productName]) {
      key = p.productName;
      leadTime = silLeadTimes[p.productName];
    }
    
    groupQty[key] = (groupQty[key] || 0) + qty;
    groupLeadTime[key] = leadTime;
  }
  
  let maxTimeline = 0;
  
  // 2. Calculate proportional timeline for each group and find the max
  for (const key in groupQty) {
    const totalQty = groupQty[key];
    const leadTime = groupLeadTime[key];
    
    // Proportional scaling with a minimum of 1 block (base lead time)
    const factor = Math.max(1, totalQty / 100);
    const timeline = Math.round(factor * leadTime);
    
    if (timeline > maxTimeline) {
      maxTimeline = timeline;
    }
  }
  
  return maxTimeline;
}
