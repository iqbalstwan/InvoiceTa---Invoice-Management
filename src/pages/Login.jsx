import React, { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';
import { Mail, Lock, ArrowRight, Heart, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { DEFAULT_LOGO_BASE64 } from '../utils/defaultLogo';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { data, error: err } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;

        await supabaseClient.from('users').insert([{
          id: data.user?.id,
          business_name: 'Bisnis Saya',
          city: '',
          contact: '',
        }]);

        setEmail('');
        setPassword('');
        setSuccess('Pendaftaran berhasil! Silakan login dengan akun Anda.');
        setIsSignUp(false);
      } else {
        const { error: err } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src={DEFAULT_LOGO_BASE64}
            alt="InvoiceTa Logo"
            style={{
              width: 280,
              height: 280,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto -120px auto',
              filter: 'drop-shadow(0 4px 12px rgba(88,52,29,0.08))',
            }}
          />
         {/* <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', fontStyle: 'italic', marginTop: 4 }}>
            Invoice Management System
          </p> */}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--primary)',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Akun'}
          </h2>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 16px',
              background: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <AlertCircle size={14} /> <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              padding: '10px 16px',
              background: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: 8,
              color: 'var(--success)',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <CheckCircle2 size={14} /> <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--outline)', pointerEvents: 'none',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--outline)', pointerEvents: 'none',
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 15 }}
            >
              {loading ? (
                <><span className="loading-spinner" /> Memproses...</>
              ) : (
                <>{isSignUp ? 'Daftar Sekarang' : 'Masuk'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
              {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            </span>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary-container)', fontWeight: 700, fontSize: 13,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {isSignUp ? 'Login' : 'Daftar'}
            </button>
          </div>

          {/* Hint */}
          <hr className="section-divider" style={{ margin: '20px 0 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--outline)' }}>
            <HelpCircle size={12} /> <span>Gunakan email valid & password (min. 6 karakter)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
