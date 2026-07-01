import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/Pdfgenerator';
import { shareInvoice } from '../utils/ShareUtilPage';
import { Download, Share2, X, CheckCircle, Search, Inbox, Eye, Lock, Pencil, Plus, Minus, Trash2 } from 'lucide-react';

const STATUS_LABELS = {
  draft:   'Draft',
  sent:    'Terkirim',
  paid:    'Lunas',
  cancel:  'Batal',
  overdue: 'Overdue',
};

const BADGE_CLASS = {
  draft:   'badge badge-draft',
  sent:    'badge badge-sent',
  paid:    'badge badge-paid',
  cancel:  'badge badge-cancel',
  overdue: 'badge badge-cancel',
};

// Status yang sama sekali tidak bisa diubah lagi
const LOCKED_STATUSES = ['paid', 'cancel'];

// Aturan transisi status: return true jika boleh pindah dari `current` ke `target`
const isStatusTransitionAllowed = (current, target) => {
  if (current === target) return true; // opsi status saat ini, tidak masalah ditampilkan
  if (LOCKED_STATUSES.includes(current)) return false; // paid & cancel: tidak bisa ganti status sama sekali
  if (current === 'sent' && target === 'draft') return false; // sent: tidak bisa balik ke draft
  return true;
};

// Status yang masih memperbolehkan invoice & item produknya diedit
const EDITABLE_STATUSES = ['draft'];
const isInvoiceEditable = (status) => EDITABLE_STATUSES.includes(status);

