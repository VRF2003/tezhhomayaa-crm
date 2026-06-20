import html2pdf from 'html2pdf.js';

/**
 * Generates a luxury PDF quotation from a quote object.
 * @param {Object} quote - The quote object (needs buyer details and items).
 * @param {String} mode - 'client' or 'internal'
 * @param {Object} settings - PDF settings containing companyName, etc.
 */
export async function generateLuxuryPDF(quote, mode, settings) {
  const isInternal = mode === 'internal';
  
  // Format currency helper
  const formatCur = (num) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: settings?.currency || 'USD',
  }).format(num || 0);

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
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const totalCost = items.reduce((sum, i) => sum + ((i.product?.finalCost || 0) * i.qty), 0);
  const totalValue = items.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const totalProfit = totalValue - totalCost;
  const marginPct = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  // Build Items HTML
  let itemsHtml = items.map((item, idx) => {
    const prod = item.product || {};
    const imgStr = item.image ? `<img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` : `<div style="width:50px; height:50px; background:#f0f0f0; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa">No Img</div>`;
    
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
    
    let trHtml = `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">${idx + 1}</td>
        <td style="padding: 12px 0;">${imgStr}</td>
        <td style="padding: 12px 0;">
          <div style="font-weight: 600; font-size: 14px; color: #111;">${prod.productName || 'Unknown Product'}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">Style: ${item.styleCode}</div>
          <div style="font-size: 12px; color: #666;">Design: ${item.design} | Colour: ${item.colour}</div>
          <div style="font-size: 11px; color: #888; margin-top: 4px;">Sizes: ${sizesSummary.join(' ')}</div>
        </td>
        <td style="padding: 12px 0; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 0; text-align: right;">${formatCur(item.unitPrice)}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCur(item.total)}</td>
    `;
    
    if (isInternal) {
      const cost = prod.finalCost || 0;
      const profit = item.unitPrice - cost;
      const margin = item.unitPrice > 0 ? (profit / item.unitPrice) * 100 : 0;
      trHtml += `
        <td style="padding: 12px 0; text-align: right; border-left: 1px solid #eee; padding-left: 12px; color: #d32f2f">${formatCur(cost)}</td>
        <td style="padding: 12px 0; text-align: right; color: #2e7d32">${formatCur(profit)}</td>
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
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; max-width: 800px; margin: 0 auto; background: #fff; padding: 40px;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 50px;">
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin: 0;">Formal Quotation</h1>
        ${isInternal ? '<div style="margin-top:8px; font-size: 12px; color: #d32f2f; font-weight: 600; letter-spacing: 2px;">INTERNAL COSTING VIEW</div>' : ''}
      </div>

      <!-- INFO BLOCK -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 13px; line-height: 1.6;">
        <div style="flex: 1; padding-right: 20px;">
          <h4 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Quote To</h4>
          <div style="font-weight: 600; font-size: 15px;">${quote.buyerName}</div>
          <div>${quote.company}</div>
          <div>${quote.country}</div>
          <div style="margin-top: 8px;">P: ${quote.mobile}</div>
          ${quote.email ? `<div>E: ${quote.email}</div>` : ''}
        </div>
        <div style="flex: 1; padding-left: 20px;">
          <h4 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Quote Details</h4>
          <table style="width: 100%;">
            <tr><td style="color:#666; width:100px;">Quote Ref:</td><td style="font-weight:600; text-align:right;">${quote.id || 'DRAFT'}</td></tr>
            <tr><td style="color:#666;">Date:</td><td style="font-weight:600; text-align:right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td style="color:#666;">Status:</td><td style="font-weight:600; text-align:right;">${quote.status || 'Draft'}</td></tr>
            <tr><td style="color:#666;">Currency:</td><td style="font-weight:600; text-align:right;">${settings?.currency || 'USD'}</td></tr>
          </table>
        </div>
      </div>

      <!-- PRODUCT TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="border-bottom: 2px solid #111;">
            <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">#</th>
            <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Image</th>
            <th style="padding: 12px 0; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Description</th>
            <th style="padding: 12px 0; text-align: center; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Qty</th>
            <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Unit Price</th>
            <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase;">Total</th>
            ${isInternal ? `
              <th style="padding: 12px 0; text-align: right; font-size: 11px; font-weight: 600; color: #d32f2f; text-transform: uppercase; border-left: 1px solid #eee; padding-left: 12px;">Unit Cost</th>
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
      <div style="display: flex; justify-content: flex-end; page-break-inside: avoid;">
        <div style="width: 350px;">
          <table style="width: 100%; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Total Items</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${totalQty}</td>
            </tr>
            <tr style="border-bottom: 2px solid #111;">
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

      <!-- FOOTER -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; page-break-inside: avoid;">
        <div style="font-weight: 600; color: #444; margin-bottom: 4px; font-size: 13px;">${settings?.companyName || 'Tezhhomayaa'}</div>
        <div>${settings?.companyAddress || ''}</div>
        <div style="margin-top: 4px;">P: ${settings?.companyPhone || ''} | E: ${settings?.companyEmail || ''}</div>
        <div style="margin-top: 15px; font-style: italic;">${settings?.terms || 'Standard terms and conditions apply.'}</div>
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
