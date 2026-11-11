import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Dribbble AI Movie Streaming App - Dark UI/UX Reddish Brand Palette
export const PALETTE = {
    primary: {
        lighter: '#FFE5E9',
        light: '#FF5E79',
        main: '#FF2442', // Signature Neon Crimson
        dark: '#D0092B',
        darker: '#8A0019',
        contrastText: '#FFFFFF',
    },
    gradient: {
        primary: ['#FF3B56', '#FF1E3C', '#B3001E'],
        primaryLight: ['#FF5E79', '#FF2442'],
        primaryGlow: ['rgba(255, 36, 66, 0.6)', 'rgba(255, 36, 66, 0.0)'],
        darkBackdrop: ['transparent', 'rgba(8, 9, 12, 0.4)', 'rgba(8, 9, 12, 0.92)', '#08090C'],
        cardOverlay: ['transparent', 'rgba(8, 9, 12, 0.65)', '#08090C'],
        aiGlow: ['rgba(255, 36, 66, 0.25)', 'rgba(255, 36, 66, 0.05)'],
    },
    secondary: {
        lighter: '#FEE4E2',
        light: '#FDA29B',
        main: '#F04438',
        dark: '#B42318',
        darker: '#7A271A',
        contrastText: '#FFFFFF',
    },
    info: {
        lighter: '#E0F2FE',
        light: '#7CD4FD',
        main: '#0BA5EC',
        dark: '#0086C9',
        darker: '#026AA2',
        contrastText: '#FFFFFF',
    },
    success: {
        lighter: '#DCFAE6',
        light: '#75E0A7',
        main: '#12B76A',
        dark: '#027A48',
        darker: '#05603A',
        contrastText: '#FFFFFF',
    },
    warning: {
        lighter: '#FEF0C7',
        light: '#FEC84B',
        main: '#F79009',
        dark: '#DC6803',
        darker: '#B54708',
        contrastText: '#101828',
    },
    error: {
        lighter: '#FEE4E2',
        light: '#FECDCA',
        main: '#F04438',
        dark: '#B42318',
        darker: '#7A271A',
        contrastText: '#FFFFFF',
    },
    grey: {
        50: '#F9FAFB',
        100: '#F2F4F7',
        200: '#EAECF0',
        300: '#D0D5DD',
        400: '#98A2B3',
        500: '#667085',
        600: '#475467',
        700: '#344054',
        800: '#1D2939',
        900: '#101828',
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
        primary: PALETTE.primary.main, // #FF2442
        onPrimary: '#FFFFFF',
        primaryContainer: PALETTE.primary.darker,
        onPrimaryContainer: PALETTE.primary.lighter,

        secondary: PALETTE.primary.dark,
        onSecondary: '#FFFFFF',

        background: '#08090C', // Cinematic pitch dark
        onBackground: '#FFFFFF',

        surface: '#0F1217', // High-contrast matte dark surface
        onSurface: '#FFFFFF',
        surfaceVariant: '#151921',
        onSurfaceVariant: '#98A2B3',

        outline: '#272E3B',
        outlineVariant: 'rgba(255, 255, 255, 0.08)',

        elevation: {
            level0: 'transparent',
            level1: '#0F1217',
            level2: '#151921',
            level3: '#1C222C',
            level4: '#232A37',
            level5: '#2C3443',
        },

        // Dribbble UI/UX Design Tokens
        brand: PALETTE.primary.main,
        brandDark: PALETTE.primary.dark,
        brandGlow: 'rgba(255, 36, 66, 0.45)',
        cardBg: '#0F1217',
        cardBorder: 'rgba(255, 255, 255, 0.07)',
        cardBorderActive: 'rgba(255, 36, 66, 0.5)',
        glassBg: 'rgba(15, 18, 23, 0.88)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
        dockBg: 'rgba(12, 14, 18, 0.92)',
        matchPill: 'rgba(255, 36, 66, 0.16)',
        matchPillText: '#FF334B',
        tvFocus: '#FF2442',
        tvFocusBg: 'rgba(255, 36, 66, 0.22)',
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

        background: '#08090C', // Streaming app stays high-contrast dark
        onBackground: '#FFFFFF',

        surface: '#0F1217',
        onSurface: '#FFFFFF',
        surfaceVariant: '#151921',
        onSurfaceVariant: '#98A2B3',

        outline: '#272E3B',
        outlineVariant: 'rgba(255, 255, 255, 0.08)',

        elevation: {
            level0: 'transparent',
            level1: '#0F1217',
            level2: '#151921',
            level3: '#1C222C',
            level4: '#232A37',
            level5: '#2C3443',
        },

        brand: PALETTE.primary.main,
        brandDark: PALETTE.primary.dark,
        brandGlow: 'rgba(255, 36, 66, 0.45)',
        cardBg: '#0F1217',
        cardBorder: 'rgba(255, 255, 255, 0.07)',
        cardBorderActive: 'rgba(255, 36, 66, 0.5)',
        glassBg: 'rgba(15, 18, 23, 0.88)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
        dockBg: 'rgba(12, 14, 18, 0.92)',
        matchPill: 'rgba(255, 36, 66, 0.16)',
        matchPillText: '#FF334B',
        tvFocus: '#FF2442',
        tvFocusBg: 'rgba(255, 36, 66, 0.22)',
    },
};
