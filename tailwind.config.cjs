function channel(name) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

function scale(prefix) {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return Object.fromEntries(shades.map((shade) => [String(shade), channel(`--c-${prefix}-${shade}`)]));
}

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: scale('slate'),
        indigo: scale('indigo'),
      },
      keyframes: {
        iconPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
