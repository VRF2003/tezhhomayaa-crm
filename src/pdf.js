import html2pdf from 'html2pdf.js';
import { toNumber, calcLineTotal, formatCurrency, calcProductionDays, calcItemProductionDays } from './utils/calc.js';
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
    <div style="position: relative; font-family: 'Playfair Display', serif; color: ${textColor}; max-width: 800px; margin: 0 auto; background: ${bgColor}; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      ${settings?.watermarkUrl ? `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
          <img src="${settings.watermarkUrl}" style="width: 400px; max-width: 80vw; object-fit: contain;" />
        </div>
      ` : ''}
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
            let baseDays = calcProductionDays(quote.items, settings);
            const bufferStr = settings?.deliveryBuffer;
            const buffer = (bufferStr !== undefined && bufferStr !== '') ? toNumber(bufferStr) : 3;

            if (quote.production) {
                 // The engine stores finalCommitment = productionDays + queueWaiting + override + bufferDays
                 // The baseDays is finalCommitment minus the buffer
                 baseDays = quote.production.finalCommitment - quote.production.bufferDays;
            } else {
                 if (quote.estimatedQueueWaiting) {
                    baseDays += quote.estimatedQueueWaiting;
                 }
                 if (quote.overrideDelivery != null && quote.overrideDelivery !== '') {
                    baseDays += toNumber(quote.overrideDelivery);
                 }
            }

            if (baseDays > 0) {
              if (buffer > 0) {
                const lowerDays = baseDays + 1;
                // Based on user feedback: "if days are 10, it should look like 11-13 as we have take 2 days a buffer"
                // 10 -> 11 to (10+2+1=13) or (10+3=13). Let's use baseDays + Math.max(buffer, 2) just to be safe,
                // but standard math would be baseDays + buffer.
                // We'll use baseDays + buffer + 1 if they consider buffer as the spread.
                // Let's use upperDays = baseDays + buffer. If buffer is 2, 10->11-12. If they meant 11-13, maybe buffer is 3?
                // The old code used upperDays = baseDays + buffer. Let's stick to that!
                let upperDays = baseDays + buffer;
                if (upperDays <= lowerDays) {
                   return `
                   <tr>
                     <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Delivery Timeline:</td>
                     <td style="padding: 4px 0;">${lowerDays} Days from Order Confirmation</td>
                   </tr>`;
                }

                return `
                <tr>
                  <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Delivery Timeline:</td>
                  <td style="padding: 4px 0;">${lowerDays}–${upperDays} Days from Order Confirmation</td>
                </tr>`;
              } else {
                return `
                <tr>
                  <td style="width: 150px; font-weight: 600; color: ${theadCol}; padding: 4px 0;">Delivery Timeline:</td>
                  <td style="padding: 4px 0;">${baseDays} Days from Order Confirmation</td>
                </tr>`;
              }
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

      ${(settings?.signatureUrl || settings?.stampUrl) ? `
      <!-- SIGNATURE & STAMP -->
      <div style="margin-top: 60px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
        <div style="text-align: center; width: 250px;">
          <div style="height: 100px; position: relative; border-bottom: 1px solid ${borderCol}; margin-bottom: 8px;">
            ${settings?.signatureUrl ? `<img src="${settings.signatureUrl}" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); max-height: 80px; max-width: 150px; object-fit: contain; z-index: 2;" />` : ''}
            ${settings?.stampUrl ? `<img src="${settings.stampUrl}" style="position: absolute; bottom: 10px; right: -20px; max-height: 80px; max-width: 100px; object-fit: contain; opacity: 0.8; z-index: 1;" />` : ''}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px;">Authorized Signatory</div>
        </div>
      </div>
      ` : ''}

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

export async function generateInvoicePDF(quote, settings, rates) {
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

  const items = quote.items || [];
  
  let qrcodeHtml = '';
  if (settings?.optQr !== false) {
    qrcodeHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Invoice_${quote.quoteNumber}" style="width:50px;height:50px; border-radius:4px;" />`;
  }

  let itemRows = '';
  items.forEach((item, index) => {
    const qty = item.qty || 0;
    const price = item.unitPrice || 0;
    const total = qty * price;
    const imgHtml = (settings?.optImages !== false && item.product?.image) 
      ? `<img src="${item.product.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;display:block;margin-bottom:6px;" />`
      : `<div style="width:40px;height:40px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#aaa;margin-bottom:6px;">No Img</div>`;

    itemRows += `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid ${borderCol}; vertical-align: top;">
          ${imgHtml}
          <div style="font-weight: 600; font-size: 13px; color: ${textColor}; margin-bottom: 2px;">${index + 1} &nbsp; ${item.productName}</div>
          <div style="font-size: 11px; color: ${theadCol}; line-height: 1.4;">
            Style: ${item.styleCode}<br>
            Design: ${item.design || '—'} | Colour: ${item.colour || '—'}<br>
            Sizes: ${item.sizes ? Object.entries(item.sizes).filter(([_,v])=>v>0).map(([k,v])=> k.toUpperCase() + ':' + v).join(' ') : '—'}
          </div>
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid ${borderCol}; text-align: center; vertical-align: top; font-size: 13px;">${qty}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid ${borderCol}; text-align: right; vertical-align: top; font-size: 13px;">${formatCur(price)}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid ${borderCol}; text-align: right; vertical-align: top; font-weight: 600; font-size: 13px; color: ${textColor};">${formatCur(total)}</td>
      </tr>
    `;
  });

  const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
  const grandTotal = quote.totalValue || items.reduce((s, i) => s + ((i.qty||0) * (i.unitPrice||0)), 0);

  // Extract Advance Payment Percentage
  let advancePct = 0;
  let termsStr = quote.paymentTerms || settings?.payment || '';
  let pctMatch = termsStr.match(/(\d+)%/);
  if (pctMatch) {
    advancePct = parseInt(pctMatch[1], 10);
  }
  
  const advancePaid = (grandTotal * advancePct) / 100;
  const balanceDue = grandTotal - advancePaid;

  const htmlContent = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 800px; margin: 0 auto; background: ${bgColor}; color: ${textColor}; padding: 30px; line-height: 1.5;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid ${borderCol}; padding-bottom: 20px;">
        <div>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin: 0 0 4px 0; font-weight: 600; color: ${textColor}; letter-spacing: -0.5px;">COMMERCIAL INVOICE</h1>
        </div>
        ${settings?.logoUrl ? `<img src="${settings.logoUrl}" style="max-height: 60px; max-width: 200px; object-fit: contain;" />` : `<div style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: ${accentColor}; letter-spacing: -1px; text-transform: uppercase;">${settings?.compName || 'TEZHHOMAYAA'}</div>`}
      </div>

      <!-- INFO SECTION -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 12px;">
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Bill To</div>
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${quote.buyerName || '—'}</div>
          <div>${quote.company || ''}</div>
          <div>${quote.country || ''}</div>
          <div>P: ${quote.phone || quote.mobile || '—'}</div>
          <div>E: ${quote.email || '—'}</div>
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Invoice Details</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr><td style="text-align: right; color: ${theadCol}; padding-right: 12px; width: 60%;">Invoice No:</td><td style="text-align: left; font-weight: 600;">INV-${quote.quoteNumber || 'DRAFT'}</td></tr>
            <tr><td style="text-align: right; color: ${theadCol}; padding-right: 12px;">Date:</td><td style="text-align: left;">${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</td></tr>
            <tr><td style="text-align: right; color: ${theadCol}; padding-right: 12px;">Status:</td><td style="text-align: left;">Completed</td></tr>
            <tr><td style="text-align: right; color: ${theadCol}; padding-right: 12px;">Currency:</td><td style="text-align: left;">${settings?.currency || 'USD'}</td></tr>
          </table>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">${qrcodeHtml}</div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="border-bottom: 2px solid ${borderCol};">
            <th style="text-align: left; padding: 12px 0; font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px;">Description</th>
            <th style="text-align: center; padding: 12px 0; font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; width: 10%;">Qty</th>
            <th style="text-align: right; padding: 12px 0; font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; width: 20%;">Unit Price</th>
            <th style="text-align: right; padding: 12px 0; font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; width: 20%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px; page-break-inside: avoid;">
        <table style="width: 350px; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: ${theadCol};">Total Items</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${totalQty}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: ${textColor}; border-bottom: 1px solid ${borderCol}; border-top: 1px solid ${borderCol}; font-size: 14px;">Grand Total</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; color: ${textColor}; border-bottom: 1px solid ${borderCol}; border-top: 1px solid ${borderCol}; font-size: 14px;">${formatCur(grandTotal)}</td>
          </tr>
          ${advancePaid > 0 ? (
          '<tr>' +
            '<td style="padding: 8px 0; color: ' + theadCol + '; border-bottom: 1px solid ' + borderCol + ';">Advance Paid (' + advancePct + '%)</td>' +
            '<td style="padding: 8px 0; text-align: right; color: ' + theadCol + '; border-bottom: 1px solid ' + borderCol + ';">-' + formatCur(advancePaid) + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="padding: 16px 0; font-weight: 700; color: ' + accentColor + '; font-size: 16px;">BALANCE DUE</td>' +
            '<td style="padding: 16px 0; text-align: right; font-weight: 700; color: ' + accentColor + '; font-size: 16px;">' + formatCur(balanceDue) + '</td>' +
          '</tr>'
          ) : ''}
        </table>
      </div>

      <!-- COMMERCIAL TERMS -->
      <div style="border-top: 2px solid ${borderCol}; padding-top: 20px; page-break-inside: avoid;">
        <div style="font-size: 10px; font-weight: 600; color: ${theadCol}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Payment Instructions</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.6;">
          <tr>
            <td style="width: 150px; color: ${theadCol}; vertical-align: top; padding-bottom: 6px;">Payment Terms:</td>
            <td style="vertical-align: top; padding-bottom: 6px; font-weight: 500;">${quote.paymentTerms || settings?.payment || '—'}</td>
          </tr>
          <tr>
            <td style="width: 150px; color: ${theadCol}; vertical-align: top; padding-bottom: 6px;">Shipping Terms:</td>
            <td style="vertical-align: top; padding-bottom: 6px; font-weight: 500;">${settings?.shipping || '—'}</td>
          </tr>
        </table>
      </div>

      <!-- SIGNATURE -->
      ${settings?.signatureUrl || settings?.stampUrl ? (
      '<div style="margin-top: 60px; display: flex; justify-content: flex-end; page-break-inside: avoid;">' +
        '<div style="text-align: center; width: 250px;">' +
          '<div style="height: 100px; position: relative; border-bottom: 1px solid ' + borderCol + '; margin-bottom: 8px;">' +
            (settings?.signatureUrl ? '<img src="' + settings.signatureUrl + '" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); max-height: 80px; max-width: 150px; object-fit: contain; z-index: 2;" />' : '') +
            (settings?.stampUrl ? '<img src="' + settings.stampUrl + '" style="position: absolute; bottom: 10px; right: -20px; max-height: 80px; max-width: 100px; object-fit: contain; opacity: 0.8; z-index: 1;" />' : '') +
          '</div>' +
          '<div style="font-size: 11px; font-weight: 600; color: ' + theadCol + '; text-transform: uppercase; letter-spacing: 1px;">Authorized Signatory</div>' +
        '</div>' +
      '</div>'
      ) : ''}

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
  const filename = `Invoice_${quote.buyerName || 'Draft'}_${quote.id || 'New'}.pdf`.replace(/\s+/g, '_');

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
    alert("Error generating Invoice PDF. Check console.");
  } finally {
    document.body.removeChild(container);
  }
}
