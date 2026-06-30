import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate } from './formatters';
import { DEFAULT_LOGO_BASE64 } from './defaultLogo';


const buildInvoiceHTML = (invoice, businessInfo, isPremium) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal  = Number(invoice.subtotal)  || 0;
  const taxAmt    = invoice.tax  > 0 ? subtotal * (invoice.tax  / 100) : 0;
  const discAmt   = Number(invoice.discount)  || 0;
  const total     = Number(invoice.total)     || subtotal + taxAmt - discAmt;

  const logoBase64 = businessInfo.logo_base64 || DEFAULT_LOGO_BASE64;
  const themeColor = isPremium && businessInfo.brand_color ? businessInfo.brand_color : '#58341d';

  const hexToRgb = (hex) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return [(c>>16)&255, (c>>8)&255, c&255].join(',');
    }
    return '88,52,29';
  };
  const themeRgb = hexToRgb(themeColor);
  const lightBg = `rgba(${themeRgb}, 0.06)`;
  const mediumBg = `rgba(${themeRgb}, 0.10)`;

  const logoHTML = logoBase64
    ? `<img src="${logoBase64}" style="
        width: 88px; height: 88px; border-radius: 50%;
        object-fit: cover; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      " />`
    : ``;


  let rowNum = 0;

  return `
    <div style="
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      background: #ffffff;
      color: #333333;
      font-size: 13px;
      line-height: 1.6;
    ">
      <!-- ═══ Top Accent Line ═══ -->
      <div style="height: 4px; background: ${themeColor};"></div>

      <div style="padding: 40px 44px 36px;">

        <!-- ═══ Header ═══ -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${logoHTML}
            <div>
              <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 800; color: ${themeColor}; margin: 0; letter-spacing: -0.3px;">${businessInfo.business_name || 'Business'}</h1>
              <p style="margin:4px 0 0;font-size:11.5px;color:#888;letter-spacing:0.2px;">
                ${businessInfo.city || ''}${businessInfo.city && businessInfo.contact ? '  •  ' : ''}${businessInfo.contact || ''}
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 900; color: ${themeColor}; letter-spacing: 3px; text-transform: uppercase;">INVOICE</h2>
            <p style="margin:0;font-size:13px;color:#666;font-weight:500;letter-spacing:0.5px;">${invoice.invoice_number}</p>
          </div>
        </div>

        <!-- ═══ Thin Separator Line ═══ -->
        <div style="height: 1px; background: linear-gradient(to right, ${themeColor}, rgba(${themeRgb}, 0.15)); margin: 18px 0 24px;"></div>

        <!-- ═══ Info Section ═══ -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div style="flex: 1;">
            <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${themeColor};margin:0 0 8px;opacity:0.7;">Kepada</p>
            <p style="margin:0;font-weight:700;font-size:15px;color:#1a1a1a;">${invoice.customer_name}</p>
            ${invoice.customer_email ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${invoice.customer_email}</p>` : ''}
            ${invoice.customer_phone ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${invoice.customer_phone}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${themeColor};margin:0 0 8px;opacity:0.7;">Tanggal</p>
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${formatDate(invoice.created_at)}</p>
          </div>
          
        </div>

        <!-- ═══ Thin Separator Line ═══ -->
        <div style="height: 1px; background: #e8e8e8; margin: 20px 0 24px;"></div>

        <!-- ═══ Table ═══ -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <thead>
            <tr>
              <th style="background:${themeColor};padding:10px 14px;text-align:left;font-size:9.5px;font-weight:700;color:#ffffff;letter-spacing:1.2px;text-transform:uppercase;width:36px;">No</th>
              <th style="background:${themeColor};padding:10px 14px;text-align:left;font-size:9.5px;font-weight:700;color:#ffffff;letter-spacing:1.2px;text-transform:uppercase;">Deskripsi</th>
              <th style="background:${themeColor};padding:10px 14px;text-align:center;font-size:9.5px;font-weight:700;color:#ffffff;letter-spacing:1.2px;text-transform:uppercase;width:55px;">Qty</th>
              <th style="background:${themeColor};padding:10px 14px;text-align:right;font-size:9.5px;font-weight:700;color:#ffffff;letter-spacing:1.2px;text-transform:uppercase;width:115px;">Harga</th>
              <th style="background:${themeColor};padding:10px 14px;text-align:right;font-size:9.5px;font-weight:700;color:#ffffff;letter-spacing:1.2px;text-transform:uppercase;width:115px;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr style="background:${idx % 2 === 0 ? '#ffffff' : lightBg};">
                <td style="padding:11px 14px;border-bottom:1px solid #eee;color:#999;font-size:12px;text-align:center;">${idx + 1}</td>
                <td style="padding:11px 14px;border-bottom:1px solid #eee;color:#333;font-size:13px;">${item.description || '-'}</td>
                <td style="padding:11px 14px;text-align:center;border-bottom:1px solid #eee;color:#555;font-size:13px;">${item.quantity}</td>
                <td style="padding:11px 14px;text-align:right;border-bottom:1px solid #eee;color:#555;font-size:13px;">${formatCurrency(item.price)}</td>
                <td style="padding:11px 14px;text-align:right;border-bottom:1px solid #eee;font-weight:600;color:#333;font-size:13px;">${formatCurrency(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- ═══ Totals ═══ -->
        <div style="display:flex; justify-content:flex-end; margin-bottom: 28px;">
          <div style="width: 300px;">
            <!-- Thin line above totals -->
            <div style="height: 1px; background: #e0e0e0; margin-bottom: 4px;"></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;">
              <span style="color:#666;">Subtotal</span>
              <span style="font-weight:600;color:#333;">${formatCurrency(subtotal)}</span>
            </div>
            <!-- Thin dotted line -->
            <div style="height: 1px; border-bottom: 1px dashed #ddd;"></div>
            ${invoice.tax > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;">
              <span style="color:#666;">Pajak (${invoice.tax}%)</span>
              <span style="color:#333;">${formatCurrency(taxAmt)}</span>
            </div>
            <div style="height: 1px; border-bottom: 1px dashed #ddd;"></div>` : ''}
            ${discAmt > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;">
              <span style="color:#666;">Diskon</span>
              <span style="color:#c62828;font-weight:600;">-${formatCurrency(discAmt)}</span>
            </div>
            <div style="height: 1px; border-bottom: 1px dashed #ddd;"></div>` : ''}
            <!-- Solid thin line before total -->
            <div style="height: 2px; background: ${themeColor}; margin-top: 6px;"></div>
            <div style="display:flex;justify-content:space-between;padding:12px 0 4px;font-size:18px;font-weight:800;color:${themeColor};">
              <span>Total</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <!-- ═══ Notes ═══ -->
        ${invoice.notes ? `
        <div style="border-left: 3px solid ${themeColor}; padding: 12px 18px; margin-bottom: 32px; background: ${lightBg}; border-radius: 0 6px 6px 0;">
          <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${themeColor};opacity:0.7;">Catatan</p>
          <p style="margin:0;font-size:12px;color:#444;line-height:1.6;white-space:pre-wrap;">${invoice.notes}</p>
        </div>` : ''}

        <!-- ═══ Footer ═══ -->
        <div style="text-align: center; margin-top: 24px;">
          <div style="width: 30px; height: 2px; background: ${themeColor}; margin: 0 auto 16px; opacity: 0.3; border-radius: 2px;"></div>
          <p style="margin: 0; font-size: 11px; color: #666; letter-spacing: 0.3px; font-weight: 500;">
            ${businessInfo.footer || 'Terima kasih atas kepercayaan Anda!'}
            <span style="color: #bbb; margin: 0 6px;">—</span>
            <strong style="font-size: 10px; color: #aaa; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">${businessInfo.business_name || 'Invoice'}</strong>
          </p>
        </div>

      </div>

      <!-- ═══ Bottom Accent Line ═══ -->
      <div style="height: 4px; background: ${themeColor};"></div>
    </div>
  `;
};


export const generateInvoicePDF = async (invoice, businessInfo, isPremium) => {
  const element = document.createElement('div');
  element.innerHTML = buildInvoiceHTML(invoice, businessInfo, isPremium);

  const options = {
    margin: [6, 6, 6, 6],
    filename: `${invoice.invoice_number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  };

  try {
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    return false;
  }
};


export const generateInvoicePDFBlob = async (invoice, businessInfo, isPremium) => {
  const element = document.createElement('div');
  element.innerHTML = buildInvoiceHTML(invoice, businessInfo, isPremium);

  const options = {
    margin: [6, 6, 6, 6],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  };

  try {
    return await html2pdf().set(options).from(element).outputPdf('blob');
  } catch (err) {
    console.error('PDF blob error:', err);
    return null;
  }
};