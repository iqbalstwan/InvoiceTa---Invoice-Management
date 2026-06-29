import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, DollarSign, FileText, Clock, Plus, BarChart3, Lock } from 'lucide-react';

export default function Dashboard({ subscription, setCurrentPage }) {
  const { user } = useAuth();
  const [period, setPeriod]   = useState('month');
  const [stats, setStats]     = useState({ totalInvoices: 0, totalRevenue: 0, averageInvoice: 0, unpaidInvoices: 0, totalCost: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const isPremium = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free';
  const isPro = isPremium;

  useEffect(() => { if (user && isPremium) loadAnalytics(); else setLoading(false); }, [user, period, isPremium]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: invoices, error: fetchError } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      // Fetch expenses
      const { data: expensesData, error: expenseError } = await supabaseClient
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id);

      if (expenseError) throw new Error(expenseError.message);

      const totalCost = expensesData ? expensesData.reduce((s, e) => s + (e.amount || 0), 0) : 0;

      if (!invoices || invoices.length === 0) {
        setStats({ totalInvoices: 0, totalRevenue: 0, averageInvoice: 0, unpaidInvoices: 0, totalCost, netProfit: -totalCost });
        setChartData([]);
        setRecentInvoices([]);
        return;
      }

      const validInvoices = invoices.filter(i => i.status !== 'cancel');
      
      const totalRevenue    = validInvoices.reduce((s, i) => s + (i.total || 0), 0);
      const netProfit       = totalRevenue - totalCost;
      const totalInvoices   = validInvoices.length;
      const averageInvoice  = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
      const unpaidInvoices  = validInvoices.filter((i) => i.status !== 'paid').length;

      setStats({ totalInvoices, totalRevenue, averageInvoice, unpaidInvoices, totalCost, netProfit });
      setRecentInvoices(invoices.slice(0, 5));
      generateChartData(validInvoices);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (invoices) => {
    const data = {};
    invoices.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      let key, sortKey;
      if (period === 'daily') {
        key = formatDate(invoice.created_at);
        sortKey = invoice.created_at;
      } else if (period === 'month') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Minggu ${weekNum}`;
        sortKey = weekNum;
      } else {
        key = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        sortKey = date.getTime();
      }
      if (!data[key]) data[key] = { label: key, total: 0, count: 0, sortKey };
      data[key].total += invoice.total || 0;
      data[key].count += 1;
    });
    setChartData(
      Object.values(data).sort((a, b) =>
        typeof a.sortKey === 'number' ? a.sortKey - b.sortKey : new Date(a.sortKey) - new Date(b.sortKey)
      )
    );
  };

  if (loading) return (
    <div className="page-loading">
      <div className="loading-spinner" />
      <span>Memuat dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="card" style={{ borderLeft: '4px solid var(--error)' }}>
      <p style={{ fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>❌ Gagal memuat dashboard</p>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{error}</p>
    </div>
  );

  const maxVal = Math.max(...chartData.map((d) => d.total), 1);

  if (!isPremium) {
    return (
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Ringkasan invoice dan pendapatan Anda</p>
        <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 640, margin: '40px auto' }}>
          <div style={{ background: 'var(--surface-container)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={32} style={{ color: 'var(--outline)' }} />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
            Dashboard Terkunci
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Upgrade ke paket Starter atau Professional untuk mengakses statistik lengkap, grafik pendapatan, dan analisis invoice Anda.
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentPage?.('pricing')}>
            Lihat Paket Berlangganan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Ringkasan invoice dan pendapatan Anda</p>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatCard label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} accent="var(--primary)" />
        <StatCard    label="Total Invoice"  value={stats.totalInvoices}               accent="var(--primary)" />
        <StatCard  label="Rata-rata"      value={formatCurrency(stats.averageInvoice)} accent="var(--primary)" />
        <StatCard     label="Belum Lunas"    value={stats.unpaidInvoices}               accent="var(--primary)" />
      </div>

      <div className="stats-grid" style={{ marginTop: 24, marginBottom: 8 }}>
        <StatCard 
          label="Total Biaya / HPP" 
          value={formatCurrency(stats.totalCost)} 
          accent="var(--secondary)" 
          locked={!isPro} 
        />
        <StatCard 
          label="Laba Bersih (Netto)" 
          value={formatCurrency(stats.netProfit)} 
          accent="var(--primary)" 
          locked={!isPro} 
        />
      </div>

      {stats.totalInvoices === 0 ? (
        <div className="empty-state">
          <BarChart3 size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px', opacity: 0.7 }} />
          <p className="empty-state-title">Belum ada invoice</p>
          <p className="empty-state-text">Buat invoice pertama Anda untuk melihat analytics</p>
          <button className="btn btn-primary" onClick={() => setCurrentPage?.('create')}>
            <Plus size={16} /> Buat Invoice
          </button>
        </div>
      ) : (
        <>
          {/* ── Chart ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                Tren Pendapatan
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['daily', 'Harian'], ['month', 'Bulanan'], ['year', 'Tahunan']].map(([p, lbl]) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="btn btn-sm"
                    style={{
                      background: period === p ? 'var(--primary-container)' : 'var(--surface-container)',
                      color: period === p ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                      borderRadius: 999,
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--outline)', padding: '40px 0' }}>
                Tidak ada data untuk periode ini
              </p>
            ) : (
              <>
                {/* SVG bar chart */}
                <svg viewBox="0 0 900 260" style={{ width: '100%', height: 200, display: 'block' }}>
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="60" y1={200 - i * 50} x2="880" y2={200 - i * 50}
                      stroke="var(--outline-variant)" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  {/* Axes */}
                  <line x1="60" y1="0" x2="60" y2="200" stroke="var(--outline-variant)" strokeWidth="1.5" />
                  <line x1="60" y1="200" x2="880" y2="200" stroke="var(--outline-variant)" strokeWidth="1.5" />

                  {/* Bars */}
                  {chartData.map((item, idx) => {
                    const bh = (item.total / maxVal) * 180;
                    const bw = Math.min((820 / chartData.length) * 0.65, 80);
                    const bx = 60 + (idx * 820) / chartData.length + ((820 / chartData.length) - bw) / 2;
                    return (
                      <g key={idx}>
                        <rect x={bx} y={200 - bh} width={bw} height={bh}
                          rx={4} fill="var(--primary-container)" opacity="0.85" />
                        <text x={bx + bw / 2} y={216} textAnchor="middle"
                          fontSize="10" fill="var(--outline)" fontFamily="Manrope, sans-serif">
                          {item.label.length > 6 ? item.label.slice(0, 6) : item.label}
                        </text>
                        {bh > 20 && (
                          <text x={bx + bw / 2} y={200 - bh - 5} textAnchor="middle"
                            fontSize="9" fill="var(--primary)" fontWeight="700" fontFamily="Manrope, sans-serif">
                            {item.count}×
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
                  {chartData.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--surface-container)', borderRadius: 8, padding: '8px 12px',
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary-container)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--outline)' }}>
                          {item.count} inv · {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Recent Invoices ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                Invoice Terbaru
              </h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pelanggan</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                      <td>{inv.customer_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency(inv.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${inv.status === 'cancel' ? 'cancel' : inv.status}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
                        {formatDate(inv.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--outline-variant)', textAlign: 'right' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage?.('history')}>
                Lihat semua →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent, locked }) {
  if (locked) {
    return (
      <div className="stat-card" style={{ borderLeftColor: 'var(--outline-variant)', background: 'var(--surface-container-highest)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
          <Lock size={14} style={{ color: 'var(--outline)' }} />
        </div>
        <div className="stat-value" style={{ color: 'var(--outline)', fontSize: 16, marginTop: 4 }}>Terkunci (Pro)</div>
      </div>
    );
  }
  return (
    <div className="stat-card" style={{ borderLeftColor: accent }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
    </div>
  );
}