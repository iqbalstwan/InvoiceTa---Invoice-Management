import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/Pdfgenerator';
import { shareInvoice, shareViaWhatsApp, copyInvoiceToClipboard } from '../utils/ShareUtilPage';
import { Download, Share2, X, CheckCircle, Search, ClipboardCopy, MessageCircle, Inbox } from 'lucide-react';

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

export default function History({ subscription }) {
  const { user } = useAuth();
  const isPremium = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free';

  const [invoices, setInvoices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showShareModal, setShowShareModal]   = useState(false);
  const [businessInfo, setBusinessInfo]       = useState({});
  const [toast, setToast]                     = useState('');

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

  const handleChangeStatus = async (newStatus) => {
    if (!selectedInvoice) return;
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

  const handleDownloadPDF = async (invoice) => {
    showToast('Membuat PDF...');
    const logo = localStorage.getItem('company_logo_base64') || '';
    const ok = await generateInvoicePDF(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    showToast(ok ? 'PDF berhasil diunduh' : 'Gagal membuat PDF');
  };

  const handleShareNative = async (invoice) => {
    const logo = localStorage.getItem('company_logo_base64') || '';
    const result = await shareInvoice(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    if (result.method === 'aborted') return;
    showToast(result.success ? 'Berhasil dibagikan' : 'Gagal membagikan');
    setShowShareModal(false);
  };

  const handleShareWhatsApp = (invoice) => {
    const logo = localStorage.getItem('company_logo_base64') || '';
    shareViaWhatsApp(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    setShowShareModal(false);
  };

  const handleCopyText = async (invoice) => {
    const logo = localStorage.getItem('company_logo_base64') || '';
    const ok = await copyInvoiceToClipboard(invoice, { ...businessInfo, logo_base64: logo }, isPremium);
    showToast(ok ? 'Berhasil disalin ke clipboard' : 'Gagal menyalin');
    setShowShareModal(false);
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

      {/* Search & Filter */}
      <div className="card animate-fade-in-up" style={{ padding: '20px 24px', marginBottom: 20 }}>
        {/* Search */}
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

        {/* Filter pills */}
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
          {/* ── Desktop Table ── */}
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
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
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
                          onClick={() => { setSelectedInvoice(inv); setShowStatusModal(true); }}
                          className={BADGE_CLASS[inv.status] || 'badge badge-draft'}
                          style={{ cursor: 'pointer', border: 'none', background: undefined }}
                        >
                          {inv.status}
                        </button>
                      </td>
                      <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>
                        {formatDate(inv.created_at)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            title="Download PDF"
                            style={actionBtn('#e8f5e9', '#2e7d32')}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => { setSelectedInvoice(inv); setShowShareModal(true); }}
                            title="Bagikan"
                            style={actionBtn('#e3f2fd', '#1565c0')}
                          >
                            <Share2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div id="history-cards" className="history-cards-mobile" style={{ display: 'none' }}>
            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="history-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                <div className="history-card-header">
                  <span className="history-card-number">{inv.invoice_number}</span>
                  <button
                    onClick={() => { setSelectedInvoice(inv); setShowStatusModal(true); }}
                    className={BADGE_CLASS[inv.status] || 'badge badge-draft'}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
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
                    <span className="card-field-label">Metode</span>
                    <span className="card-field-value">{inv.payment_method || '-'}</span>
                  </div>
                </div>
                <div className="history-card-footer">
                  <button onClick={() => handleDownloadPDF(inv)}>
                    <Download size={13} style={{ display: 'inline', marginRight: 4 }} />
                    PDF
                  </button>
                  <button onClick={() => { setSelectedInvoice(inv); setShowShareModal(true); }}>
                    <Share2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Status Modal ── */}
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
              {['draft', 'sent', 'paid', 'cancel'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleChangeStatus(s)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    background: selectedInvoice.status === s
                      ? 'var(--primary-container)'
                      : 'var(--surface-container)',
                    color: selectedInvoice.status === s
                      ? 'var(--on-primary-container)'
                      : 'var(--on-surface)',
                    borderRadius: 8,
                  }}
                >
                  <CheckCircle size={16} />
                  {STATUS_LABELS[s]}
                </button>
              ))}
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

      {/* ── Share Modal ── */}
      {showShareModal && selectedInvoice && (
        <div
          className="modal active"
          onClick={(e) => e.target === e.currentTarget && setShowShareModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="modal-header" style={{ margin: 0 }}>Bagikan Invoice</h2>
              <button onClick={() => setShowShareModal(false)} style={closeBtn}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
              {selectedInvoice.invoice_number} &nbsp;•&nbsp; <strong>{formatCurrency(selectedInvoice.total)}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Native share / PDF */}
              {navigator.canShare && (
                <button
                  onClick={() => handleShareNative(selectedInvoice)}
                  className="btn"
                  style={shareOptionStyle('var(--primary-container)', 'var(--on-primary-container)')}
                >
                  <Share2 size={18} />
                  Bagikan (PDF / Native)
                </button>
              )}

              {/* WhatsApp */}
              <button
                onClick={() => handleShareWhatsApp(selectedInvoice)}
                className="btn"
                style={shareOptionStyle('#e8f5e9', '#2e7d32')}
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>

              {/* Copy text */}
              <button
                onClick={() => handleCopyText(selectedInvoice)}
                className="btn"
                style={shareOptionStyle('var(--surface-container)', 'var(--on-surface)')}
              >
                <ClipboardCopy size={18} />
                Salin Ringkasan
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="btn btn-secondary"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
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

/* ── style helpers ── */
const actionBtn = (bg, color) => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: 6,
  padding: '6px 8px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
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
  gap: 12,
});