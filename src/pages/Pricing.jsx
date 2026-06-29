import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency } from '../utils/formatters';
import { Check, Zap, Crown, Star, Gift } from 'lucide-react';

const PLAN_ICONS = { Free: Gift, Starter: Zap, Professional: Star, Enterprise: Crown };
const PLAN_ACCENTS = {
  Free:         { border: 'var(--outline-variant)', bg: 'var(--surface-container)', badge: '#e8f5e9', badgeText: '#2e7d32' },
  Starter:      { border: 'var(--primary-container)', bg: '#ffeadf', badge: '#e3f2fd', badgeText: '#1565c0' },
  Professional: { border: '#734a32', bg: '#ffeadf', badge: 'var(--primary-container)', badgeText: 'var(--on-primary-container)' },
  Enterprise:   { border: '#413c36', bg: 'var(--surface-container-highest)', badge: '#f3e5f5', badgeText: '#6a1b9a' },
};

export default function Pricing({ currentSubscription, onSubscriptionUpdate }) {
  const { user } = useAuth();
  const { getPlans, createSubscription } = useSubscription();
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadPlans = async () => {
    try {
      const allPlans = await getPlans();
      setPlans(allPlans.filter(plan => plan.name !== 'Enterprise'));
    } catch (e) { console.error(e); }
  };

  const handleSubscribe = async (planId) => {
    // Tampilkan modal kontak untuk upgrade
    setShowContactModal(true);
  };

  const currentPlanName = currentSubscription?.subscription_plans?.name || 'Free';

  return (
    <div>
      <h1 className="page-title">Pilih Paket</h1>
      <p className="page-sub">Upgrade untuk mendapatkan lebih banyak fitur dan invoice tak terbatas</p>

      {/* Plan Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {plans.map((plan) => {
          const isActive  = plan.name === currentPlanName;
          const isFree    = plan.price === 0;
          const accent    = PLAN_ACCENTS[plan.name] || PLAN_ACCENTS.Free;
          const PlanIcon  = PLAN_ICONS[plan.name] || Gift;
          const features = plan.name === 'Starter' ? [
            'Increased Invoice Quota',
            'Custom Themes & Branding',
            'Dashboard & Analytics Access',
            'Expense & Materials Management'
          ] : (plan.features || []);

          return (
            <div
              key={plan.id}
              style={{
                background: isActive ? accent.bg : '#fffcf9',
                border: `2px solid ${isActive ? accent.border : 'var(--outline-variant)'}`,
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: isActive ? '0 4px 20px rgba(73,59,49,.12)' : '0 2px 8px rgba(73,59,49,.05)',
                transition: 'all .2s',
              }}
            >
              {/* Active ribbon */}
              {isActive && (
                <div style={{
                  background: accent.badge,
                  color: accent.badgeText,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '5px 0',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  ✓ Paket Aktif
                </div>
              )}

              <div style={{ padding: 24 }}>
                {/* Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    background: accent.badge,
                    color: accent.badgeText,
                    borderRadius: 10,
                    padding: 8,
                    display: 'flex',
                  }}>
                    <PlanIcon size={18} />
                  </div>
                  <h3 style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {plan.name}
                    {plan.name === 'Professional' && (
                      <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>SOON</span>
                    )}
                  </h3>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 16 }}>
                  {isFree ? (
                    <p style={{ fontSize: 28, fontWeight: 700, color: '#2e7d32', fontFamily: "'Source Serif 4', serif" }}>
                      Gratis
                    </p>
                  ) : plan.name === 'Professional' ? (
                    <>
                      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', fontFamily: "'Source Serif 4', serif" }}>
                        Rp ???
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--outline)' }}>/bulan</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', fontFamily: "'Source Serif 4', serif" }}>
                        {formatCurrency(plan.price)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--outline)' }}>/bulan</p>
                    </>
                  )}
                </div>

                {/* Invoice limit pill */}
                <div style={{
                  display: 'inline-block',
                  background: accent.badge,
                  color: accent.badgeText,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 999,
                  marginBottom: 16,
                }}>
                  {plan.invoice_limit === -1 ? '∞ Invoice' : `${plan.invoice_limit} Invoice/bulan`}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                      <Check size={14} style={{ color: '#2e7d32', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--on-surface-variant)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <button disabled className="btn" style={{
                    width: '100%', justifyContent: 'center',
                    background: 'var(--surface-container)',
                    color: 'var(--outline)',
                    cursor: 'not-allowed',
                    borderRadius: 999,
                  }}>
                    Paket Saat Ini
                  </button>
                ) : plan.name === 'Professional' ? (
                  <button disabled className="btn" style={{
                    width: '100%', justifyContent: 'center',
                    background: 'var(--surface-container)',
                    color: 'var(--outline)',
                    cursor: 'not-allowed',
                    borderRadius: 999,
                  }}>
                    Segera Hadir
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 999 }}
                  >
                    {isFree ? 'Gunakan Gratis' : 'Upgrade →'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="card">
        <h3 style={{
          fontFamily: "'Source Serif 4', serif",
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--primary)',
          marginBottom: 20,
        }}>
          Pertanyaan yang Sering Diajukan
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['📝 Bisa upgrade kapan saja?', 'Ya, Anda bisa upgrade atau downgrade paket kapan saja. Perubahan langsung efektif.'],
            ['💰 Cara bayar?', 'Kami mengirimkan instruksi pembayaran via WhatsApp setelah Anda memilih paket.'],
            ['🔄 Ada komitmen jangka panjang?', 'Tidak ada. Billing per bulan, bisa dibatalkan kapan saja tanpa penalti.'],
            ['🆘 Butuh bantuan?', 'Hubungi TinkerWorks@gmail.com atau WhatsApp untuk konsultasi gratis.'],
          ].map(([q, a]) => (
            <div key={q} style={{
              background: 'var(--surface-container)',
              borderRadius: 10,
              padding: '16px 20px',
            }}>
              <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6, fontSize: 14 }}>{q}</p>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24,
          background: 'var(--primary)', color: 'var(--on-primary-container)',
          padding: '10px 20px', borderRadius: 999,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(73,59,49,.3)', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal active" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-warm-soft)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
            }}>
              <Star size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
              Upgrade Paket
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Untuk upgrade paket ke Premium, silakan hubungi admin kami melalui WhatsApp di bawah ini.
            </p>
            <div style={{ 
              background: 'var(--surface-container)', padding: '16px', borderRadius: 12, 
              fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 24,
              letterSpacing: '0.05em'
            }}>
              +62 821-2325-9726
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowContactModal(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Tutup
              </button>
              <a 
                href="https://wa.me/6282123259726?text=Halo%20Admin%2C%20saya%20ingin%20upgrade%20paket%20di%20Aplikasi%20Invoice."
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
