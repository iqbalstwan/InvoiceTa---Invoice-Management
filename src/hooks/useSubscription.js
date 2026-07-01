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

  const checkInvoiceLimit = async (userId) => {
    try {
      const subscription = await getUserSubscription(userId);
      
      let limit = 10; // Default Free
      let startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const isSubscriptionActive = subscription && subscription.subscription_plans && subscription.subscription_plans.name !== 'Free' && subscription.status === 'active';

      if (isSubscriptionActive) {
        limit = subscription.subscription_plans.invoice_limit || 100;
        if (subscription.start_date) {
          startDate = new Date(subscription.start_date);
        }
      }

      const { count, error: countErr } = await supabaseClient
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (countErr) throw countErr;

      const { data: userData, error: userErr } = await supabaseClient
        .from('users')
        .select('invoice_credits')
        .eq('id', userId)
        .single();

      if (userErr && userErr.code !== 'PGRST116') throw userErr;
      const credits = userData?.invoice_credits || 0;
      
      if (count < limit) {
        return { canCreate: true, useCredit: false, count, limit, credits };
      }

      if (isSubscriptionActive && credits > 0) {
        return { canCreate: true, useCredit: true, count, limit, credits };
      }

      return { canCreate: false, useCredit: false, count, limit, credits };
    } catch (err) {
      console.error('Error checking limit:', err);
      return { canCreate: false, useCredit: false, count: 0, limit: 10, credits: 0 };
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
