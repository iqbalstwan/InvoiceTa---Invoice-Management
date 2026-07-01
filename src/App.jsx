import React, { useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { supabaseClient } from './utils/supabaseClient';
import { generatePalette } from './utils/colorUtils';
import { DEFAULT_LOGO_BASE64 } from './utils/defaultLogo';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import CreateInvoice from './pages/CreateInvoice';
import History from './pages/History';
import Product from './pages/Product';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import './styles/index.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user) fetchUserSubscription();
  }, [user]);

  const fetchUserSubscription = async () => {
    try {
      const { data } = await supabaseClient
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setSubscription(
        data ?? {
          subscription_plans: { name: 'Free', invoice_limit: 10, price: 0 },
        }
      );

      const { data: userData } = await supabaseClient
        .from('users')
        .select('brand_color, logo_base64')
        .eq('id', user.id)
        .single();

      if (userData?.logo_base64) {
        localStorage.setItem('company_logo_base64', userData.logo_base64);
      } else {
        localStorage.removeItem('company_logo_base64');
      }
      window.dispatchEvent(new Event('logoUpdated'));
      
      if (userData?.brand_color) {
        const palette = generatePalette(userData.brand_color);
        const root = document.documentElement.style;
        
        root.setProperty('--primary', palette.primary);
        root.setProperty('--primary-hover', palette.primaryHover);
        root.setProperty('--primary-container', palette.primaryContainer);
        root.setProperty('--on-primary-container', palette.onPrimaryContainer);
        
        root.setProperty('--secondary', palette.secondary);
        root.setProperty('--secondary-container', palette.secondaryContainer);
        
        root.setProperty('--gradient-warm', palette.primary);
        root.setProperty('--gradient-sidebar', palette.primary);
        root.setProperty('--gradient-warm-soft', palette.surfaceContainer);
        root.setProperty('--gradient-card', palette.surface);
        
        root.setProperty('--surface', palette.surface);
        root.setProperty('--surface-dim', palette.surfaceDim);
        root.setProperty('--surface-container', palette.surfaceContainer);
        root.setProperty('--surface-container-high', palette.surfaceContainerHigh);
        root.setProperty('--surface-container-highest', palette.surfaceContainerHighest);
        root.setProperty('--background', palette.background);
        
        root.setProperty('--on-surface', palette.onSurface);
        root.setProperty('--on-surface-variant', palette.onSurfaceVariant);
        
        root.setProperty('--outline', palette.outline);
        root.setProperty('--outline-variant', palette.outlineVariant);
      }
    } catch (err) {
      console.error('Error fetching subscription/branding:', err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--background)',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: 'var(--on-surface-variant)', fontFamily: "'Manrope', sans-serif" }}>
          Memuat...
        </p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="main">
        <Topbar user={user} subscription={subscription} currentPage={currentPage} />

        <div className="page">
          {currentPage === 'dashboard' && <DashboardPage subscription={subscription} setCurrentPage={setCurrentPage} />}
          {currentPage === 'create'    && <CreateInvoice subscription={subscription} setCurrentPage={setCurrentPage} />}
          {currentPage === 'history'   && <History subscription={subscription} />}
          {currentPage === 'product'   && <Product subscription={subscription} />}
          {currentPage === 'expense'   && <Expenses subscription={subscription} />}
          {currentPage === 'pricing'   && (
            <Pricing
              currentSubscription={subscription}
              onSubscriptionUpdate={fetchUserSubscription}
            />
          )}
          {currentPage === 'settings'  && <Settings user={user} subscription={subscription} />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthContext.Provider value={{}}>
      <AppContent />
    </AuthContext.Provider>
  );
}