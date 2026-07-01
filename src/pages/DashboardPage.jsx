import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, DollarSign, FileText, Clock, Plus, BarChart3, Lock, CheckCircle } from 'lucide-react';

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const start = startOfDay(now);
      start.setDate(now.getDate() - diffToMonday);
      return { start, end: endOfDay(now) };
    }
    case 'month':
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) };
    case 'lastMonth':
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case 'year':
      return { start: startOfDay(new Date(now.getFullYear(), 0, 1)), end: endOfDay(now) };
    case 'custom':
      if (!customStart || !customEnd) return null;
      return { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) };
    case 'all':
    default:
      return null; // no filter, ambil semua data
  }
}

const DATE_FILTER_OPTIONS = [
  ['all', 'Semua Waktu'],
  ['today', 'Hari Ini'],
  ['week', 'Minggu Ini'],
  ['month', 'Bulan Ini'],
  ['lastMonth', 'Bulan Lalu'],
  ['year', 'Tahun Ini'],
  ['custom', 'Custom']
];

export default function Dashboard({ subscription, setCurrentPage }) {
  const { user } = useAuth();
  const [period, setPeriod]       = useState('month');
  const [dateFilter, setDateFilter]   = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd]     = useState('');
  const [stats, setStats]         = useState({ totalInvoices: 0, totalRevenue: 0, paidRevenue: 0, paidCount: 0, unpaidInvoices: 0, totalCost: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const isPremium = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free';
  const isPro     = isPremium;

  useEffect(() => {
    if (user && isPremium) loadAnalytics();
    else setLoading(false);
  }, [user, period, isPremium, dateFilter, customStart, customEnd]);

  const loadAnalytics = async () => {
    if (dateFilter === 'custom' && (!customStart || !customEnd)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const range = getDateRange(dateFilter, customStart, customEnd);

      let invoiceQuery = supabaseClient
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let expenseQuery = supabaseClient
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id);

      if (range) {
        invoiceQuery = invoiceQuery
          .gte('created_at', range.start.toISOString())
          .lte('created_at', range.end.toISOString());
        expenseQuery = expenseQuery
          .gte('created_at', range.start.toISOString())
          .lte('created_at', range.end.toISOString());
      }

      const { data: invoices, error: fetchError } = await invoiceQuery;
      if (fetchError) throw new Error(fetchError.message);

      const { data: expensesData, error: expenseError } = await expenseQuery;
      if (expenseError) throw new Error(expenseError.message);

      const totalCost = expensesData ? expensesData.reduce((s, e) => s + (e.amount || 0), 0) : 0;

      if (!invoices || invoices.length === 0) {
        setStats({ totalInvoices: 0, totalRevenue: 0, paidRevenue: 0, paidCount: 0, unpaidInvoices: 0, totalCost, netProfit: -totalCost });
        setChartData([]);
        setRecentInvoices([]);
        return;
      }

      const validInvoices = invoices.filter(i => i.status !== 'cancel');
      const paidInvoices  = validInvoices.filter(i => i.status === 'paid');

      const totalRevenue  = validInvoices.reduce((s, i) => s + (i.total || 0), 0);
      const paidRevenue   = paidInvoices.reduce((s, i) => s + (i.total || 0), 0);
      const paidCount     = paidInvoices.length;
      const netProfit     = paidRevenue - totalCost;
      const totalInvoices = validInvoices.length;
      const unpaidInvoices = validInvoices.filter(i => i.status !== 'paid').length;

      setStats({ totalInvoices, totalRevenue, paidRevenue, paidCount, unpaidInvoices, totalCost, netProfit });
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

  const maxVal = Math.max(...chartData.map(d => d.total), 1);

  if (!isPremium) {
    return (
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Ringkasan invoice dan pendapatan Anda</p>
        <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: 'clamp(32px,8vw,60px) 20px', maxWidth: 640, margin: '40px auto' }}>
          <div style={{ background: 'var(--surface-container)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={32} style={{ color: 'var(--outline)' }} />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 'clamp(20px,4vw,24px)', fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
            Dashboard Terkunci
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', fontSize: 'clamp(13px,2.5vw,15px)' }}>
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

      <div className="date-filter-bar">
        <select
          className="date-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          {DATE_FILTER_OPTIONS.map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {dateFilter === 'custom' && (
        <div className="custom-range-picker">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            max={customEnd || undefined}
          />
          <span>—</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            min={customStart || undefined}
          />
        </div>
      )}

      <div className="stats-grid">
        <StatCard  label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} accent="var(--primary)" />
        <StatCard    label="Total Invoice"    value={stats.totalInvoices}                              accent="var(--primary)" />
        <StatCard  label="Lunas (Paid)"    value={`${stats.paidCount} · ${formatCurrency(stats.paidRevenue)}`} accent="var(--tertiary, #2e7d32)"/>
        <StatCard      label="Belum Lunas"     value={stats.unpaidInvoices}                             accent="var(--error, #c62828)" />
      </div>

      <div className="stats-grid" style={{ marginTop: 16, marginBottom: 8 }}>
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
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="chart-header">
              <h3 className="chart-title">Tren Pendapatan</h3>
              <div className="chart-tabs">
                {[['daily', 'Harian'], ['month', 'Bulanan'], ['year', 'Tahunan']].map(([p, lbl]) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`chart-tab${period === p ? ' active' : ''}`}
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
                <div className="chart-svg-wrap">
                  <svg viewBox="0 0 900 260" className="chart-svg" preserveAspectRatio="xMidYMid meet">
                    {[0, 1, 2, 3, 4].map(i => (
                      <line key={i} x1="60" y1={200 - i * 50} x2="880" y2={200 - i * 50}
                        stroke="var(--outline-variant)" strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    <line x1="60" y1="0" x2="60" y2="200" stroke="var(--outline-variant)" strokeWidth="1.5" />
                    <line x1="60" y1="200" x2="880" y2="200" stroke="var(--outline-variant)" strokeWidth="1.5" />

                    {chartData.map((item, idx) => {
                      const bh = (item.total / maxVal) * 180;
                      const bw = Math.min((820 / chartData.length) * 0.65, 80);
                      const bx = 60 + (idx * 820) / chartData.length + ((820 / chartData.length) - bw) / 2;
                      return (
                        <g key={idx}>
                          <rect x={bx} y={200 - bh} width={bw} height={bh} rx={4} fill="var(--primary-container)" opacity="0.85" />
                          <text x={bx + bw / 2} y={216} textAnchor="middle" fontSize="10" fill="var(--outline)" fontFamily="Manrope, sans-serif">
                            {item.label.length > 6 ? item.label.slice(0, 6) : item.label}
                          </text>
                          {bh > 20 && (
                            <text x={bx + bw / 2} y={200 - bh - 5} textAnchor="middle" fontSize="9" fill="var(--primary)" fontWeight="700" fontFamily="Manrope, sans-serif">
                              {item.count}×
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="chart-legend">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="chart-legend-item">
                      <div className="chart-legend-dot" />
                      <div>
                        <p className="chart-legend-label">{item.label}</p>
                        <p className="chart-legend-sub">{item.count} inv · {formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="recent-header">
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 'clamp(15px,3vw,18px)', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                Invoice Terbaru
              </h3>
            </div>

            <div className="recent-table-wrap">
              <table className="recent-table">
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
                  {recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                      <td>{inv.customer_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(inv.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${inv.status === 'cancel' ? 'cancel' : inv.status}`}>{inv.status}</span>
                      </td>
                      <td style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{formatDate(inv.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="recent-cards">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="recent-card">
                  <div className="recent-card-row">
                    <span className="recent-card-num">{inv.invoice_number}</span>
                    <span className={`badge badge-${inv.status === 'cancel' ? 'cancel' : inv.status}`}>{inv.status}</span>
                  </div>
                  <div className="recent-card-row">
                    <span className="recent-card-customer">{inv.customer_name}</span>
                    <span className="recent-card-total">{formatCurrency(inv.total)}</span>
                  </div>
                  <div className="recent-card-row">
                    <span className="recent-card-date">{formatDate(inv.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="recent-footer">
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
      <div className="stat-card stat-card--locked">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
          <Lock size={14} style={{ color: 'var(--outline)' }} />
        </div>
        <div className="stat-value stat-value--locked">Terkunci (Pro)</div>
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