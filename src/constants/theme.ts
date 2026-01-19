/**
 * Netflix-style Dark Theme Constants
 * Centralized theme configuration for consistent styling across the app
 */

export const COLORS = {
    // Primary Netflix brand colors
    primary: '#E50914',
    primaryDark: '#B81D24',
    primaryLight: '#F40612',

    // Background colors
    background: '#141414',
    backgroundSecondary: '#1F1F1F',
    backgroundTertiary: '#2A2A2A',

    // Surface colors
    surface: '#181818',
    surfaceElevated: '#232323',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#808080',
    textDisabled: '#5C5C5C',

    // Accent colors
    accent: '#E50914',
    accentGold: '#FFD700',

    // Status colors
    success: '#46D369',
    warning: '#F5C518',
    error: '#E50914',
    info: '#0080FF',

    // Gradient colors
    gradientStart: 'transparent',
    gradientEnd: '#141414',

    // Skeleton loader colors
    skeletonBase: '#2A2A2A',
    skeletonHighlight: '#3D3D3D',

    // Border colors
    border: '#333333',
    borderLight: '#444444',

    // Overlay and Glass colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    glassBackground: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    tabBarBackground: 'rgba(20, 20, 20, 0.8)',
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    floating: 12,
} as const;

export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    hero: 36,
} as const;

export const FONT_WEIGHTS = {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};

export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
} as const;

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.37,
        shadowRadius: 7.49,
        elevation: 8,
    },
} as const;

// Animation durations
export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

// Screen dimensions helpers
export const CARD_DIMENSIONS = {
    poster: {
        width: 120,
        height: 180,
    },
    backdrop: {
        width: 280,
        height: 160,
    },
    hero: {
        height: 500,
    },
} as const;

// Default theme export
export const theme = {
    colors: COLORS,
    spacing: SPACING,
    fontSizes: FONT_SIZES,
    fontWeights: FONT_WEIGHTS,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    animation: ANIMATION,
    cardDimensions: CARD_DIMENSIONS,
} as const;

export type Theme = typeof theme;
export type Colors = typeof COLORS;
