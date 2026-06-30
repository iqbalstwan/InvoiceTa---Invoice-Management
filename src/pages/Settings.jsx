import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../utils/supabaseClient';
import { DEFAULT_LOGO_BASE64 } from '../utils/defaultLogo';
import { generatePalette } from '../utils/colorUtils';
import { Save, AlertCircle, User, Building2, Phone, Database, Info, AlertTriangle, CheckCircle2, Upload, ImageIcon, X } from 'lucide-react';

export default function Settings({ user, subscription }) {
  const [settings, setSettings] = useState({ business_name: '', city: '', contact: '', brand_color: '#58341d', footer: '', notes: '' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState({ type: '', text: '' });
  const [logoBase64, setLogoBase64] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadSettings(); }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('business_name, city, contact, brand_color, footer, notes, logo_base64')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({ 
          business_name: data.business_name || '', 
          city: data.city || '', 
          contact: data.contact || '', 
          brand_color: data.brand_color || '#58341d', 
          footer: data.footer || '', 
          notes: data.notes || '' 
        });
        if (data.logo_base64) setLogoBase64(data.logo_base64);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabaseClient.from('users').update({ ...settings, logo_base64: logoBase64 }).eq('id', user.id);
      if (error) throw error;
      
      if (logoBase64) {
        localStorage.setItem('company_logo_base64', logoBase64);
      } else {
        localStorage.removeItem('company_logo_base64');
      }
      window.dispatchEvent(new Event('logoUpdated'));
      
      if (settings.brand_color) {
        const palette = generatePalette(settings.brand_color);
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
      
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const BRAND_COLORS = [
    { label: 'Tinker Brown', hex: '#58341d' },
    { label: 'Navy Blue', hex: '#153a5b' },
    { label: 'Forest Green', hex: '#1e402b' },
    { label: 'Charcoal', hex: '#2c303a' },
    { label: 'Wine Red', hex: '#591c28' },
  ];
  
  const isPremium = subscription?.subscription_plans?.name && subscription.subscription_plans.name !== 'Free';

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar (JPG, PNG, dll)' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (file.size > 500 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 500KB' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setLogoBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  if (loading) return (
    <div className="page-loading">
      <div className="loading-spinner" />
      <span>Memuat pengaturan...</span>
    </div>
  );

  return (
    <div>
      <h1 className="page-title">Pengaturan</h1>
      <p className="page-sub">Kelola informasi bisnis dan akun Anda</p>

      <div style={{ maxWidth: 680 }}>

        <div className="card animate-fade-in-up">
          <h3 style={cardHeading}>
            <div style={iconBadge}>
              <User size={16} style={{ color: '#ffeadf' }} />
            </div>
            Akun
          </h3>
          <div style={{ marginTop: 18 }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="form-input"
              style={{ background: 'var(--surface-container)', cursor: 'not-allowed', color: 'var(--outline)' }}
            />
            <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 6, fontStyle: 'italic' }}>
              Email tidak bisa diubah
            </p>
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <h3 style={cardHeading}>
            <div style={iconBadge}>
              <Building2 size={16} style={{ color: '#ffeadf' }} />
            </div>
            Profil Bisnis
          </h3>
          <p style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 22, marginTop: 4, fontStyle: 'italic' }}>
            Info ini akan muncul di PDF invoice Anda
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="form-label">Nama Bisnis</label>
              <input
                type="text"
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                placeholder="Contoh: Toko Kue Ibu Riska"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Kota</label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                placeholder="Contoh: Jakarta, Bandung, Surabaya"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                <Phone size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Nomor WhatsApp / Telepon
              </label>
              <input
                type="text"
                value={settings.contact}
                onChange={(e) => setSettings({ ...settings, contact: e.target.value })}
                placeholder="+62 812 3456 7890"
                className="form-input"
              />
            </div>
            


            <div style={{ marginTop: 8 }}>
              <label className="form-label">
                <ImageIcon size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Logo Perusahaan
              </label>

              <div
                className={`logo-dropzone${isDragOver ? ' dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !logoBase64 && fileInputRef.current?.click()}
                style={{ cursor: logoBase64 ? 'default' : 'pointer' }}
              >
                {logoBase64 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="logo-preview-container">
                      <img
                        src={logoBase64}
                        alt="Logo Preview"
                        className="logo-preview-img"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                        className="logo-remove-btn"
                        title="Hapus logo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', margin: '0 0 4px' }}>
                        Logo Terpasang ✓
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--outline)', margin: '0 0 12px' }}>
                        Logo ini akan tampil di PDF invoice Anda
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        <Upload size={13} />
                        Ganti Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: 'var(--gradient-warm-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px',
                      border: '1px solid var(--outline-variant)',
                    }}>
                      <Upload size={24} style={{ color: 'var(--primary-container)' }} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--on-surface)', marginBottom: 4 }}>
                      Drag & drop logo di sini
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 12 }}>
                      atau klik untuk pilih file
                    </p>
                    <div style={{
                      display: 'inline-flex', gap: 12, fontSize: 11, color: 'var(--outline)',
                      background: 'var(--surface-container)', padding: '6px 14px', borderRadius: 8,
                    }}>
                      <span>JPG, PNG</span>
                      <span>•</span>
                      <span>Maks 500KB</span>
                      <span>•</span>
                      <span>Kotak/Lingkaran</span>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                id="logo-upload-input"
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Warna Tema Invoice (Custom Branding)
                </label>
                {!isPremium && (
                  <span className="badge badge-draft" style={{ fontSize: 10, padding: '2px 8px' }}>Premium</span>
                )}
              </div>
              
              {!isPremium ? (
                <div style={{
                  background: 'var(--surface-container)', padding: '16px 20px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', gap: 12, color: 'var(--outline)'
                }}>
                  <div style={{ background: '#fff', padding: 8, borderRadius: 8, flexShrink: 0 }}>
                    <AlertCircle size={16} />
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--on-surface-variant)' }}>Terkunci</p>
                    <p style={{ margin: '2px 0 0' }}>Upgrade ke paket Starter atau Professional untuk mengganti warna tema.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setSettings({ ...settings, brand_color: color.hex })}
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: color.hex,
                        border: settings.brand_color === color.hex ? '3px solid var(--primary-container)' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: settings.brand_color === color.hex ? '0 0 0 2px #fff inset, 0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transform: settings.brand_color === color.hex ? 'scale(1.05)' : 'scale(1)'
                      }}
                      title={color.label}
                    />
                  ))}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    border: '1.5px solid var(--outline-variant)', borderRadius: 12,
                    padding: '0 12px', background: 'var(--surface)'
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--outline)', fontWeight: 700 }}>#</span>
                    <input
                      type="text"
                      value={settings.brand_color?.replace('#', '') || ''}
                      onChange={(e) => setSettings({ ...settings, brand_color: '#' + e.target.value })}
                      placeholder="Hex"
                      maxLength={6}
                      style={{
                        width: 60, border: 'none', background: 'transparent',
                        fontSize: 14, fontFamily: 'monospace', color: 'var(--on-surface)',
                        outline: 'none', padding: '10px 0'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 style={cardHeading}>
            <div style={iconBadge}>
              <Upload size={16} style={{ color: '#ffeadf' }} />
            </div>
            Format PDF
          </h3>
          <p style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 22, marginTop: 4, fontStyle: 'italic' }}>
            Sesuaikan teks yang akan selalu muncul di bagian bawah dokumen PDF
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            
            <div>
              <label className="form-label">Catatan Default Invoice</label>
              <textarea
                value={settings.notes} 
                onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                //onChange={(e) => setDefaultNotes(e.target.value)}
                placeholder="Catatan yang akan otomatis muncul saat membuat invoice baru..."
                rows="3"
                className="form-input"
              />
              <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4, fontStyle: 'italic' }}>
                Jika diisi, catatan ini akan otomatis ditambahkan ke form pembuatan invoice baru.
              </p>
            </div>

            <div>
              <label className="form-label">Catatan Kaki (Footer)</label>
              <textarea
                value={settings.footer} 
                onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
                //onChange={(e) => setPdfFooter(e.target.value)}
                placeholder="Contoh: Pembayaran dapat ditransfer ke BCA 123456789 a.n PT TinkerWorks"
                rows="4"
                className="form-input"
              />
              <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 4, fontStyle: 'italic' }}>
                Teks ini akan selalu tampil di bagian paling bawah setiap invoice PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.12s', marginBottom: 20 }}>
          {message.text && (
            <div style={{
              marginBottom: 16,
              padding: '12px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
              color:      message.type === 'success' ? 'var(--success)'    : 'var(--error)',
              border: `1px solid ${message.type === 'success' ? '#c8e6c9' : '#f5c6cb'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
          >
            {saving ? (
              <><span className="loading-spinner" /> Menyimpan Pengaturan...</>
            ) : (
              <><Save size={18} /> Simpan Semua Pengaturan</>
            )}
          </button>
        </div>

        {/* ── Info Database ── */}
       {/* <div className="card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h3 style={cardHeading}>
            <div style={iconBadge}>
              <Database size={16} style={{ color: '#ffeadf' }} />
            </div>
            Informasi Database
          </h3>
          <div style={{
            background: '#1e1e2e',
            color: '#a6e3a1',
            padding: '20px 24px',
            borderRadius: 12,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 12,
            lineHeight: 1.8,
            marginTop: 18,
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div>╔══════════════════════════════════════╗</div>
            <div>║   SUPABASE DATABASE INFO             ║</div>
            <div>╠══════════════════════════════════════╣</div>
            <div>║  Provider:   Supabase (PostgreSQL)   ║</div>
            <div style={{ color: '#94e2d5' }}>║  Status:     <span style={{ color: '#a6e3a1' }}>● Connected</span>             ║</div>
            <div>╠══════════════════════════════════════╣</div>
            <div>║  User ID:    {String(user.id).slice(0, 22)}... ║</div>
            <div>╚══════════════════════════════════════╝</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--outline)', marginTop: 14 }}>
            <Info size={14} style={{ flexShrink: 0 }} /> <span>Data Anda disimpan aman di Supabase dan dienkripsi dalam transit.</span>
          </div>
        </div> */}

        {/* ── Danger Zone ── */}
        {/* <div className="animate-fade-in-up" style={{
          animationDelay: '0.2s',
          background: 'var(--error-bg)',
          border: '2px solid #f5c6cb',
          borderRadius: 14,
          padding: 28,
          marginBottom: 20,
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--error)', fontSize: 16, fontWeight: 700, marginBottom: 12, fontFamily: "'Source Serif 4', serif" }}>
            <AlertCircle size={20} /> Zona Berbahaya
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#c0392b', marginBottom: 18 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> <span>Menghapus akun akan menghapus semua data invoice Anda secara permanen dan tidak dapat dikembalikan.</span>
          </div>
          <button className="btn btn-danger">
            Hapus Akun
          </button>
      </div> */}

      </div>
    </div>
  );
}

const iconBadge = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--gradient-warm)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

const cardHeading = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: "'Source Serif 4', serif",
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--primary)',
  margin: 0,
};
