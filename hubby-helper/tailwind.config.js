/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          light: '#1A2F45',
          dark: '#080F16',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#9E7A2E',
        },
        rose: {
          DEFAULT: '#E8B4B8',
          light: '#F5D5D8',
          dark: '#C9848A',
        },
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        playfair: ['PlayfairDisplay_400Regular'],
        'playfair-bold': ['PlayfairDisplay_700Bold'],
        'playfair-italic': ['PlayfairDisplay_400Regular_Italic'],
      },
    },
  },
  plugins: [],
};
