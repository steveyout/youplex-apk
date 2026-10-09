import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Youplex Reddish Brand Palette (Matching Web Default: primaryColor 'red')
export const PALETTE = {
    primary: {
        lighter: '#FFE3D5',
        light: '#FF6B6B',
        main: '#FF3030', // Signature Youplex Red
        dark: '#B71833',
        darker: '#7A0930',
        contrastText: '#FFFFFF',
    },
    gradient: {
        primary: ['#FF4565', '#FF3030', '#B71833'],
        primaryLight: ['#FF6B6B', '#FF3030'],
        darkBackdrop: ['transparent', 'rgba(5,5,5,0.3)', 'rgba(5,5,5,0.85)', '#050505'],
        lightBackdrop: ['transparent', 'rgba(244,246,248,0.4)', 'rgba(244,246,248,0.9)', '#F4F6F8'],
        cardOverlay: ['transparent', 'rgba(5,5,5,0.8)', '#050505'],
    },
    secondary: {
        lighter: '#EFD6FF',
        light: '#C684FF',
        main: '#8E33FF',
        dark: '#5119B7',
        darker: '#27097A',
        contrastText: '#FFFFFF',
    },
    info: {
        lighter: '#CAFDF5',
        light: '#61F3F3',
        main: '#00B8D9',
        dark: '#006C9C',
        darker: '#003768',
        contrastText: '#FFFFFF',
    },
    success: {
        lighter: '#D3FCD2',
        light: '#77ED8B',
        main: '#10B981',
        dark: '#059669',
        darker: '#047857',
        contrastText: '#FFFFFF',
    },
    warning: {
        lighter: '#FFF5CC',
        light: '#FFD666',
        main: '#F59E0B',
        dark: '#D97706',
        darker: '#B45309',
        contrastText: '#1C252E',
    },
    error: {
        lighter: '#FFE9D5',
        light: '#FFAC82',
        main: '#EF4444',
        dark: '#B91C1C',
        darker: '#7F1D1D',
        contrastText: '#FFFFFF',
    },
    grey: {
        50: '#FCFDFD',
        100: '#F9FAFB',
        200: '#F4F6F8',
        300: '#DFE3E8',
        400: '#C4CDD5',
        500: '#919EAB',
        600: '#637381',
        700: '#454F5B',
        800: '#1C252E',
        900: '#141A21',
    },
    common: {
        black: '#000000',
        white: '#FFFFFF',
    },
};

export const CustomDarkTheme = {
    ...MD3DarkTheme,
    dark: true,
    colors: {
        ...MD3DarkTheme.colors,
        primary: PALETTE.primary.main, // #FF3030
        onPrimary: '#FFFFFF',
        primaryContainer: PALETTE.primary.darker,
        onPrimaryContainer: PALETTE.primary.lighter,

        secondary: PALETTE.primary.dark,
        onSecondary: '#FFFFFF',

        background: '#050505', // Cinematic pitch black
        onBackground: '#FFFFFF',

        surface: '#0D0F12', // Subtle charcoal
        onSurface: '#FFFFFF',
        surfaceVariant: '#141A21',
        onSurfaceVariant: PALETTE.grey[400],

        outline: PALETTE.grey[600],
        outlineVariant: 'rgba(255, 255, 255, 0.08)',

        elevation: {
            level0: 'transparent',
            level1: '#0A0D12',
            level2: '#141A21',
            level3: '#1C252E',
            level4: '#222B36',
            level5: '#2A3441',
        },

        // Custom Reddish Design Tokens
        brand: PALETTE.primary.main,
        brandDark: PALETTE.primary.dark,
        brandGlow: 'rgba(255, 48, 48, 0.45)',
        cardBg: '#12171E',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        glassBg: 'rgba(13, 16, 21, 0.75)',
        glassBorder: 'rgba(255, 255, 255, 0.12)',
        tvFocus: '#FF3030',
        tvFocusBg: 'rgba(255, 48, 48, 0.22)',
    },
};

export const CustomLightTheme = {
    ...MD3LightTheme,
    dark: false,
    colors: {
        ...MD3LightTheme.colors,
        primary: PALETTE.primary.main,
        onPrimary: '#FFFFFF',
        primaryContainer: PALETTE.primary.lighter,
        onPrimaryContainer: PALETTE.primary.darker,

        secondary: PALETTE.primary.dark,
        onSecondary: '#FFFFFF',

        background: '#F4F6F8', // Crisp modern light gray
        onBackground: '#111827',

        surface: '#FFFFFF',
        onSurface: '#111827',
        surfaceVariant: '#E5E8EC',
        onSurfaceVariant: '#6B7280',

        outline: PALETTE.grey[400],
        outlineVariant: 'rgba(0, 0, 0, 0.08)',

        elevation: {
            level0: 'transparent',
            level1: '#FFFFFF',
            level2: '#F4F6F8',
            level3: '#EAEFF4',
            level4: '#DFE5EC',
            level5: '#D5DDE6',
        },

        brand: PALETTE.primary.main,
        brandDark: PALETTE.primary.dark,
        brandGlow: 'rgba(255, 48, 48, 0.25)',
        cardBg: '#FFFFFF',
        cardBorder: 'rgba(0, 0, 0, 0.08)',
        glassBg: 'rgba(255, 255, 255, 0.85)',
        glassBorder: 'rgba(0, 0, 0, 0.08)',
        tvFocus: '#FF3030',
        tvFocusBg: 'rgba(255, 48, 48, 0.15)',
    },
};
