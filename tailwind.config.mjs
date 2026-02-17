/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bone: '#FFFFFF',
        paper: '#FFFFFF',
        clay: '#E2D7C8',
        ink: '#4B433D',
        note: '#3F3832',
        ochre: '#F8DE7E',
        moss: '#5A6948',
        olive: '#708058',
        sage: '#A8B596',
        bark: '#D8BF62',
        blush: '#EFE5D6',
        butter: '#F2E8D2',
        sprout: '#E3EBD9',
        sand: '#F6F0E7',
        mist: '#FBF9F6',
        petal: '#F5E7DD',
        cloud: '#E8F1F6',
        lilac: '#EEE8F6',
        meadow: '#E8F0E2',
        sun: '#F7EFDA',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        headers: ['"DM Serif Display"', 'serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px rgba(50, 40, 28, 0.08)',
        luxe: '0 30px 70px rgba(46, 34, 20, 0.12)',
        line: '0 0 0 1px rgba(61, 52, 45, 0.08)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'text-rise': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-blur': {
          '0%': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        'drift-soft': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -8px, 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'text-rise': 'text-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-blur': 'fade-in-blur 0.85s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drift-soft': 'drift-soft 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
