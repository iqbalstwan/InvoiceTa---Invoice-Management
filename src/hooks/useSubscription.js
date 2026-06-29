import { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (err) throw err;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getUserSubscription = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (userId, planId, paymentMethod = 'manual') => {
    setLoading(true);
    setError(null);
    try {
      // Deactivate any existing subscription
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Create new subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { data, error: err } = await supabaseClient
        .from('user_subscriptions')
        .insert([
          {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            payment_method: paymentMethod,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
          }
        ])
        .select('*, subscription_plans(*)');

      if (err) throw err;
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkInvoiceLimit = async (userId, currentInvoiceCount) => {
    try {
      const subscription = await getUserSubscription(userId);
      
      if (!subscription) {
        // Free tier
        return currentInvoiceCount < 5;
      }

      const limit = subscription.subscription_plans.invoice_limit;
      if (limit === -1) return true; // Unlimited
      
      return currentInvoiceCount < limit;
    } catch (err) {
      console.error('Error checking limit:', err);
      return false;
    }
  };

  return {
    getPlans,
    getUserSubscription,
    createSubscription,
    checkInvoiceLimit,
    loading,
    error,
  };
}
