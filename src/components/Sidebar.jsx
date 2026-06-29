import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Clock, Settings, CreditCard, LogOut, BarChart3, Package, Heart, Sparkles, ShoppingCart, Menu, X, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_LOGO_BASE64 } from '../utils/defaultLogo';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [logoBase64, setLogoBase64] = useState(() => localStorage.getItem('company_logo_base64') || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Touch/swipe handling for drawer
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const drawerRef = useRef(null);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const handleLogoUpdate = () => setLogoBase64(localStorage.getItem('company_logo_base64') || '');

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('logoUpdated', handleLogoUpdate);

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',     icon: BarChart3  },
    { id: 'create',    label: 'Buat Invoice',   icon: FileText   },
    { id: 'history',   label: 'Riwayat',        icon: Clock      },
    { id: 'product',   label: 'Produk/Jasa',    icon: Package    },
    { id: 'expense',   label: 'Bahan Baku',     icon: ShoppingCart },
    { id: 'pricing',   label: 'Paket Langganan',   icon: Sparkles   },
    { id: 'settings',  label: 'Pengaturan',     icon: Settings   },
  ];

  // Bottom tab bar shows only these key items
  const bottomTabItems = [
    { id: 'dashboard', label: 'Home',      icon: BarChart3  },
    { id: 'create',    label: 'Buat',      icon: FileText   },
    { id: 'history',   label: 'Riwayat',   icon: Clock      },
    { id: 'product',   label: 'Produk',    icon: Package    },
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    setDrawerOpen(false);
  };

  // Swipe to close drawer
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;
    if (diff > 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateX(-${Math.min(diff, 300)}px)`;
      drawerRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchCurrentX.current;
    if (drawerRef.current) {
      drawerRef.current.style.transition = '';
      drawerRef.current.style.transform = '';
    }
    if (diff > 80) {
      setDrawerOpen(false);
    }
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════
         DESKTOP SIDEBAR (unchanged layout)
         ══════════════════════════════════════ */}
      <aside className="sidebar sidebar-desktop">
        {/* Brand */}
        <div className="brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0', gap: 0 }}>
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
          ) : (
            <img
              src={DEFAULT_LOGO_BASE64}
              alt="InvoiceTa Logo"
              style={{
                width: 180,
    height: 'auto',
    display: 'block',
              }}
            />
          )}
          <p className="brand-tagline">INVOICE MANAGEMENT</p>
        </div>

        {/* Navigation */}
        <nav>
          <p className="nav-section-label">Menu Utama</p>
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`nav-item${currentPage === id ? ' active' : ''}`}
              id={`nav-${id}`}
            >
              <Icon size={18} strokeWidth={currentPage === id ? 2.5 : 2} />
              <span>{label}</span>
            </button>
          ))}

          <p className="nav-section-label" style={{ marginTop: 32 }}>Akun & Sistem</p>
          <button
            onClick={logout}
            className="nav-item"
            id="nav-logout"
            style={{ color: '#ff9999', marginTop: 4 }}
          >
            <LogOut size={18} />
            <span>Keluar Aplikasi</span>
          </button>
        </nav>

        {/* Online status */}
        <div className="sidebar-status">
          <div style={{
            background: 'rgba(0,0,0,0.15)', padding: '10px 14px',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="status-text">{isOnline ? 'Online' : 'Koneksi Terputus'}</span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
         MOBILE: OVERLAY DRAWER
         ══════════════════════════════════════ */}
      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        ref={drawerRef}
        className={`sidebar-drawer ${drawerOpen ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <img
                src={DEFAULT_LOGO_BASE64}
                alt="InvoiceTa Logo"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.92,
                }}
              />
            )}
            <div>
              <p className="drawer-brand-name">InvoiceTa</p>
              <p className="drawer-brand-sub">Invoice Management</p>
            </div>
          </div>
          <button
            className="drawer-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer navigation */}
        <nav className="drawer-nav">
          <p className="drawer-section-label">Menu Utama</p>
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`drawer-nav-item${currentPage === id ? ' active' : ''}`}
            >
              <div className="drawer-nav-item-left">
                <div className={`drawer-nav-icon${currentPage === id ? ' active' : ''}`}>
                  <Icon size={18} strokeWidth={currentPage === id ? 2.5 : 1.8} />
                </div>
                <span>{label}</span>
              </div>
              <ChevronRight size={16} className="drawer-nav-chevron" />
            </button>
          ))}

          <div className="drawer-divider" />

          <p className="drawer-section-label">Akun & Sistem</p>
          <button
            onClick={() => { logout(); setDrawerOpen(false); }}
            className="drawer-nav-item logout"
          >
            <div className="drawer-nav-item-left">
              <div className="drawer-nav-icon logout">
                <LogOut size={18} />
              </div>
              <span>Keluar Aplikasi</span>
            </div>
          </button>
        </nav>

        {/* Drawer footer */}
        <div className="drawer-footer">
          <div className="drawer-status">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
         MOBILE: BOTTOM TAB BAR
         ══════════════════════════════════════ */}
      <nav className="bottom-tab-bar">
        {bottomTabItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`bottom-tab-item${currentPage === id ? ' active' : ''}`}
          >
            <div className="bottom-tab-icon-wrap">
              <Icon size={20} strokeWidth={currentPage === id ? 2.4 : 1.8} />
              {currentPage === id && <div className="bottom-tab-active-dot" />}
            </div>
            <span className="bottom-tab-label">{label}</span>
          </button>
        ))}

        {/* More button to open drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`bottom-tab-item${['expense', 'pricing', 'settings'].includes(currentPage) ? ' active' : ''}`}
        >
          <div className="bottom-tab-icon-wrap">
            <MoreHorizontal size={20} strokeWidth={1.8} />
            {['expense', 'pricing', 'settings'].includes(currentPage) && <div className="bottom-tab-active-dot" />}
          </div>
          <span className="bottom-tab-label">Lainnya</span>
        </button>
      </nav>
    </>
  );
}