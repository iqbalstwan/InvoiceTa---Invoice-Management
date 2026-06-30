import React, { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, HelpCircle, Shield, Zap, BarChart3, FileText } from 'lucide-react';
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

  const features = [
    { icon: <FileText size={18} />, title: 'Invoice Profesional', desc: 'Buat invoice rapi dalam hitungan detik' },
    { icon: <BarChart3 size={18} />, title: 'Dashboard Analytics', desc: 'Pantau pendapatan & laba bersih' },
    { icon: <Zap size={18} />, title: 'Cepat & Ringan', desc: 'Tanpa instalasi, langsung pakai' },
    { icon: <Shield size={18} />, title: 'Data Aman', desc: 'Terenkripsi & tersimpan aman' },
  ];

  return (
    <div className="login-page">
      {/* ════════ LEFT PANEL ════════ */}
      <div className="login-brand">
        <div className="login-brand__blob login-brand__blob--1" />
        <div className="login-brand__blob login-brand__blob--2" />
        <div className="login-brand__blob login-brand__blob--3" />

        <div className="login-brand__inner">
          <div className="login-brand__logo-wrap">
            <img
              src={DEFAULT_LOGO_BASE64}
              alt="InvoiceTa Logo"
              className="login-brand__logo"
            />
          </div>

          <h1 className="login-brand__title">
            Kelola Invoice<br />
            <span className="login-brand__title-accent">Tanpa Ribet</span>
          </h1>

          <p className="login-brand__subtitle">
            Platform pembuatan invoice & pelacakan pendapatan untuk UMKM dan freelancer Indonesia.
          </p>

          <div className="login-brand__features">
            {features.map((f, i) => (
              <div key={i} className="login-brand__feature">
                <div className="login-brand__feature-icon">{f.icon}</div>
                <div>
                  <p className="login-brand__feature-title">{f.title}</p>
                  <p className="login-brand__feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ════════ RIGHT PANEL ════════ */}
      <div className="login-form-panel">
        <div className="login-form-panel__inner">

          <div className="login-mobile-logo">
            <img
              src={DEFAULT_LOGO_BASE64}
              alt="InvoiceTa Logo"
              style={{ width: 80, height: 80, objectFit: 'contain' }}
            />
          </div>

          <div className="login-form-card card">
            <div className="login-form-header">
              <h2 className="login-form-title">
                {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang'}
              </h2>
              <p className="login-form-subtitle">
                {isSignUp
                  ? 'Daftar gratis dan mulai kelola invoice Anda'
                  : 'Masuk ke akun InvoiceTa Anda'}
              </p>
            </div>

            {error && (
              <div className="login-alert login-alert--error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="login-alert login-alert--success">
                <CheckCircle2 size={15} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="login-form">
              
              <div className="login-field">
                <label className="form-label">Email</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="form-input login-input"
                    required
                  />
                </div>
              </div>

             
              <div className="login-field">
                <label className="form-label">Password</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input login-input"
                    required
                    minLength={6}
                  />
                </div>
              </div>

             
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary login-submit"
              >
                {loading ? (
                  <><span className="loading-spinner" /> Memproses...</>
                ) : (
                  <>{isSignUp ? 'Daftar Sekarang' : 'Masuk'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>

           
            <div className="login-divider">
              <span>atau</span>
            </div>

         
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
              className="login-toggle"
            >
              {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
              <strong>{isSignUp ? 'Login di sini' : 'Daftar gratis'}</strong>
            </button>

        
            <div className="login-hint">
              <HelpCircle size={12} />
              <span>Gunakan email valid & password min. 6 karakter</span>
            </div>
          </div>

      
          <p className="login-bottom-text">
            © {new Date().getFullYear()} InvoiceTa By TinkerWorks
          </p>
        </div>
      </div>
    </div>
  );
}