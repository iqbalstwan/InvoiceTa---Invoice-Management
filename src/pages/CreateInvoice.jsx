import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInvoice } from '../hooks/useInvoice';
import { useSubscription } from '../hooks/useSubscription';
import { useProduct } from '../hooks/useProduct';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, calculateTotal } from '../utils/formatters';
import { Plus, Trash2, Download, AlertTriangle, Search, Package, Check, X, ShoppingBag, Sparkles, Calendar } from 'lucide-react';
import { showToast } from '../utils/toast';


function ProductPickerModal({ products, onSelect, onClose, currentDescription }) {
const [search, setSearch] = useState('');
const searchRef = useRef(null);

useEffect(() => {
  searchRef.current?.focus();
  const handleEsc = (e) => e.key === 'Escape' && onClose();
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [onClose]);

const filtered = products.filter(p =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  (p.category || '').toLowerCase().includes(search.toLowerCase())
);

return (
  <div
    className="product-picker-overlay"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="product-picker-modal">
      {/* Header */}
      <div className="product-picker-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--gradient-warm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingBag size={20} style={{ color: '#ffeadf' }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 20, fontWeight: 700, color: 'var(--primary)', margin: 0
              }}>
                Pilih Produk
              </h2>
              <p style={{ fontSize: 12, color: 'var(--outline)', margin: 0, marginTop: 2 }}>
                {products.length} produk tersedia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-container)', border: 'none', cursor: 'pointer',
              color: 'var(--outline)', borderRadius: 10, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-dim)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-container)'; }}
          >
            <X size={18} />
          </button>
        </div>

        
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--outline)'
          }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari produk berdasarkan nama atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="product-picker-search"
          />
        </div>
      </div>

      
      <div className="product-picker-body">
        {filtered.length > 0 ? (
          <div className="product-picker-grid">
            {filtered.map((product, idx) => {
              const isSelected = currentDescription === product.name;
              return (
                <div
                  key={product.id}
                  className={`product-pick-card${isSelected ? ' selected' : ''}`}
                  onClick={() => onSelect(product)}
                  style={{ animationDelay: `${idx * 0.04}s`, animation: 'fadeInUp 0.3s ease both' }}
                >
                  {isSelected && (
                    <div className="product-pick-check">
                      <Check size={14} />
                    </div>
                  )}
                  <div className="product-pick-card-name">{product.name}</div>
                  <div className="product-pick-card-category">
                    {product.category || 'Umum'} • {product.unit || 'pcs'}
                  </div>
                  {product.description && (
                    <p style={{
                      fontSize: 11, color: 'var(--on-surface-variant)',
                      margin: '0 0 10px', lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      position: 'relative', zIndex: 1,
                    }}>
                      {product.description}
                    </p>
                  )}
                  <div className="product-pick-card-price">
                    {formatCurrency(product.price)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            {products.length === 0 ? (
              <>
                <Package size={48} style={{ color: 'var(--outline-variant)', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                  Belum ada produk
                </p>
                <p style={{ fontSize: 13, color: 'var(--outline)' }}>
                  Buat produk terlebih dahulu di menu <strong>Produk/Jasa</strong>
                </p>
              </>
            ) : (
              <>
                <Search size={40} style={{ color: 'var(--outline-variant)', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
                  Tidak ditemukan produk untuk "<strong>{search}</strong>"
                </p>
              </>
            )}
          </div>
        )}
      </div>

    
      <div className="product-picker-footer">
        <span style={{ fontSize: 12, color: 'var(--outline)' }}>
          {filtered.length} dari {products.length} produk
        </span>
        <button onClick={onClose} className="btn btn-secondary btn-sm">
          Tutup
        </button>
      </div>
    </div>
  </div>
);
}


export default function CreateInvoiceEnhanced({ subscription, setCurrentPage }) {
const { user } = useAuth();
const { createInvoice } = useInvoice();
const { checkInvoiceLimit } = useSubscription();
const { getProducts } = useProduct();

const [settings, setSettings] = useState({
  business_name: 'TinkerWorks',
  city: '',
  contact: '',
  notes:''
});

const [products, setProducts] = useState([]);
const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);

const [form, setForm] = useState({
  invoice_number: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  due_date: '',
  items: [{ id: 1, description: '', quantity: 1, price: 0 }],
  tax: 0,
  discount: 0,
  notes: localStorage.getItem('default_invoice_notes') || '',
});

const [canCreate, setCanCreate] = useState(true);
const [pickerForItem, setPickerForItem] = useState(null); // item.id or null

useEffect(() => {
  loadSettingsAndProducts();
  checkLimit();
}, [user]);

const loadSettingsAndProducts = async () => {
  try {
    
    const { data: userData } = await supabaseClient
      .from('users')
      .select('business_name, city, contact, next_invoice_number,notes')
      .eq('id', user.id)
      .single();

    if (userData) {
      setSettings(userData);
      setNextInvoiceNumber(userData.next_invoice_number || 1);
      
      
      const year = new Date().getFullYear();
      const nextNumber = String(userData.next_invoice_number ?? 1).padStart(6, '0');

      const invoiceNum = `INV-${year}-${nextNumber}`;

      setForm(prev => ({
      ...prev,
      invoice_number: invoiceNum,
      notes: userData.notes || ''
}      ));
    }

    
    const productsData = await getProducts(user.id);
    setProducts(productsData);
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

const checkLimit = async () => {
  try {
    const { count } = await supabaseClient
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const limit = subscription?.subscription_plans?.invoice_limit || 5;
    if (limit !== -1 && count >= limit) {
      setCanCreate(false);
    }
  } catch (error) {
    console.error('Error checking limit:', error);
  }
};

const updateItem = (id, field, value) => {
  setForm({
    ...form,
    items: form.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ),
  });
};

const addItem = () => {
  const newId = Math.max(...form.items.map(i => i.id), 0) + 1;
  setForm({
    ...form,
    items: [...form.items, { id: newId, description: '', quantity: 1, price: 0 }],
  });
};

const removeItem = (id) => {
  if (form.items.length === 1) {
    showToast('Minimal harus ada 1 item', 'error');
    return;
  }
  setForm({
    ...form,
    items: form.items.filter(item => item.id !== id),
  });
};

const addProductToItem = (itemId, product) => {
  setForm({
    ...form,
    items: form.items.map(item =>
      item.id === itemId 
        ? { ...item, description: product.name, price: product.price }
        : item
    ),
  });
  setPickerForItem(null);
};

const totals = calculateTotal(form.items, form.tax, form.discount);

const handleCreateInvoice = async () => {
  if (!form.customer_name || form.items.length === 0) {
    showToast('Isi nama pelanggan dan minimal 1 item', 'error');
    return;
  }


  if (form.items.some(item => !item.description)) {
    showToast('Semua item harus memiliki deskripsi', 'error');
    return;
  }

  try {
    const invoice = await createInvoice(
      {
        invoice_number: form.invoice_number,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        due_date: form.due_date || null,
        items: form.items,
        subtotal: totals.subtotal,
        tax: form.tax,
        discount: form.discount,
        total: totals.total,
        notes: form.notes,
      },
      user.id
    );

   
    await supabaseClient
      .from('users')
      .update({ next_invoice_number: nextInvoiceNumber + 1 })
      .eq('id', user.id);

    showToast('Invoice berhasil dibuat!', 'success');
    
   
    const newInvoiceNum = 'INV-' + String(nextInvoiceNumber + 1).padStart(4, '0');
    setForm({
      invoice_number: newInvoiceNum,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      due_date: '',
      items: [{ id: 1, description: '', quantity: 1, price: 0 }],
      tax: 0,
      discount: 0,
      notes: localStorage.getItem('default_invoice_notes') || '',
    });
    setNextInvoiceNumber(nextInvoiceNumber + 1);

    checkLimit();
  } catch (error) {
    showToast('Gagal membuat invoice: ' + error.message, 'error');
  }
};

if (!canCreate) {
  return (
    <div>
      <h1 className="page-title">Buat Invoice</h1>
      <p className="page-sub">Isi detail invoice dan pilih produk/jasa yang dijual</p>
      <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 640, margin: '40px auto' }}>
        <div style={{ background: 'var(--surface-container)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={32} style={{ color: 'var(--outline)' }} />
        </div>
        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
          Batas Invoice Tercapai
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          Anda telah mencapai batas pembuatan invoice ({subscription?.subscription_plans?.invoice_limit} invoice/bulan). Upgrade paket untuk invoice tak terbatas.
        </p>
        <button className="btn btn-primary" onClick={() => setCurrentPage?.('pricing')}>
          <Sparkles size={16} />
          Upgrade Sekarang
        </button>
      </div>
    </div>
  );
}

return (
  <div>
    <h1 className="page-title">Buat Invoice</h1>
    <p className="page-sub">Isi detail invoice dan pilih produk/jasa yang dijual</p>

    <div className="card animate-fade-in-up">
      
      <div className="form-grid">
       
        <div>
          <label className="form-label">No. Invoice</label>
          <input
            type="text"
            value={form.invoice_number}
            disabled
            className="form-input"
            style={{ background: 'var(--surface-container)', cursor: 'not-allowed', color: 'var(--outline)' }}
          />
          <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4, fontStyle: 'italic' }}>Auto-generated</p>
        </div>

       
        <div>
          <label className="form-label">Nama Pelanggan *</label>
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            placeholder="Masukkan nama pelanggan"
            className="form-input"
          />
        </div>

       
        <div>
          <label className="form-label">Email Pelanggan</label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
            placeholder="email@example.com"
            className="form-input"
          />
        </div>

       
        <div>
          <label className="form-label">No. WhatsApp / Telepon</label>
          <input
            type="text"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="Contoh: 081234567890"
            className="form-input"
          />
        </div>

     
        <div>
          <label className="form-label">Jatuh Tempo (Opsional)</label>
          <div style={{ position: 'relative' }}>
            <Calendar
              size={16}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--outline)', pointerEvents: 'none',
              }}
            />
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="form-input"
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
      </div>

    
      <div style={{ marginBottom: 28, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Detail Barang/Jasa
            </h3>
          </div>
          <button
            onClick={addItem}
            className="btn btn-primary"
          >
            <Plus size={14}
             />
            
          </button>
        </div>

      
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {form.items.map((item, idx) => (
            <div
              key={item.id}
              className="animate-fade-in-up"
              style={{
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 14,
                padding: 20,
                transition: 'all 0.25s',
                animationDelay: `${idx * 0.05}s`,
              }}
            >
            
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 10, marginBottom: 6 }}>
                  Produk/Jasa *
                </label>
                {item.description ? (
                  
                  <div
                    className="product-chip"
                    onClick={() => setPickerForItem(item.id)}
                    title="Klik untuk mengganti produk"
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--primary-container)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Package size={14} style={{ color: '#ffeadf' }} />
                    </div>
                    <span>{item.description}</span>
                    <span className="product-chip-price">{formatCurrency(item.price)}</span>
                  </div>
                ) : (
                  
                  <button
                    className="product-select-btn"
                    onClick={() => setPickerForItem(item.id)}
                    type="button"
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--surface-container-high)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <ShoppingBag size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--on-surface-variant)' }}>
                        Pilih Produk
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--outline)', marginTop: 1 }}>
                        Klik untuk memilih dari katalog
                      </div>
                    </div>
                  </button>
                )}
              </div>

             
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 10, marginBottom: 4 }}>Qty</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="form-input"
                    style={{ textAlign: 'center', padding: '9px 10px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 10, marginBottom: 4 }}>Harga</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                    className="form-input"
                    style={{ textAlign: 'right', padding: '9px 10px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 10, marginBottom: 4 }}>Total</label>
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--surface-container)',
                    fontWeight: 700, fontSize: 14,
                    color: 'var(--primary)', textAlign: 'right',
                    border: '1px solid var(--outline-variant)',
                  }}>
                    {formatCurrency(item.quantity * item.price)}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '9px 10px', borderRadius: 10, marginBottom: 0 }}
                  title="Hapus item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      <div className="form-grid" style={{ maxWidth: '100%', alignItems: 'start' }}>
        <div>
          <label className="form-label">PPN (%)</label>
          <input
            type="number"
            value={form.tax}
            onChange={(e) => setForm({ ...form, tax: parseInt(e.target.value) || 0 })}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Diskon (Rp)</label>
          <input
            type="number"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 0 })}
            className="form-input"
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="form-label">Catatan Invoice (Opsional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Tambahkan catatan khusus untuk invoice ini..."
          rows="3"
          className="form-input"
        />
      </div>

   
      <div
        style={{
          background: 'var(--gradient-warm-soft)',
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
          border: '1px solid var(--outline-variant)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--on-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PPN ({form.tax}%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(totals.taxAmount)}</span>
            </div>
          )}
          {totals.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--primary)',
              paddingTop: 14,
              borderTop: '2px solid var(--primary-container)',
              marginTop: 4,
              fontFamily: "'Source Serif 4', serif",
            }}
          >
            <span>TOTAL</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

     
      <button
        onClick={handleCreateInvoice}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
      >
        <Download size={18} />
        Buat & Simpan Invoice
      </button>
    </div>

   
    {pickerForItem !== null && (
      <ProductPickerModal
        products={products}
        currentDescription={form.items.find(i => i.id === pickerForItem)?.description || ''}
        onSelect={(product) => addProductToItem(pickerForItem, product)}
        onClose={() => setPickerForItem(null)}
      />
    )}
  </div>
);
}