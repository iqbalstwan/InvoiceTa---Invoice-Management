# Struktur Folder Project React Dapooerku

Setelah `npm create vite@latest`, organize file-file sesuai struktur di bawah ini:

```
dapooerku-app/
├── index.html                 ← HTML entry point
├── package.json              ← Dependencies
├── vite.config.js           ← Vite config
├── tailwind.config.js       ← Tailwind config
├── postcss.config.js        ← PostCSS config
├── .env.local               ← Environment variables (create manual)
├── .env.example             ← Template .env
├── .gitignore              ← Git ignore rules
│
├── src/
│   ├── main.jsx            ← React entry point
│   ├── App.jsx             ← Main App component
│   ├── index.css           ← Global styles
│   │
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── CreateInvoice.jsx
│   │   ├── History.jsx
│   │   ├── Pricing.jsx
│   │   └── Settings.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useInvoice.js
│   │   └── useSubscription.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── utils/
│   │   ├── supabaseClient.js
│   │   └── formatters.js
│   │
│   └── styles/
│       └── index.css
│
└── node_modules/           ← Auto-generated saat npm install
```

## Cara Setup:

1. **Buat project Vite:**
   ```bash
   npm create vite@latest dapooerku-app -- --template react
   cd dapooerku-app
   ```

2. **Copy semua file ke struktur folder di atas**
   - Setiap file sudah dibuat sesuai path-nya
   - Folder yang perlu dibuat: `src/`, `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`, `src/utils/`, `src/styles/`

3. **Install dependencies:**
   ```bash
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Setup .env.local:**
   - Copy `.env.example` menjadi `.env.local`
   - Isi dengan Supabase credentials

5. **Run development server:**
   ```bash
   npm run dev
   ```

## File Descriptions:

### Root Files
- `index.html` - HTML template untuk Vite
- `package.json` - Project metadata & dependencies
- `vite.config.js` - Build & dev server configuration
- `tailwind.config.js` - Tailwind CSS customization
- `postcss.config.js` - PostCSS plugins (Tailwind)
- `.env.example` - Template untuk environment variables

### src/main.jsx
Entry point React yang mount App component ke DOM

### src/App.jsx
Main component yang handle:
- Auth context
- Routing antar pages
- Subscription state
- Layout dengan Sidebar + Topbar

### src/components/
Reusable UI components:
- `Sidebar.jsx` - Navigation menu
- `Topbar.jsx` - Header dengan user info
- `ProtectedRoute.jsx` - Route protection wrapper

### src/pages/
Full pages/screens:
- `Login.jsx` - Auth page (sign in/up)
- `CreateInvoice.jsx` - Invoice creation form
- `History.jsx` - List semua invoices
- `Pricing.jsx` - Subscription plans
- `Settings.jsx` - User settings & profile

### src/hooks/
Custom React hooks:
- `useAuth.js` - Authentication logic
- `useInvoice.js` - Invoice operations
- `useSubscription.js` - Subscription management

### src/context/
Global state management:
- `AuthContext.jsx` - Auth state context

### src/utils/
Helper functions:
- `supabaseClient.js` - Supabase client initialization
- `formatters.js` - Formatting utilities (currency, date, etc)

### src/styles/
Global CSS:
- `index.css` - Global styles dengan Tailwind imports

## Development Workflow:

1. **Development:**
   ```bash
   npm run dev
   ```
   → Opens on http://localhost:5173

2. **Build for production:**
   ```bash
   npm run build
   ```
   → Creates `dist/` folder

3. **Preview production build:**
   ```bash
   npm run preview
   ```

## Tips:

- Gunakan VS Code dengan extension "Tailwind CSS IntelliSense"
- Components sudah responsive (mobile-first)
- Database queries menggunakan Supabase SDK
- Styling pure Tailwind CSS (no CSS modules)
- Auth handled by Supabase Auth

Happy coding! 🚀
