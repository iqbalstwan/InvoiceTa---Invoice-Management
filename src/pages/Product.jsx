import { showToast } from "../utils/toast";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/formatters';
import { Plus, Edit, Trash2, X, Inbox, CheckCircle2, HelpCircle } from 'lucide-react';

export default function Products({ subscription }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'pcs',
    category: 'Services',
  });

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name || form.price <= 0) {
      showToast('⚠️ Isi nama produk dan harga');
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabaseClient
          .from('products')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        showToast('✅ Produk berhasil diupdate');
      } else {
        // Create
        const { error } = await supabaseClient
          .from('products')
          .insert([
            {
              ...form,
              user_id: user.id,
            },
          ]);

        if (error) throw error;
        showToast('✅ Produk berhasil ditambah');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      const { error } = await supabaseClient
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadProducts();
      showToast('✅ Produk berhasil dihapus');
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: 0,
      unit: 'pcs',
      category: 'Services',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Produk/Jasa</h1>
          <p className="page-sub">Kelola produk yang akan digunakan di invoice</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal active" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                {editingId ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label className="form-label">Nama Produk *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Konsultasi, Desain, dll"
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail produk (optional)"
                  rows="3"
                  className="form-input"
                />
              </div>

              {/* Price */}
              <div>
                <label className="form-label">Harga (Rp) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="form-input"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="form-label">Satuan</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option>pcs</option>
                  <option>jam</option>
                  <option>hari</option>
                  <option>bulan</option>
                  <option>set</option>
                  <option>box</option>
                  <option>kg</option>
                  <option>meter</option>
                  <option>lainnya</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="form-label">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option>Services</option>
                  <option>Products</option>
                  <option>Consultation</option>
                  <option>Design</option>
                  <option>Development</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <span>Memuat produk...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <Inbox size={48} style={{ color: 'var(--outline)', margin: '0 auto 16px', opacity: 0.6 }} />
          <p style={{ fontSize: 15, color: 'var(--on-surface-variant)', marginBottom: 20 }}>Belum ada produk</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ margin: '0 auto' }}
          >
            Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="card"
              style={{ padding: 24, margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4 }}>
                    {product.category} • {product.unit}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4 }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginBottom: 16, flex: 1, lineClamp: 2 }}>
                  {product.description}
                </p>
              )}
              {!product.description && <div style={{ flex: 1 }} />}

              {/* Price */}
              <div
                style={{
                  padding: 14,
                  background: 'var(--surface-container)',
                  borderRadius: 8,
                  border: '1px solid var(--outline-variant)'
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', margin: '0 0 4px 0' }}>Harga</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Use in Invoice Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--outline-variant)', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>Siap digunakan di invoice</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--primary)',
          background: 'var(--surface-container)',
          padding: '16px 20px',
          marginTop: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--on-surface-variant)', margin: 0 }}>
          <HelpCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span><strong>Tip:</strong> Produk yang Anda buat di sini akan otomatis tersedia saat membuat invoice.</span>
        </div>
      </div>
    </div>
  );
}