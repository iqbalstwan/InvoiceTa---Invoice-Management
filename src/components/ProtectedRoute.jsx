import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

export default function ProtectedRoute({
  children,
  requiredPlan = null,
  fallback = null,
}) {
  const { user, loading: authLoading } = useAuth();
  const { loading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return fallback || <div>Loading...</div>;
  }

  if (!user) {
    return fallback || <div>Silakan login terlebih dahulu</div>;
  }

  // Jika ada requirement plan specific, check nanti di component
  return children;
}
