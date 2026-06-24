import html2pdf from 'html2pdf.js';
import { toNumber, calcLineTotal, formatCurrency, calcDeliveryTimeline, calcItemDeliveryTimeline } from './utils/calc.js';
import { logoBase64 } from './logoBase64.js';

/**
 * Generates a luxury PDF quotation from a quote object.
 * @param {Object} quote - The quote object (needs buyer details and items).
 * @param {String} mode - 'client' or 'internal'
 * @param {Object} settings - PDF settings containing companyName, etc.
 * @param {Object} rates - The global exchangeRates object.
 */
export async function generateLuxuryPDF(quote, mode, settings, rates) {
  const isInternal = mode === 'internal';
  
  // Format currency helper
  const formatCur = (num) => formatCurrency(num, settings?.currency || 'USD', rates);

  // Theme settings
  const theme = settings?.theme || 'luxury-beige';
  let bgColor = '#ffffff';
  let textColor = '#111111';
  let accentColor = '#d4af37'; // gold
  let borderCol = '#eeeeee';
  let theadCol = '#666666';

  if (theme === 'black-gold') {
    bgColor = '#111111';
    textColor = '#f5f5f5';
    borderCol = '#333333';
    theadCol = '#aaaaaa';
  } else if (theme === 'minimal-white') {
    accentColor = '#000000';
    borderCol = '#e0e0e0';
  } else if (theme === 'fashion-week') {
    bgColor = '#faf9f6';
    accentColor = '#b5651d';
    theadCol = '#888888';
  } else if (theme === 'middle-east') {
    bgColor = '#fffdf7';
    accentColor = '#c19a6b';
    borderCol = '#e8dfd5';
  }


  // Group items by Silhouette and Override MOQ for MOQ Table
  const silTotals = {};
  const overrideTotals = {};
  const items = quote.items || [];
  
  items.forEach(item => {
    const prod = item.product || {};
    if (prod.overrideMoq != null) {
      const pName = prod.productName;
      if (!overrideTotals[pName]) overrideTotals[pName] = { qty: 0, required: prod.overrideMoq };
      overrideTotals[pName].qty += item.qty;
    } else {
      const sil = prod.silhouette || 'Uncategorized';
      silTotals[sil] = (silTotals[sil] || 0) + item.qty;
    }
  });

  // Calculate overall totals
  const totalQty = items.reduce((sum, i) => sum + toNumber(i.qty), 0);
  const totalCost = items.reduce((sum, i) => sum + calcLineTotal(i.product?.finalCost || 0, i.qty), 0);
  const totalValue = items.reduce((sum, i) => sum + calcLineTotal(i.unitPrice, i.qty), 0);
  const totalProfit = totalValue - totalCost;
  const marginPct = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  // Build Items HTML
  let itemsHtml = items.map((item, idx) => {
    const prod = item.product || {};
    const imageUrl = item.image || prod.image;
    const imgStr = imageUrl ? `<img src="${imageUrl}" style="max-height:80px; max-width:80px; width:auto; height:auto; object-fit:contain; border-radius:4px;">` : `<div style="width:50px; height:50px; background:#f0f0f0; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa">No Img</div>`;
    
    // Formatting the size matrix summary
    let sizesSummary = [];
    if (item.sizes) {
      if (item.sizes.xs) sizesSummary.push(`XS:${item.sizes.xs}`);
      if (item.sizes.s) sizesSummary.push(`S:${item.sizes.s}`);
      if (item.sizes.m) sizesSummary.push(`M:${item.sizes.m}`);
      if (item.sizes.l) sizesSummary.push(`L:${item.sizes.l}`);
      if (item.sizes.xl) sizesSummary.push(`XL:${item.sizes.xl}`);
      if (item.sizes.xxl) sizesSummary.push(`2XL:${item.sizes.xxl}`);
    }
    
    const lineTotal = calcLineTotal(item.unitPrice, item.qty);
    
    let trHtml = `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">${idx + 1}</td>
        <td style="padding: 12px 0;">
          <div style="margin-bottom: 8px;">${imgStr}</div>
          <div style="font-weight: 600; font-size: 14px; color: #111;">${prod.productName || 'Unknown Product'}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">Style: ${prod.styleCode || 'N/A'}</div>
          <div style="font-size: 12px; color: #666;">Design: ${prod.design || 'N/A'} | Colour: ${prod.colour || 'N/A'}</div>
          <div style="font-size: 11px; color: #888; margin-top: 4px;">Sizes: ${sizesSummary.join(' ')}</div>
        </td>
        <td style="padding: 12px 0; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 0; text-align: right;">${formatCur(item.unitPrice)}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCur(lineTotal)}</td>
    `;
    
    if (isInternal) {
      const cost = prod.finalCost || 0;
      const lineCost = calcLineTotal(cost, item.qty);
      const lineProfit = lineTotal - lineCost;
      const margin = lineTotal > 0 ? (lineProfit / lineTotal) * 100 : 0;
      trHtml += `
        <td style="padding: 12px 0; text-align: right; border-left: 1px solid #eee; padding-left: 12px; color: #d32f2f">${formatCur(cost)}</td>
        <td style="padding: 12px 0; text-align: right; color: #2e7d32">${formatCur(lineProfit)}</td>
        <td style="padding: 12px 0; text-align: right; color: #2e7d32">${margin.toFixed(1)}%</td>
      `;
    }
    trHtml += `</tr>`;
    return trHtml;
  }).join('');

  // Build MOQ Summary HTML
  let moqHtml = '';
  const moqs = settings?.silhouetteMoqs || {};
  let hasMoqData = false;
  
  let moqRows = '';
  // Silhouettes
  for (const [sil, required] of Object.entries(moqs)) {
    const qty = silTotals[sil] || 0;
    if (qty > 0) {
      hasMoqData = true;
      const isMet = qty >= required;
      moqRows += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; font-size: 12px;">${sil}</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center;">${required}</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center; color: ${isMet ? '#2e7d32' : '#d32f2f'}">${qty}</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center; color: ${isMet ? '#2e7d32' : '#d32f2f'}">${isMet ? 'Achieved ✓' : 'Pending'}</td>
        </tr>
      `;
    }
  }
  // Overrides
  for (const [pName, data] of Object.entries(overrideTotals)) {
    if (data.qty > 0) {
      hasMoqData = true;
      const isMet = data.qty >= data.required;
      moqRows += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; font-size: 12px;">${pName} (Override)</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center;">${data.required}</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center; color: ${isMet ? '#2e7d32' : '#d32f2f'}">${data.qty}</td>
          <td style="padding: 8px 0; font-size: 12px; text-align: center; color: ${isMet ? '#2e7d32' : '#d32f2f'}">${isMet ? 'Achieved ✓' : 'Pending'}</td>
        </tr>
      `;
    }
  }

  if (hasMoqData) {
    moqHtml = `
      <div style="margin-top: 40px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #444; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 16px;">MOQ Achievement Summary</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #111;">
              <th style="padding: 8px 0; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Pool</th>
              <th style="padding: 8px 0; text-align: center; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Required</th>
              <th style="padding: 8px 0; text-align: center; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Current</th>
              <th style="padding: 8px 0; text-align: center; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${moqRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Build the complete HTML Template
  const htmlContent = `
    <div style="font-family: 'Playfair Display', serif; color: ${textColor}; max-width: 800px; margin: 0 auto; background: ${bgColor}; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      </style>
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px;">
        <div style="text-align: left;">
          <h1 style="font-size: 24px; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; margin: 0; color: ${textColor};">Formal Quotation</h1>
          ${isInternal ? '<div style="margin-top:8px; font-size: 12px; color: #d32f2f; font-weight: 600; letter-spacing: 2px; font-family: sans-serif;">INTERNAL COSTING VIEW</div>' : ''}
        </div>
        <div style="text-align: right;">
          <img src="${settings?.logoUrl || logoBase64}" alt="Company Logo" style="height: 40px; object-fit: contain;" />
        </div>
      </div>

      <!-- INFO BLOCK -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 13px; line-height: 1.6; color: ${textColor};">
        <div style="flex: 1; padding-right: 20px;">
          <h4 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${theadCol}; margin-bottom: 10px; border-bottom: 1px solid ${borderCol}; padding-bottom: 5px;">Quote To</h4>
          <div style="font-weight: 600; font-size: 15px;">${quote.buyerName}</div>
          <div>${quote.company}</div>
          <div>${quote.country}</div>
          <div style="margin-top: 8px;">P: ${quote.mobile}</div>
          ${quote.email ? `<div>E: ${quote.email}</div>` : ''}
        </div>
        <div style="flex: 1; padding-left: 20px;">
          <h4 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${theadCol}; margin-bottom: 10px; border-bottom: 1px solid ${borderCol}; padding-bottom: 5px;">Quote Details</h4>

          <table style="width: 100%; color: ${textColor};">
            <tr><td style="color:${theadCol}; width:100px;">Quote Ref:</td><td style="font-weight:600; text-align:right;">${quote.id || 'DRAFT'}</td></tr>
            <tr><td style="color:${theadCol};">Date:</td><td style="font-weight:600; text-align:right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td style="color:${theadCol};">Status:</td><td style="font-weight:600; text-align:right;">${quote.status || 'Draft'}</td></tr>
            <tr><td style="color:${theadCol};">Currency:</td><td style="font-weight:600; text-align:right;">${settings?.currency || 'USD'}</td></tr>
          </table>
        </div>
      </div>

      <!-- PRODUCT TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; color: ${textColor};">
        <thead>
          <tr style="border-bottom: 2px solid ${textColor};">
            <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase;">#</th>
            <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase;">Description</th>
            <th style="padding: 12px 0; text-align: center; font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase;">Qty</th>
            <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase;">Unit Price</th>
            <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase;">Total</th>
            ${isInternal ? `
              <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #d32f2f; text-transform: uppercase; border-left: 1px solid ${borderCol}; padding-left: 12px;">Unit Cost</th>
              <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #2e7d32; text-transform: uppercase;">Profit</th>
              <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #2e7d32; text-transform: uppercase;">Margin</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div style="display: flex; justify-content: flex-end; page-break-inside: avoid; color: ${textColor};">
        <div style="width: 350px;">
          <table style="width: 100%; font-size: 14px;">
            <tr style="border-bottom: 1px solid ${borderCol};">
              <td style="padding: 10px 0; color: ${theadCol};">Total Items</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${totalQty}</td>
            </tr>
            <tr style="border-bottom: 2px solid ${textColor};">
              <td style="padding: 12px 0; font-weight: 600; font-size: 16px;">Grand Total</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 16px;">${formatCur(totalValue)}</td>
            </tr>
            ${isInternal ? `
              <tr>
                <td style="padding: 10px 0; color: #d32f2f;">Total Cost</td>
                <td style="padding: 10px 0; text-align: right; color: #d32f2f; font-weight: 600;">${formatCur(totalCost)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #2e7d32;">Total Profit</td>
                <td style="padding: 10px 0; text-align: right; color: #2e7d32; font-weight: 600;">${formatCur(totalProfit)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #2e7d32;">Overall Margin</td>
                <td style="padding: 10px 0; text-align: right; color: #2e7d32; font-weight: 600;">${marginPct.toFixed(2)}%</td>
              </tr>
            ` : ''}
          </table>
        </div>
      </div>

      ${moqHtml}

      <!-- COMMERCIAL TERMS -->
      <div style="margin-top: 40px; page-break-inside: avoid; color: ${textColor};">
        <h4 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${textColor}; border-bottom: 1px solid ${textColor}; padding-bottom: 8px; margin-bottom: 16px;">Commercial Terms</h4>
        <table style="width: 100%; font-size: 12px; line-height: 1.6;">
          ${(quote.paymentTerms || settings?.payment) ? `
          <tr>
            <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Payment Terms:</td>
            <td style="padding: 4px 0;">${quote.paymentTerms || settings?.payment}</td>
          </tr>` : ''}
          ${(() => {
            const buffer = settings?.deliveryBuffer || 3;
            const calcDays = calcDeliveryTimeline(quote.items, settings);
            const baseDays = quote.overrideDelivery != null ? quote.overrideDelivery : calcDays;
            if (baseDays > 0) {
              const lowerDays = baseDays + 1;
              const upperDays = baseDays + buffer;
              return `
              <tr>
                <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Estimated Delivery:</td>
                <td style="padding: 4px 0;">${lowerDays}–${upperDays} Days</td>
              </tr>`;
            }
            return '';
          })()}
          ${settings?.shipping ? `
          <tr>
            <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Shipping Terms:</td>
            <td style="padding: 4px 0;">${settings.shipping}</td>
          </tr>` : ''}
          ${settings?.validity ? `
          <tr>
            <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Quotation Validity:</td>
            <td style="padding: 4px 0;">${settings.validity}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- FOOTER -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid ${borderCol}; font-size: 11px; color: ${theadCol}; text-align: center; page-break-inside: avoid;">
        <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px; color: ${textColor};">${settings?.compName || 'TEZHHOMAYAA'}</div>
        <div style="margin-bottom: 8px;">${settings?.tagline || 'Bridge To Luxury'}</div>
        <div>${settings?.address || 'Malaysia Fashion Show HQ'}</div>
        <div style="margin-top: 4px;">
          ${settings?.email ? settings.email + ' | ' : ''}
          ${settings?.phone ? settings.phone + ' | ' : ''}
          ${settings?.website || 'www.tezhhomayaa.com'}
        </div>
      </div>

    </div>
  `;

  // Create a hidden container for html2pdf
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  const filename = `Quotation_${quote.buyerName || 'Draft'}_${quote.id || 'New'}${isInternal ? '_Internal' : ''}.pdf`.replace(/\s+/g, '_');

  const opt = {
    margin:       10, // mm
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().from(container.firstElementChild).set(opt).save();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Error generating PDF. Check console.");
  } finally {
    document.body.removeChild(container);
  }
}
