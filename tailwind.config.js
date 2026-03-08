/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        script: ['var(--font-script)', 'cursive'],
        serif: ['var(--font-serif)', 'serif'],
      },
      backgroundImage: {
        'rainbow-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        'rainbow-gradient-alt': 'linear-gradient(135deg, #f093fb 0%, #4facfe 25%, #00f2fe 50%, #667eea 75%, #764ba2 100%)',
      },
    },
  },
  plugins: [],
}
