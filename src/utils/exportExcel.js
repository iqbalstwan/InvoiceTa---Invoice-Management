import * as XLSX from 'xlsx';
import { supabaseClient } from './supabaseClient';


function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}


function fmtCurrency(num) {
  if (num == null || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}


function autoFitColumns(ws, data, headers) {
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    data.forEach(row => {
      const val = String(Object.values(row)[i] ?? '');
      if (val.length > max) max = val.length;
    });
    return { wch: Math.min(max + 4, 50) };
  });
  ws['!cols'] = colWidths;
}

/**
 * Export semua data user ke file Excel (.xlsx) dengan 4 tab/sheet
 * @param {string} userId 
 * @param {string} businessName - untuk nama file
 * @returns {Promise<boolean>} success
 */
export async function exportBackupExcel(userId, businessName) {
  try {
    // ── Fetch semua data secara parallel ──
    const [invoicesRes, productsRes, expensesRes, settingsRes] = await Promise.all([
      supabaseClient
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false }),
      supabaseClient
        .from('users')
        .select('business_name, city, contact, brand_color, footer, notes')
        .eq('id', userId)
        .single(),
    ]);

    const invoices = invoicesRes.data || [];
    const products = productsRes.data || [];
    const expenses = expensesRes.data || [];
    const settings = settingsRes.data || {};

    // ── Workbook ──
    const wb = XLSX.utils.book_new();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SHEET 1: Invoices (flatten items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const invoiceHeaders = [
      'No. Invoice', 'Pelanggan', 'Email', 'Telepon',
      'Tanggal', 'Jatuh Tempo', 'Status',
      'Item', 'Qty', 'Harga Satuan', 'Total Item',
      'Subtotal', 'PPN (%)', 'Diskon', 'Grand Total', 'Catatan'
    ];

    const invoiceRows = [];
    invoices.forEach(inv => {
      const items = Array.isArray(inv.items) ? inv.items : [];
      if (items.length === 0) {
        // Invoice tanpa items
        invoiceRows.push({
          'No. Invoice': inv.invoice_number || '-',
          'Pelanggan': inv.customer_name || '-',
          'Email': inv.customer_email || '-',
          'Telepon': inv.customer_phone || '-',
          'Tanggal': fmtDate(inv.created_at),
          'Jatuh Tempo': fmtDate(inv.due_date),
          'Status': inv.status || '-',
          'Item': '-',
          'Qty': 0,
          'Harga Satuan': 0,
          'Total Item': 0,
          'Subtotal': inv.subtotal || 0,
          'PPN (%)': inv.tax || 0,
          'Diskon': inv.discount || 0,
          'Grand Total': inv.total || 0,
          'Catatan': inv.notes || '',
        });
      } else {
        items.forEach((item, idx) => {
          invoiceRows.push({
            'No. Invoice': idx === 0 ? (inv.invoice_number || '-') : '',
            'Pelanggan': idx === 0 ? (inv.customer_name || '-') : '',
            'Email': idx === 0 ? (inv.customer_email || '-') : '',
            'Telepon': idx === 0 ? (inv.customer_phone || '-') : '',
            'Tanggal': idx === 0 ? fmtDate(inv.created_at) : '',
            'Jatuh Tempo': idx === 0 ? fmtDate(inv.due_date) : '',
            'Status': idx === 0 ? (inv.status || '-') : '',
            'Item': item.description || '-',
            'Qty': item.quantity || 0,
            'Harga Satuan': item.price || 0,
            'Total Item': (item.quantity || 0) * (item.price || 0),
            'Subtotal': idx === 0 ? (inv.subtotal || 0) : '',
            'PPN (%)': idx === 0 ? (inv.tax || 0) : '',
            'Diskon': idx === 0 ? (inv.discount || 0) : '',
            'Grand Total': idx === 0 ? (inv.total || 0) : '',
            'Catatan': idx === 0 ? (inv.notes || '') : '',
          });
        });
      }
    });

    const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows, { header: invoiceHeaders });
    autoFitColumns(wsInvoices, invoiceRows, invoiceHeaders);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SHEET 2: Produk
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const productHeaders = ['Nama Produk', 'Deskripsi', 'Harga', 'Satuan', 'Kategori', 'Dibuat'];
    const productRows = products.map(p => ({
      'Nama Produk': p.name || '-',
      'Deskripsi': p.description || '-',
      'Harga': p.price || 0,
      'Satuan': p.unit || 'pcs',
      'Kategori': p.category || '-',
      'Dibuat': fmtDate(p.created_at),
    }));

    const wsProducts = XLSX.utils.json_to_sheet(productRows, { header: productHeaders });
    autoFitColumns(wsProducts, productRows, productHeaders);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Produk');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SHEET 3: Pengeluaran
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const expenseHeaders = ['Tanggal', 'Nama Barang / Keperluan', 'Nominal (Rp)'];
    const expenseRows = expenses.map(e => ({
      'Tanggal': fmtDate(e.expense_date),
      'Nama Barang / Keperluan': e.name || '-',
      'Nominal (Rp)': e.amount || 0,
    }));

    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows, { header: expenseHeaders });
    autoFitColumns(wsExpenses, expenseRows, expenseHeaders);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SHEET 4: Pengaturan
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const settingsRows = [
      { 'Pengaturan': 'Nama Bisnis', 'Nilai': settings.business_name || '-' },
      { 'Pengaturan': 'Kota', 'Nilai': settings.city || '-' },
      { 'Pengaturan': 'Kontak', 'Nilai': settings.contact || '-' },
      { 'Pengaturan': 'Warna Brand', 'Nilai': settings.brand_color || '-' },
      { 'Pengaturan': 'Catatan Default', 'Nilai': settings.notes || '-' },
      { 'Pengaturan': 'Footer PDF', 'Nilai': settings.footer || '-' },
      { 'Pengaturan': '', 'Nilai': '' },
      { 'Pengaturan': 'Tanggal Backup', 'Nilai': fmtDate(new Date().toISOString()) },
      { 'Pengaturan': 'Total Invoices', 'Nilai': invoices.length },
      { 'Pengaturan': 'Total Produk', 'Nilai': products.length },
      { 'Pengaturan': 'Total Pengeluaran', 'Nilai': expenses.length },
    ];
    const settingsHeaders = ['Pengaturan', 'Nilai'];

    const wsSettings = XLSX.utils.json_to_sheet(settingsRows, { header: settingsHeaders });
    autoFitColumns(wsSettings, settingsRows, settingsHeaders);
    XLSX.utils.book_append_sheet(wb, wsSettings, 'Pengaturan');

    const safeName = (businessName || 'Backup').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Backup';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Backup_${safeName}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
    return true;
  } catch (err) {
    console.error('Export Excel error:', err);
    throw err;
  }
}
