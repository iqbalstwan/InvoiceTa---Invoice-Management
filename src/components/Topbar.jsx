import React from 'react';
import { Sparkles, Bell } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: '',
  create:    '',
  history:   '',
  product:   '',
  pricing:   '',
  settings:  '',
};

const TIER_COLORS = {
  Free:         { bg: '#fff3e0', color: '#e65100', shadow: 'none' },
  Starter:      { bg: '#e3f2fd', color: '#1565c0', shadow: 'none' },
  Professional: { bg: '#e8f5e9', color: '#2e7d32', shadow: 'none' },
  Enterprise:   { bg: '#f3e5f5', color: '#6a1b9a', shadow: 'none' },
};

export default function Topbar({ user, subscription, currentPage }) {
  const title = PAGE_TITLES[currentPage] || '';
  const tierName = subscription?.subscription_plans?.name || 'Free';
  const tierStyle = TIER_COLORS[tierName] || TIER_COLORS['Free'];

  return (
    <div className="topbar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontWeight: 700,
            fontSize: 20,
            color: 'var(--primary)',
            letterSpacing: '-0.3px',
            margin: 0
          }}
        >
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Tombol notifikasi sementara dinonaktifkan
        <button style={{
          background: 'var(--surface-container)', border: 'none', width: 36, height: 36,
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--outline)', cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <Bell size={18} />
        </button>
        */}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', padding: '6px 14px',
          borderRadius: 12, border: '1px solid var(--outline-variant)',
          boxShadow: '0 2px 8px rgba(73,59,49,0.05)'
        }}>
          <span
            className="badge"
            style={{ 
              background: tierStyle.bg, 
              color: tierStyle.color, 
              textTransform: 'capitalize',
              boxShadow: tierStyle.shadow,
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Sparkles size={12} />
            {tierName}
          </span>
          {user?.email && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--on-surface-variant)',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'none',
              }}
              className="topbar-email"
            >
              {user.email}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .topbar-email { display: block !important; }
        }
      `}</style>
    </div>
  );
}