export default function History({ subscription }) {
  const { user } = useAuth();
  const isPremium = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free';

  const [invoices, setInvoices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [businessInfo, setBusinessInfo]       = useState({});
  const [toast, setToast]                     = useState('');

  const [showEditModal, setShowEditModal]         = useState(false);
  const [editForm, setEditForm]                   = useState(null); // { customer_name, due_date, items: [] }
  const [products, setProducts]                   = useState([]);
  const [loadingProducts, setLoadingProducts]     = useState(false);
  const [savingEdit, setSavingEdit]               = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    loadInvoices();
    loadBusinessInfo();
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessInfo = async () => {
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('business_name, city, contact, brand_color,notes,footer')
        .eq('id', user.id)
        .single();
      if (data) setBusinessInfo(data);
    } catch {}
  };

  const handleOpenStatusModal = (invoice) => {
    if (LOCKED_STATUSES.includes(invoice.status)) {
      showToast(`Status "${STATUS_LABELS[invoice.status] || invoice.status}" tidak dapat diubah`);
      return;
    }
    setSelectedInvoice(invoice);
    setShowStatusModal(true);
  };

  const handleChangeStatus = async (newStatus) => {
    if (!selectedInvoice) return;
    if (!isStatusTransitionAllowed(selectedInvoice.status, newStatus)) {
      showToast('Perubahan status ini tidak diizinkan');
      return;
    }
    try {
      const { error } = await supabaseClient
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', selectedInvoice.id);
      if (error) throw error;
      setInvoices((prev) =>
        prev.map((inv) => inv.id === selectedInvoice.id ? { ...inv, status: newStatus } : inv)
      );
      setShowStatusModal(false);
      setSelectedInvoice(null);
      showToast(`Status berhasil diperbarui ke ${newStatus}`);
    } catch (err) {
      showToast('Gagal memperbarui status: ' + err.message);
    }
  };

  const loadProducts = async () => {
    if (products.length > 0) return; // sudah pernah dimuat, tidak perlu fetch ulang
    setLoadingProducts(true);
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenEditModal = (invoice) => {
    if (!isInvoiceEditable(invoice.status)) {
      showToast('Invoice ini sudah tidak bisa diedit');
      return;
    }
    setSelectedInvoice(invoice);
    setEditForm({
      customer_name: invoice.customer_name || '',
      due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : '',
      items: (invoice.items || []).map((it) => ({ ...it })),
    });
    setSelectedProductId('');
    loadProducts();
    setShowEditModal(true);
  };

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const getProductName = (p) => p.name || p.product_name || p.title || 'Produk';
  const getProductPrice = (p) => Number(p.price ?? p.selling_price ?? p.harga ?? 0);

  const handleAddProductItem = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => String(p.id) === String(selectedProductId));
    if (!product) return;
    const name = getProductName(product);
    const price = getProductPrice(product);
    setEditForm((prev) => {
      const items = [...prev.items];
      const existingIdx = items.findIndex((it) => it.description === name);
      if (existingIdx > -1) {
        items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + 1 };
      } else {
        const newId = items.length > 0 ? Math.max(...items.map((it) => Number(it.id) || 0)) + 1 : 1;
        items.push({ id: newId, description: name, price, quantity: 1 });
      }
      return { ...prev, items };
    });
    setSelectedProductId('');
  };

  const handleItemQtyChange = (id, delta) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, (Number(it.quantity) || 0) + delta) } : it
      ),
    }));
  };

  const handleRemoveItem = (id) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleSaveEditInvoice = async () => {
    if (!selectedInvoice || !editForm) return;
    if (editForm.items.length === 0) {
      showToast('Invoice harus memiliki minimal 1 item');
      return;
    }
    setSavingEdit(true);
    try {
      const total = editForm.items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
        0
      );
      const { error } = await supabaseClient
        .from('invoices')
        .update({
          customer_name: editForm.customer_name,
          due_date: editForm.due_date || null,
          items: editForm.items,
          total,
        })
        .eq('id', selectedInvoice.id);
      if (error) throw error;
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, customer_name: editForm.customer_name, due_date: editForm.due_date, items: editForm.items, total }
            : inv
        )
      );
      setShowEditModal(false);
      setSelectedInvoice(null);
      setEditForm(null);
      showToast('Invoice berhasil diperbarui');
    } catch (err) {
      showToast('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    showToast('Membuat PDF...');
    const logo = localStorage.getItem('company_logo_base64') || '';
    const ok = await generateInvoicePDF(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    showToast(ok ? 'PDF berhasil diunduh' : 'Gagal membuat PDF');
  };

  const handleSharePDF = async (invoice) => {
    setShowViewModal(false);
    showToast('Menyiapkan PDF untuk dibagikan...');
    const logo = localStorage.getItem('company_logo_base64') || '';
    const result = await shareInvoice(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    if (result.method === 'aborted') return;
    showToast(result.success ? 'Berhasil dibagikan' : 'Gagal membagikan');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchFilter = filter === 'all' || inv.status === filter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <span>Memuat invoices...</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Riwayat Invoice</h1>
      <p className="page-sub">Kelola dan lihat semua invoice Anda</p>

      <div className="card animate-fade-in-up" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search
            size={15}
            style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--outline)',
            }}
          />
          <input
            id="search-input"
            type="text"
            placeholder="Cari no. invoice atau pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'draft', 'sent', 'paid', 'cancel'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm"
              style={{
                background: filter === s ? 'var(--primary-container)' : 'var(--surface-container)',
                color: filter === s ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                borderRadius: 999,
                fontWeight: filter === s ? 700 : 500,
              }}
            >
              {s === 'all' ? 'Semua' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--outline)', marginTop: 10 }}>
          {filteredInvoices.length} dari {invoices.length} invoice
        </p>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} style={{ color: 'var(--outline)', margin: '0 auto 16px', opacity: 0.6 }} />
          <p className="empty-state-title">Tidak ada invoice</p>
          <p className="empty-state-text">Coba ubah filter atau buat invoice baru</p>
        </div>
      ) : (
        <>
          <div id="history-table-wrap" className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '0.05s' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pelanggan</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Tanggal</th>
                    <th>Jatuh Tempo</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const statusLocked = LOCKED_STATUSES.includes(inv.status);
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ color: 'var(--on-surface)' }}>{inv.customer_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {formatCurrency(inv.total)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenStatusModal(inv)}
                            className={BADGE_CLASS[inv.status] || 'badge badge-draft'}
                            style={{
                              cursor: statusLocked ? 'not-allowed' : 'pointer',
                              border: 'none',
                              background: undefined,
                              opacity: statusLocked ? 0.7 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {statusLocked && <Lock size={11} />}
                            {inv.status}
                          </button>
                        </td>
                        <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>
                          {formatDate(inv.created_at)}
                        </td>
                        <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>
                          {formatDate(inv.due_date)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => { setSelectedInvoice(inv); setShowViewModal(true); }}
                              title="Lihat Invoice"
                              style={actionBtn('var(--surface-container)', 'var(--on-surface)')}
                            >
                              <Eye size={15} />
                              &nbsp;Lihat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div id="history-cards" className="history-cards-mobile" style={{ display: 'none' }}>
            {filteredInvoices.map((inv) => {
              const statusLocked = LOCKED_STATUSES.includes(inv.status);
              return (
                <div key={inv.id} className="history-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                  <div className="history-card-header">
                    <span className="history-card-number">{inv.invoice_number}</span>
                    <button
                      onClick={() => handleOpenStatusModal(inv)}
                      className={BADGE_CLASS[inv.status] || 'badge badge-draft'}
                      style={{
                        cursor: statusLocked ? 'not-allowed' : 'pointer',
                        border: 'none',
                        opacity: statusLocked ? 0.7 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {statusLocked && <Lock size={11} />}
                      {inv.status}
                    </button>
                  </div>
                  <div className="history-card-body">
                    <div className="card-field">
                      <span className="card-field-label">Pelanggan</span>
                      <span className="card-field-value">{inv.customer_name}</span>
                    </div>
                    <div className="card-field">
                      <span className="card-field-label">Total</span>
                      <span className="card-field-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {formatCurrency(inv.total)}
                      </span>
                    </div>
                    <div className="card-field">
                      <span className="card-field-label">Tanggal</span>
                      <span className="card-field-value">{formatDate(inv.created_at)}</span>
                    </div>
                    <div className="card-field">
                      <span className="card-field-label">Jatuh Tempo</span>
                      <span className="card-field-value">{formatDate(inv.due_date)}</span>
                    </div>
                  </div>
                  <div className="history-card-footer" style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setSelectedInvoice(inv); setShowViewModal(true); }} style={{ flex: 1 }}>
                      <Eye size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Lihat Invoice
                    </button>
                    {isInvoiceEditable(inv.status) && (
                      <button onClick={() => handleOpenEditModal(inv)} style={{ flex: 1 }}>
                        <Pencil size={13} style={{ display: 'inline', marginRight: 4 }} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showViewModal && selectedInvoice && (
        <div
          className="modal active"
          onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-header" style={{ margin: 0 }}>Detail Invoice</h2>
              <button onClick={() => setShowViewModal(false)} style={closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              <div style={rowStyle}>
                <span style={labelStyle}>No. Invoice</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedInvoice.invoice_number}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Pelanggan</span>
                <span style={{ fontWeight: 600 }}>{selectedInvoice.customer_name}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Status</span>
                <span className={BADGE_CLASS[selectedInvoice.status] || 'badge badge-draft'}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Tanggal</span>
                <span>{formatDate(selectedInvoice.created_at)}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Jatuh Tempo</span>
                <span>{formatDate(selectedInvoice.due_date)}</span>
              </div>
            </div>

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .3 }}>
                  Item Invoice
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={it.id ?? idx}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        fontSize: 13, padding: '8px 10px', background: 'var(--surface-container)', borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.description}</div>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
                          {it.quantity} x {formatCurrency(it.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency((Number(it.quantity) || 0) * (Number(it.price) || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isInvoiceEditable(selectedInvoice.status) && (
              <button
                onClick={() => { setShowViewModal(false); handleOpenEditModal(selectedInvoice); }}
                className="btn"
                style={{ width: '100%', marginBottom: 10, ...shareOptionStyle('#fff3e0', '#e65100'), justifyContent: 'center' }}
              >
                <Pencil size={16} />
                Edit Invoice
              </button>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="btn"
                style={{ flex: 1, ...shareOptionStyle('#e8f5e9', '#2e7d32'), justifyContent: 'center' }}
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={() => handleSharePDF(selectedInvoice)}
                className="btn"
                style={{ flex: 1, ...shareOptionStyle('#e3f2fd', '#1565c0'), justifyContent: 'center' }}
              >
                <Share2 size={16} />
                Bagikan
              </button>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="btn btn-secondary"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {showEditModal && selectedInvoice && editForm && (
        <div
          className="modal active"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-header" style={{ margin: 0 }}>Edit Invoice</h2>
              <button onClick={() => setShowEditModal(false)} style={closeBtn}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Invoice: <strong>{selectedInvoice.invoice_number}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Nama Pelanggan</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.customer_name}
                  onChange={(e) => updateEditField('customer_name', e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Jatuh Tempo</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.due_date}
                  onChange={(e) => updateEditField('due_date', e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .3 }}>
              Item Produk
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 240, overflowY: 'auto' }}>
              {editForm.items.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--outline)' }}>
                  Belum ada item. Tambahkan produk di bawah.
                </p>
              )}
              {editForm.items.map((it) => (
                <div
                  key={it.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--surface-container)', borderRadius: 8 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {formatCurrency(it.price)} / item
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleItemQtyChange(it.id, -1)}
                      style={{ ...actionBtn('var(--surface)', 'var(--on-surface)'), padding: '4px 6px' }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => handleItemQtyChange(it.id, 1)}
                      style={{ ...actionBtn('var(--surface)', 'var(--on-surface)'), padding: '4px 6px' }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(it.id)}
                    title="Hapus item"
                    style={{ ...actionBtn('#ffebee', '#c62828'), padding: '4px 6px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <select
                className="form-input"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">
                  {loadingProducts ? 'Memuat produk...' : 'Pilih produk'}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getProductName(p)} — {formatCurrency(getProductPrice(p))}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddProductItem}
                disabled={!selectedProductId}
                className="btn"
                style={{
                  ...actionBtn('var(--primary-container)', 'var(--on-primary-container)'),
                  opacity: selectedProductId ? 1 : 0.5,
                  cursor: selectedProductId ? 'pointer' : 'not-allowed',
                }}
              >
                <Plus size={15} />
              </button>
            </div>

            <div style={{ ...rowStyle, marginBottom: 18, paddingTop: 12, borderTop: '1px solid var(--surface-container)' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>
                {formatCurrency(
                  editForm.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
                )}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditInvoice}
                disabled={savingEdit}
                className="btn"
                style={{ flex: 1, justifyContent: 'center', ...shareOptionStyle('var(--primary-container)', 'var(--on-primary-container)'), opacity: savingEdit ? 0.7 : 1 }}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedInvoice && (
        <div
          className="modal active"
          onClick={(e) => e.target === e.currentTarget && setShowStatusModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-header" style={{ margin: 0 }}>Ubah Status</h2>
              <button onClick={() => setShowStatusModal(false)} style={closeBtn}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Invoice: <strong>{selectedInvoice.invoice_number}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['draft', 'sent', 'paid', 'cancel'].map((s) => {
                const allowed = isStatusTransitionAllowed(selectedInvoice.status, s);
                const isCurrent = selectedInvoice.status === s;
                return (
                  <button
                    key={s}
                    disabled={!allowed}
                    onClick={() => allowed && handleChangeStatus(s)}
                    className="btn"
                    style={{
                      justifyContent: 'flex-start',
                      background: isCurrent
                        ? 'var(--primary-container)'
                        : 'var(--surface-container)',
                      color: isCurrent
                        ? 'var(--on-primary-container)'
                        : allowed
                          ? 'var(--on-surface)'
                          : 'var(--outline)',
                      borderRadius: 8,
                      opacity: allowed ? 1 : 0.5,
                      cursor: allowed ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {allowed ? <CheckCircle size={16} /> : <Lock size={14} />}
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="btn btn-secondary"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24,
          background: 'var(--primary)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 4px 20px rgba(73,59,49,.3)',
          zIndex: 9999,
          animation: 'fadeIn .25s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          #history-table-wrap { display: none !important; }
          #history-cards { display: flex !important; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

const actionBtn = (bg, color) => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: 6,
  padding: '6px 10px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  transition: 'opacity .15s',
});

const closeBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--on-surface-variant)',
  display: 'flex',
  alignItems: 'center',
};

const shareOptionStyle = (bg, color) => ({
  background: bg,
  color,
  justifyContent: 'flex-start',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  gap: 8,
});

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle = {
  fontSize: 12,
  color: 'var(--on-surface-variant)',
};