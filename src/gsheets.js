// ============================================================
// gsheets.js — Google Sheets API Webhook client
// ============================================================

export async function testGoogleSheetsConnection(url) {
  if (!url) throw new Error("Google Apps Script Web App URL is missing.");
  
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: 'test' }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' } // text/plain prevents CORS preflight
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.status !== 'success') throw new Error(data.message || 'Unknown error from Apps Script');
  
  return true;
}

export async function syncOrderToSheets(quote, url) {
  if (!url) throw new Error("Google Apps Script Web App URL is missing.");

  // Flatten items for the "Order Items" sheet
  const items = quote.items.map(item => ({
    orderNumber: quote.quoteNumber,
    product: item.productName,
    design: item.design || '',
    colour: item.colour || '',
    xs: item.sizes?.xs || 0,
    s: item.sizes?.s || 0,
    m: item.sizes?.m || 0,
    l: item.sizes?.l || 0,
    xl: item.sizes?.xl || 0,
    xxl: item.sizes?.xxl || 0,
    totalQty: item.qty
  }));

  const payload = {
    action: 'sync_order',
    buyer: {
      buyerId: quote.buyerName.replace(/\\s+/g, '-').toLowerCase() + '-' + Date.now().toString().slice(-4), // Simple ID generation
      buyerName: quote.buyerName,
      company: quote.company || '',
      country: quote.country || '',
      phone: quote.phone || '',
      email: quote.email || '',
      whatsapp: quote.whatsapp || '',
      buyerType: quote.buyerType || ''
    },
    order: {
      orderNumber: quote.quoteNumber,
      date: new Date(quote.date).toISOString().split('T')[0],
      buyerName: quote.buyerName,
      company: quote.company || '',
      status: quote.status || 'Draft',
      totalQty: quote.items.reduce((s, i) => s + i.qty, 0),
      totalValue: quote.totalValue,
      currency: 'USD' // The CRM uses local display formatting, but we can pass USD default or let the script handle it
    },
    items: items
  };

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.status !== 'success') throw new Error(data.message || 'Unknown error from Apps Script');
  
  return data;
}
