/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      "2xsm": "375px",
      xsm: "425px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "7.5": "1.875rem",
        "11": "2.75rem",
        "11.5": "2.875rem",
        "12.5": "3.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "100": "25rem",
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        green: {
          DEFAULT: "#5fd5cb",
          1: "#F3F4F6",
        },
        yellow: {
          DEFAULT: "#f5de74",
        },
        red: {
          DEFAULT: "#f44837b5",
        },
        gray: {
          DEFAULT: "#EFF4FB",
          dark: "#122031",
          1: "#F9FAFB",
          2: "#F3F4F6",
          3: "#E5E7EB",
          4: "#D1D5DB",
          5: "#9CA3AF",
          6: "#6B7280",
          7: "#374151",
        },
        dark: {
          DEFAULT: "#1C2434",
          1: "#24303E",
          2: "#0B1521",
          3: "#1A2E44",
          4: "#2A3F58",
          5: "#4B5F79",
          6: "#6B7D93",
          7: "#8B9CAD",
        },
        stroke: {
          DEFAULT: "#E2E8F0",
          dark: "#2E3A47",
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        coral: {
          500: '#FF6B6B',
          600: '#FF5252',
        },
      },
      boxShadow: {
        card: "0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)",
        "card-2": "0px 8px 24px rgba(149, 157, 165, 0.2)",
        "3": "0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)",
        datepicker: "0px 5px 15px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      dropShadow: {
        card: "0px 1px 4px rgba(0, 0, 0, 0.12)",
        "card-2": "0px 8px 24px rgba(149, 157, 165, 0.2)",
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-custom': {
          '0%': { opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.6' },
        },
        'pulse-shadow': {
          '0%': {
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 255, 255, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 255, 255, 0.2)'
          },
          '100%': {
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 255, 255, 0.1)'
          },
        },
        'pulse-text': {
          '0%': { opacity: '0.8' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-custom': 'pulse-custom 2s infinite ease-in-out',
        'pulse-shadow': 'pulse-shadow 2s infinite ease-in-out',
        'pulse-text': 'pulse-text 2s infinite ease-in-out',
      },
      fontSize: {
        "body-sm": "0.875rem",
        "body-xs": "0.75rem",
      },
      fontFamily: {
        comfortaa: ['Comfortaa', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
        gasoek: ['Gasoek One', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
        lato: ['Lato', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
