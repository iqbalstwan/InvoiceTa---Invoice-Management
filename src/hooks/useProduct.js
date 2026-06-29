import { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';

export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProducts = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
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

  const createProduct = async (productData, userId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('products')
        .insert([
          {
            ...productData,
            user_id: userId,
            is_active: true,
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

  const updateProduct = async (productId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabaseClient
        .from('products')
        .update(updates)
        .eq('id', productId)
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

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabaseClient
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (err) throw err;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  };
}