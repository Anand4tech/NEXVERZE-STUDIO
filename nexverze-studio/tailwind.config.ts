import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a12',
        card: '#18181b',
        border: '#27272a',
        purple: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};
export default config;
