import { showToast } from "../utils/toast";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Trash2, Lock, ShoppingCart, X } from 'lucide-react';

export default function Expenses({ subscription }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const isPro = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free'; // Allow all premium (Starter, Professional)

  useEffect(() => {
    if (user && isPro) loadExpenses();
    else setLoading(false);
  }, [user, isPro]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name || form.amount <= 0) {
      showToast('⚠️ Isi nama barang dan nominal');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('expenses')
        .insert([
          {
            ...form,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      showToast('✅ Pengeluaran berhasil dicatat');
      resetForm();
      loadExpenses();
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus catatan ini?')) return;

    try {
      const { error } = await supabaseClient
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadExpenses();
      showToast('✅ Catatan berhasil dihapus');
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
  };

  if (!isPro) {
    return (
      <div>
        <h1 className="page-title">Bahan Baku & Pengeluaran</h1>
        <p className="page-sub">Catat pembelanjaan bahan baku untuk menghitung Laba Bersih</p>
        <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 640, margin: '40px auto' }}>
          <div style={{ background: 'var(--surface-container)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={32} style={{ color: 'var(--outline)' }} />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
            Fitur Terkunci
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Upgrade ke paket Starter atau Professional untuk mencatat pengeluaran bahan baku dan melihat perhitungan Net Profit otomatis di Dashboard.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.hash = '#pricing'}>
            Lihat Paket Berlangganan
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <span>Memuat data pengeluaran...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Bahan Baku & Pengeluaran</h1>
          <p className="page-sub">Catat pembelanjaan bahan baku untuk Laba Bersih</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          Catat Pengeluaran
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal active" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                Catat Pembelanjaan
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label className="form-label">Nama Barang / Keperluan *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Beli Ayam, Gas, Kemasan"
                  className="form-input"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="form-label">Nominal (Rp) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="form-input"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="form-label">Tanggal Pembelian *</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="modal-actions" style={{ marginTop: 8 }}>
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
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card">
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <ShoppingCart size={48} style={{ color: 'var(--outline-variant)', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Belum ada catatan pembelanjaan</p>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', maxWidth: 400, margin: '0 auto' }}>
              Catat bahan baku yang Anda beli agar aplikasi dapat menghitung Net Profit harian/bulanan di Dashboard.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Barang / Keperluan</th>
                  <th style={{ textAlign: 'right' }}>Nominal (Rp)</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>
                      {formatDate(expense.expense_date)}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{expense.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--secondary)' }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 6, color: 'var(--error)' }}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
