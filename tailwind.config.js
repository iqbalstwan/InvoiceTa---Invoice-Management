/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:                   '#58341d',
        'primary-container':       '#734a32',
        'on-primary-container':    '#f4bc9d',
        secondary:                 '#8c4f25',
        'secondary-container':     '#ffaf7d',
        tertiary:                  '#413c36',
        surface:                   '#fff8f5',
        'surface-dim':             '#f0d5c6',
        'surface-container':       '#ffeadf',
        'surface-container-high':  '#ffe3d4',
        'surface-container-highest': '#f9ddcf',
        'on-surface':              '#271810',
        'on-surface-variant':      '#51443e',
        outline:                   '#83746d',
        'outline-variant':         '#d5c3ba',
        background:                '#fff8f5',
        error:                     '#ba1a1a',
        success:                   '#2e7d32',
      },
      fontFamily: {
        sans:  ['Manrope', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono:  ['Courier Prime', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
        btn:  '999px',
        badge: '20px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(73,59,49,0.06)',
        modal: '0 20px 60px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
