# Dapooerku - React Invoice App
## Setup & Installation Guide

### 📋 Prerequisites
- Node.js 16+ (download dari nodejs.org)
- Visual Studio Code
- Supabase account (gratis di supabase.com)

---

## 🚀 Quick Start

### 1. **Buat Project Baru**
```bash
npm create vite@latest dapooerku-app -- --template react
cd dapooerku-app
npm install
```

### 2. **Install Dependencies**
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. **Folder Structure**
Copy struktur ini ke folder `src/`:
```
src/
├── components/
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   ├── ProtectedRoute.jsx
│   └── PricingPlan.jsx
├── pages/
│   ├── CreateInvoice.jsx
│   ├── History.jsx
│   ├── Settings.jsx
│   ├── Pricing.jsx
│   └── Login.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useInvoice.js
│   └── useSubscription.js
├── context/
│   └── AuthContext.jsx
├── utils/
│   ├── supabaseClient.js
│   ├── subscription.js
│   └── formatters.js
├── styles/
│   └── index.css
├── App.jsx
└── main.jsx
```

### 4. **Setup Supabase**

#### A. Buat Project di Supabase
1. Pergi ke https://supabase.com
2. Login/Sign up
3. Create new project
4. Tunggu setup selesai (5-10 menit)

#### B. Copy Credentials
Pergi ke **Settings → API** dan copy:
- `VITE_SUPABASE_URL` (Project URL)
- `VITE_SUPABASE_ANON_KEY` (Anon Public Key)

#### C. Buat `.env.local` di root folder
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (optional)
```

### 5. **Setup Database Tables**

Pergi ke Supabase Dashboard → SQL Editor, jalankan query ini:

```sql
-- Users (extended)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  business_name VARCHAR(255),
  city VARCHAR(100),
  contact VARCHAR(50),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  price DECIMAL(10, 2),
  invoice_limit INT,
  features TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id INT REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  payment_method VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  invoice_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB,
  subtotal DECIMAL(15, 2),
  tax DECIMAL(15, 2),
  discount DECIMAL(15, 2),
  total DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'draft',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, price, invoice_limit, features) VALUES
('Free', 0, 5, ARRAY['Basic invoice template', 'PDF download', 'Max 5 invoices/month']),
('Starter', 29000, 100, ARRAY['Unlimited invoices', 'Custom branding', 'Email reminders', 'Basic analytics']),
('Professional', 79000, 1000, ARRAY['All Starter features', 'Team collaboration (3 users)', 'Auto-send via WhatsApp', 'Payment gateway integration']),
('Enterprise', 299000, -1, ARRAY['All Professional features', 'Custom integrations', 'Dedicated support', 'API access']);
```

### 6. **Run Development Server**
```bash
npm run dev
```
Buka http://localhost:5173

---

## 📁 File-File Penting

Semua file code ada di folder `/files` - copy paste ke folder `src/` sesuai struktur.

---

## 🔐 Supabase RLS (Row Level Security)

Jalankan di SQL Editor untuk security:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Invoices policies
CREATE POLICY "Users can read own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can read own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = (SELECT id FROM users WHERE id = user_id));
```

---

## 🎨 Tailwind Config

Edit `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#58341d',
        secondary: '#8c4f25',
      }
    },
  },
  plugins: [],
}
```

---

## 💳 Payment Integration (Optional)

Untuk Stripe/Midtrans:
1. Install: `npm install @stripe/react-stripe-js @stripe/stripe-js`
2. Setup di Supabase Edge Functions
3. Update `.env.local` dengan keys

---

## 🐛 Troubleshooting

| Error | Solusi |
|-------|--------|
| "Cannot find module '@supabase/supabase-js'" | Run `npm install` lagi |
| Blank page di browser | Check console, mungkin Supabase keys salah |
| Auth tidak jalan | Pastikan email verification dimatikan di Supabase settings |
| Database error | Pastikan sudah run SQL queries |

---

## 📝 Next Steps

1. ✅ Setup project & dependencies
2. ✅ Setup Supabase database
3. ✅ Configure environment variables
4. ✅ Test login
5. ✅ Create invoice
6. ✅ Setup payment gateway (Stripe/Midtrans)
7. ✅ Deploy ke Vercel/Netlify

---

**Support:** Buka browser console (F12) untuk debugging

Happy coding! 🚀
