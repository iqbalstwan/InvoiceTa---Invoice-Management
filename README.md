# 💖 Dapooerku - Invoice Management System

React-based invoice management application dengan Supabase backend dan subscription system terintegrasi.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-18.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.38-green)

## ✨ Fitur

### Core Features
- ✅ **Authentication** - Login/Sign up dengan Supabase Auth
- ✅ **Create Invoice** - Form yang user-friendly untuk membuat invoice
- ✅ **Invoice Management** - View, edit, delete invoice
- ✅ **PDF Export** - Download invoice ke PDF
- ✅ **Settings** - Manage profil bisnis

### Subscription System
- 🎁 **Free Tier** - 5 invoice/bulan
- 💎 **Starter** - Rp 29K/bulan, unlimited invoices
- 👑 **Professional** - Rp 79K/bulan + team collaboration
- 🏆 **Enterprise** - Custom pricing + priority support

### Technical Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Database**: Supabase Database
- **Icons**: Lucide React
- **Payment**: Ready for Stripe/Midtrans integration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (download dari [nodejs.org](https://nodejs.org))
- Visual Studio Code
- Supabase account (gratis di [supabase.com](https://supabase.com))

### 1. Create React Project with Vite

```bash
npm create vite@latest dapooerku-app -- --template react
cd dapooerku-app
```

### 2. Install Dependencies

```bash
npm install
npm install @supabase/supabase-js lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Setup Project Structure

Copy semua file dari output folder ini ke struktur folder sesuai `FOLDER_STRUCTURE.md`.

Struktur yang diperlukan:
```
src/
├── components/
├── pages/
├── hooks/
├── context/
├── utils/
├── styles/
├── App.jsx
└── main.jsx
```

### 4. Configure Supabase

#### A. Create Supabase Project

1. Buka https://supabase.com
2. Click "New Project"
3. Fill project details dan tunggu ~5-10 menit
4. Pergi ke Settings → API untuk copy credentials

#### B. Create `.env.local` di root folder

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

(Copy dari Settings → API)

#### C. Run Database Setup Queries

Pergi ke Supabase Dashboard → SQL Editor, paste query ini:

**1. Enable Auth**
```sql
-- Auth setup dilakukan otomatis oleh Supabase
-- Pastikan "Email" authentication sudah enabled di Auth settings
```

**2. Create Tables**

```sql
-- Users table (extended)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  city VARCHAR(100),
  contact VARCHAR(50),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE public.subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  invoice_limit INT,
  features TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id INT REFERENCES public.subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  payment_method VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB NOT NULL,
  subtotal DECIMAL(15, 2),
  tax DECIMAL(15, 2),
  discount DECIMAL(15, 2),
  total DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'draft',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price, invoice_limit, features) VALUES
('Free', 0, 5, ARRAY['Basic invoice template', 'PDF download', 'Max 5 invoices/month']),
('Starter', 29000, 100, ARRAY['Unlimited invoices', 'Custom branding', 'Email reminders', 'Basic analytics']),
('Professional', 79000, 1000, ARRAY['All Starter features', 'Team collaboration (3 users)', 'Auto-send via WhatsApp', 'Payment gateway integration']),
('Enterprise', 299000, -1, ARRAY['All Professional features', 'Custom integrations', 'Dedicated support', 'API access']);

-- Create indexes untuk performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
```

**3. Enable Row Level Security (RLS)**

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" 
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Invoices policies
CREATE POLICY "Users can read own invoices" 
  ON public.invoices FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices" 
  ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" 
  ON public.invoices FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" 
  ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can read own subscriptions" 
  ON public.user_subscriptions FOR SELECT 
  USING (user_id = auth.uid());

-- Plans are public read
CREATE POLICY "Plans are public readable" 
  ON public.subscription_plans FOR SELECT USING (true);
```

### 5. Start Development Server

```bash
npm run dev
```

Aplikasi akan terbuka di http://localhost:5173

---

## 📁 Project Structure

```
dapooerku-app/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Full pages
│   ├── hooks/             # Custom React hooks
│   ├── context/           # Global state
│   ├── utils/             # Helper functions
│   ├── styles/            # CSS files
│   ├── App.jsx            # Main component
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Build config
├── tailwind.config.js     # Tailwind config
└── .env.local             # Environment variables
```

---

## 🏗️ Architecture

### Component Structure

```
App
├── AuthContext
├── Sidebar
├── Topbar
└── Pages
    ├── Login
    ├── CreateInvoice
    ├── History
    ├── Pricing
    └── Settings
```

### Data Flow

```
User Action
    ↓
Component Handler
    ↓
Custom Hook (useInvoice, useAuth, useSubscription)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
Response → Update UI
```

### Auth Flow

```
Login/SignUp
    ↓
Supabase Auth
    ↓
Create User Profile
    ↓
Default to Free Tier
    ↓
Redirect ke CreateInvoice
```

---

## 🔐 Security Features

- ✅ **Row Level Security (RLS)** - Data isolation per user
- ✅ **JWT Authentication** - Secure session management
- ✅ **Protected Routes** - Only authenticated users can access
- ✅ **Email Verification** - (Optional, disable untuk development)
- ✅ **HTTPS Only** - Production-ready

---

## 📊 Database Schema

### users
```sql
id (UUID) - Primary key, linked ke auth.users
business_name (VARCHAR) - Nama bisnis user
city (VARCHAR) - Kota/lokasi bisnis
contact (VARCHAR) - Nomor WhatsApp/telepon
subscription_tier (VARCHAR) - Tier subscription (free/starter/pro/enterprise)
subscription_status (VARCHAR) - Status (active/inactive)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### invoices
```sql
id (UUID) - Primary key
user_id (UUID) - FK ke users
invoice_number (VARCHAR) - Nomor invoice unik
customer_name (VARCHAR) - Nama pelanggan
customer_email (VARCHAR)
customer_phone (VARCHAR)
items (JSONB) - Array of {description, quantity, price}
subtotal (DECIMAL)
tax (DECIMAL)
discount (DECIMAL)
total (DECIMAL)
status (VARCHAR) - draft/sent/paid/overdue
payment_method (VARCHAR)
notes (TEXT)
created_at (TIMESTAMP)
sent_at (TIMESTAMP)
```

### subscription_plans
```sql
id (SERIAL) - Primary key
name (VARCHAR) - Plan name
price (DECIMAL) - Harga per bulan
invoice_limit (INT) - Max invoice per bulan (-1 = unlimited)
features (TEXT[]) - Array of features
created_at (TIMESTAMP)
```

### user_subscriptions
```sql
id (SERIAL) - Primary key
user_id (UUID) - FK ke users
plan_id (INT) - FK ke subscription_plans
status (VARCHAR) - active/inactive
start_date (TIMESTAMP)
end_date (TIMESTAMP)
payment_method (VARCHAR) - manual/stripe/midtrans
stripe_subscription_id (VARCHAR) - For Stripe integration
created_at (TIMESTAMP)
```

---

## 🎯 Features Deep Dive

### Create Invoice
- Form dengan auto-calculation
- Multiple items support
- Tax dan discount calculation
- Real-time total display
- Invoice limit checking (berdasarkan subscription)

### Invoice History
- List semua invoices
- Filter by status (draft, sent, paid, overdue)
- Inline actions (view, download, delete)
- Pagination (ready)
- Search (ready)

### Pricing Page
- Display semua plans
- Highlight current plan
- Upgrade/downgrade functionality
- Feature comparison
- FAQ section

### Settings
- Profile management
- Database info display
- Data export (ready)
- Account deletion (ready)

---

## 🔌 API Integration Points

### Supabase Auth
```javascript
// Sign up
supabaseClient.auth.signUp({ email, password })

// Sign in
supabaseClient.auth.signInWithPassword({ email, password })

// Sign out
supabaseClient.auth.signOut()

// Get session
supabaseClient.auth.getSession()
```

### Database Operations
```javascript
// Select
supabaseClient.from('table').select('*')

// Insert
supabaseClient.from('table').insert([data])

// Update
supabaseClient.from('table').update(data).eq('id', id)

// Delete
supabaseClient.from('table').delete().eq('id', id)
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code ke GitHub
2. Buka https://vercel.com/new
3. Import project
4. Add environment variables
5. Deploy!

### Deploy to Netlify

```bash
npm run build
# Drag & drop dist folder ke Netlify
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/Sign up
- [ ] Create invoice
- [ ] Update invoice
- [ ] Delete invoice
- [ ] Download PDF
- [ ] View history
- [ ] Filter invoices
- [ ] Upgrade subscription
- [ ] Update settings
- [ ] Responsive (mobile/tablet)

---

## 🐛 Troubleshooting

| Error | Solusi |
|-------|--------|
| "Supabase not defined" | Cek `.env.local`, pastikan VITE_SUPABASE_URL dan KEY ada |
| Blank page | Buka console (F12), cek error messages |
| Can't login | Pastikan auth method enabled di Supabase |
| Database error | Check RLS policies, cek SQL syntax |
| Styling tidak load | Run `npm install -D tailwindcss`, check tailwind.config.js |

---

## 📝 Environment Variables

Wajib di `.env.local`:
```env
VITE_SUPABASE_URL=<your-url>
VITE_SUPABASE_ANON_KEY=<your-key>
```

Optional:
```env
VITE_STRIPE_PUBLISHABLE_KEY=<for-payment>
```

---

## 🤝 Contributing

Pull requests welcome! Untuk major changes, buka issue dulu.

---

## 📄 License

MIT License - feel free to use untuk personal/commercial projects.

---

## 🆘 Support

- 📧 Email: support@dapooerku.com
- 💬 WhatsApp: (akan ditambahkan)
- 📚 Docs: Check `SETUP.md` dan `FOLDER_STRUCTURE.md`

---

## 🎉 Roadmap

- [ ] Payment gateway integration (Stripe/Midtrans)
- [ ] WhatsApp integration untuk auto-send invoice
- [ ] Email reminders untuk overdue invoices
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] Mobile app (React Native)
- [ ] Invoice templates library
- [ ] Expense tracking
- [ ] Multi-currency support
- [ ] API for third-party integrations

---

**Made with ❤️ by Dapooerku Team**

Happy invoicing! 🎉
