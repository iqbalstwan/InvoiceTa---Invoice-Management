import { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';

export function useInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createInvoice = async (invoiceData, userId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('invoices')
        .insert([
          {
            ...invoiceData,
            user_id: userId,
            status: 'draft',
            created_at: new Date().toISOString(),
          }
        ])
        .select();

      if (err) throw err;
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (invoiceId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select();

      if (err) throw err;
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabaseClient
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (err) throw err;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInvoices = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoices,
    loading,
    error,
  };
}
