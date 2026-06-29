import { generateInvoicePDFBlob } from './Pdfgenerator';
import { formatCurrency, formatDate } from './formatters';

/* ─────────────────────────────────────────────
   Build WhatsApp / text summary of invoice
───────────────────────────────────────────── */
const buildInvoiceText = (invoice, businessInfo) => {
  const biz   = businessInfo.business_name || 'InvoiceTa';
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const lines = items.map(
    (it) => `  • ${it.description} (${it.quantity}x) — ${formatCurrency(it.quantity * it.price)}`
  );

  return [
    `*INVOICE dari ${biz}*`,
    ``,
    `No: *${invoice.invoice_number}*`,
    `Tanggal: ${formatDate(invoice.created_at)}`,
    ``,
    `*Kepada:* ${invoice.customer_name}`,
    invoice.customer_phone ? `${invoice.customer_phone}` : '',
    invoice.customer_email ? `${invoice.customer_email}` : '',
    ``,
    `🛒 *Detail Item:*`,
    ...lines,
    ``,
    invoice.tax > 0
      ? `Subtotal: ${formatCurrency(invoice.subtotal)}\n💰 Pajak (${invoice.tax}%): ${formatCurrency(invoice.subtotal * invoice.tax / 100)}`
      : '',
    invoice.discount > 0
      ? `Diskon: -${formatCurrency(invoice.discount)}`
      : '',
    ``,
    `*TOTAL: ${formatCurrency(invoice.total)}*`,
    ``,
    invoice.notes ? `Catatan: ${invoice.notes}\n` : '',
    `Status: *${(invoice.status || 'draft').toUpperCase()}*`,
    ``,
    `_Terima kasih atas kepercayaan Anda! 🙏_`,
  ]
    .filter((l) => l !== '')
    .join('\n');
};

/* ─────────────────────────────────────────────
   SHARE via Web Share API (with PDF)
   Falls back to WhatsApp text or download
───────────────────────────────────────────── */
export const shareInvoice = async (invoice, businessInfo, isPremium) => {
  const text = buildInvoiceText(invoice, businessInfo);
  const filename = `${invoice.invoice_number}.pdf`;

  // 1. Try native share with PDF blob
  if (navigator.canShare) {
    try {
      const blob = await generateInvoicePDFBlob(invoice, businessInfo, isPremium);
      if (blob) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoice_number}`,
            text : `Terimakasih sudah order di ${businessInfo.business_name} dan berikut kami kirimkan invoice (${invoice.invoice_number}). Mohon di cek kembali detail pesanannya.`,
            files: [file],
          });
          return { success: true, method: 'native-pdf' };
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native PDF share failed, trying text share:', err);
      } else {
        return { success: false, method: 'aborted' };
      }
    }

    // 2. Try native share text-only
    try {
      await navigator.share({
        title: `Invoice ${invoice.invoice_number}`,
        text,
      });
      return { success: true, method: 'native-text' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, method: 'aborted' };
      console.warn('Native text share failed:', err);
    }
  }

  // 3. Fallback: open WhatsApp with message
  return shareViaWhatsApp(invoice, businessInfo);
};

/* ─────────────────────────────────────────────
   SHARE via WhatsApp (phone number optional)
───────────────────────────────────────────── */
export const shareViaWhatsApp = (invoice, businessInfo) => {
  const text   = buildInvoiceText(invoice, businessInfo);
  const phone  = invoice.customer_phone?.replace(/\D/g, '') || '';
  const encoded = encodeURIComponent(text);
  const url   = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'whatsapp' };
};

/* ─────────────────────────────────────────────
   COPY invoice summary to clipboard
───────────────────────────────────────────── */
export const copyInvoiceToClipboard = async (invoice, businessInfo) => {
  const text = buildInvoiceText(invoice, businessInfo);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
};

/* ─────────────────────────────────────────────
   Re-export PDF download for convenience
───────────────────────────────────────────── */
export { generateInvoicePDFBlob } from './Pdfgenerator';
export { generateInvoicePDF }     from './Pdfgenerator';