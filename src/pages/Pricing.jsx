import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabaseClient } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/formatters';
import { Check, Zap, Crown, Star, Gift, ShoppingBag } from 'lucide-react';

const PLAN_ICONS = { Free: Gift, Starter: Zap, Professional: Star, Enterprise: Crown };
const PLAN_ACCENTS = {
  Free:         { border: 'var(--outline-variant)', bg: 'var(--surface-container)', badge: '#e8f5e9', badgeText: '#2e7d32' },
  Starter:      { border: 'var(--primary-container)', bg: '#ffeadf', badge: '#e3f2fd', badgeText: '#1565c0' },
  Professional: { border: '#734a32', bg: '#ffeadf', badge: 'var(--primary-container)', badgeText: 'var(--on-primary-container)' },
  Enterprise:   { border: '#413c36', bg: 'var(--surface-container-highest)', badge: '#f3e5f5', badgeText: '#6a1b9a' },
};

export default function Pricing({ currentSubscription, onSubscriptionUpdate }) {
  const { user } = useAuth();
  const { getPlans, createSubscription, checkInvoiceLimit } = useSubscription();
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState({ count: 0, limit: 10, credits: 0 });

  useEffect(() => { 
    loadPlans(); 
    if (user) fetchUserCredits();
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUserCredits = async () => {
    try {
      const res = await checkInvoiceLimit(user.id);
      setQuotaInfo(res);
      setUserCredits(res.credits || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPlans = async () => {
    try {
      const allPlans = await getPlans();
      // Filter out Enterprise and Professional
      setPlans(allPlans.filter(plan => plan.name !== 'Enterprise' && plan.name !== 'Professional'));
    } catch (e) { console.error(e); }
  };

  const handleSubscribe = async (planId) => {
    setShowContactModal(true);
  };

  const currentPlanName = currentSubscription?.subscription_plans?.name || 'Free';

  return (
    <div>
      <h1 className="page-title">Pilih Paket</h1>
      <p className="page-sub">Upgrade untuk mendapatkan lebih banyak fitur dan kuota invoice</p>

      {/* ─── Subscription Overview Box ─── */}
      <div className="card animate-fade-in-up" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 16, 
        marginBottom: 24, 
        padding: '20px 24px' 
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--outline)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Status Langganan Anda</p>
          <h2 style={{ margin: '4px 0 0', fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
            Paket {currentPlanName}
          </h2>
        </div>
        <div style={{ background: 'var(--surface-container)', padding: '12px 18px', borderRadius: 10, textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--outline)', fontWeight: 600 }}>SALDO INVOICE CREDITS (ADD-ON)</p>
          <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
            {userCredits} Credits
            {currentPlanName === 'Free' && userCredits > 0 && (
              <span style={{ fontSize: 10, display: 'block', color: 'var(--error)', fontWeight: 600, fontStyle: 'italic', marginTop: 2 }}>
                (Dibekukan - Butuh Langganan Aktif)
              </span>
            )}
          </p>
        </div>
      </div>

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
                  </h3>
                </div>

                <div style={{ marginBottom: 16 }}>
                  {isFree ? (
                    <p style={{ fontSize: 28, fontWeight: 700, color: '#2e7d32', fontFamily: "'Source Serif 4', serif" }}>
                      Gratis
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', fontFamily: "'Source Serif 4', serif" }}>
                        {formatCurrency(plan.price)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--outline)' }}>/bulan</p>
                    </>
                  )}
                </div>

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
                  {plan.name === 'Free' ? '10 Invoice/bulan' : plan.name === 'Starter' ? '100 Invoice/bulan' : plan.invoice_limit === -1 ? '∞ Invoice' : `${plan.invoice_limit} Invoice/bulan`}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                      <Check size={14} style={{ color: '#2e7d32', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--on-surface-variant)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

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
      
      <div className="card animate-fade-in-up" style={{ marginTop: 32, animationDelay: '0.1s' }}>
        <h3 style={{
          fontFamily: "'Source Serif 4', serif",
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--primary)',
          marginBottom: 6,
        }}>
          Add-on Kuota Invoice
        </h3>
        <p style={{ fontSize: 13, color: 'var(--outline)', marginBottom: 24 }}>
          Butuh kuota tambahan tanpa upgrade paket? Beli Add-on kuota invoice sekali bayar.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {[
            { credits: 100, price: 15000, desc: 'Tambahan saldo 100 invoice' },
            { credits: 500, price: 50000, desc: 'Tambahan saldo 500 invoice (Lebih Hemat)' },
          ].map((addon) => {
            const isSubActive = currentSubscription && currentPlanName !== 'Free' && currentSubscription.status === 'active';
            
            return (
              <div
                key={addon.credits}
                style={{
                  background: '#fff',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                    +{addon.credits} Invoice
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--outline)', margin: '0 0 12px' }}>
                    {addon.desc}
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--secondary)', margin: '0 0 16px' }}>
                    {formatCurrency(addon.price)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!isSubActive) {
                      showToast('⚠️ Add-on hanya dapat dibeli jika memiliki langganan aktif!');
                      return;
                    }
                    const msg = encodeURIComponent(`Halo Admin, saya ingin membeli Add-on +${addon.credits} Invoice.`);
                    window.open(`https://wa.me/6282123259726?text=${msg}`, '_blank');
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: 12.5,
                    padding: '8px 16px',
                    borderColor: isSubActive ? 'var(--primary)' : 'var(--outline-variant)',
                    color: isSubActive ? 'var(--primary)' : 'var(--outline)',
                  }}
                >
                  Beli Add-on
                </button>
              </div>
            );
          })}
        </div>
      </div>

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
            ['• Bisa upgrade kapan saja?', 'Ya, Anda bisa upgrade atau downgrade paket kapan saja. Perubahan langsung efektif.'],
            ['• Cara bayar?', 'Kami mengirimkan instruksi pembayaran via WhatsApp setelah Anda memilih paket.'],
            ['• Ada komitmen jangka panjang?', 'Tidak ada. Billing per bulan, bisa dibatalkan kapan saja tanpa penalti.'],
            ['• Butuh bantuan?', 'Hubungi TinkerWorks@gmail.com atau WhatsApp untuk konsultasi gratis.'],
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
