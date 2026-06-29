import { useState, useEffect } from 'react';
import { supabaseClient } from '../utils/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    checkUser();

    // Subscribe to auth changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseClient.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return { user, loading, logout };
}
