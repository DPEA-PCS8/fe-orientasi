import { createTheme } from '@mui/material/styles';

// Design tokens — mirrors sso/admin-console (Admin.Web/wwwroot/css/tokens.css).
// Single source of truth. Components must consume these, never raw hex.
export const COLORS = {
  PRIMARY: '#BD1F27',
  PRIMARY_DARK: '#8B1620',
  PRIMARY_GRADIENT: 'linear-gradient(135deg, #BD1F27 0%, #8B1620 100%)',
  PRIMARY_RGB: '189, 31, 39',

  INK: '#0F172A',
  TEXT_PRIMARY: '#334155',
  TEXT_SECONDARY: '#64748B',
  TEXT_SUBTLE: '#94A3B8',

  BORDER: '#E2E8F0',
  BORDER_INPUT: '#CBD5E1',
  SOFT: '#F8FAFC',
  SURFACE: '#FFFFFF',
  BACKGROUND: '#F8FAFC',

  ERROR: '#B91C1C',
  SUCCESS: '#15803D',
  WARNING: '#B45309',

  SHADOW_CARD: '0 12px 24px rgba(15, 23, 42, 0.08)',
  SHADOW_NAV: '0 10px 22px rgba(15, 23, 42, 0.08)',
  CARD_GRADIENT: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 100%)',
} as const;

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.PRIMARY,
      light: '#D14A50',
      dark: COLORS.PRIMARY_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: COLORS.TEXT_PRIMARY,
      light: COLORS.TEXT_SECONDARY,
      dark: COLORS.INK,
      contrastText: '#FFFFFF',
    },
    background: {
      default: COLORS.BACKGROUND,
      paper: COLORS.SURFACE,
    },
    text: {
      primary: COLORS.INK,
      secondary: COLORS.TEXT_SECONDARY,
    },
    error: { main: COLORS.ERROR },
    warning: { main: COLORS.WARNING },
    info: { main: '#2563EB' },
    success: { main: COLORS.SUCCESS },
    divider: COLORS.BORDER,
  },
  typography: {
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', lineHeight: 1.15, color: COLORS.INK },
    h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: COLORS.INK },
    h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.015em', lineHeight: 1.25, color: COLORS.INK },
    h4: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em', lineHeight: 1.3, color: COLORS.INK },
    h5: { fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.4, color: COLORS.INK },
    h6: { fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4, color: COLORS.INK },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6, color: COLORS.TEXT_PRIMARY },
    body2: { fontSize: '0.875rem', lineHeight: 1.55, color: COLORS.TEXT_PRIMARY },
    caption: { fontSize: '0.75rem', color: COLORS.TEXT_SECONDARY },
    button: { fontWeight: 600, fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '0 1.25rem',
          height: '2.5rem',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(189, 31, 39, 0.18)' },
          '&:active': { transform: 'scale(0.98)' },
        },
        containedPrimary: {
          background: COLORS.PRIMARY_GRADIENT,
          '&:hover': { background: COLORS.PRIMARY_GRADIENT },
        },
        outlined: {
          borderColor: COLORS.BORDER_INPUT,
          color: COLORS.TEXT_PRIMARY,
          backgroundColor: COLORS.SOFT,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            borderColor: COLORS.TEXT_SUBTLE,
            backgroundColor: '#F1F5F9',
            color: COLORS.INK,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          background: COLORS.CARD_GRADIENT,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: COLORS.SHADOW_CARD,
        },
        elevation0: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: COLORS.CARD_GRADIENT,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: COLORS.SHADOW_CARD,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'saturate(180%) blur(18px)',
          borderBottom: `1px solid ${COLORS.BORDER}`,
          color: COLORS.INK,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: COLORS.SURFACE,
          borderRight: `1px solid ${COLORS.BORDER}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: COLORS.SURFACE,
            transition: 'all 0.18s ease',
            '& fieldset': {
              borderColor: COLORS.BORDER_INPUT,
            },
            '&:hover fieldset': {
              borderColor: COLORS.TEXT_SUBTLE,
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.PRIMARY,
              borderWidth: '1px',
              boxShadow: `0 0 0 4px rgba(${COLORS.PRIMARY_RGB}, 0.12)`,
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: COLORS.TEXT_SUBTLE,
          '&.Mui-checked': { color: COLORS.PRIMARY },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.72rem',
          borderRadius: 9,
          height: 'auto',
          padding: '0.22rem 0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // Function form so the per-cell `align` prop still wins. Default to
        // center only when align is not explicitly set (align="left" works).
        root: ({ ownerState }) => ({
          borderBottom: `1px solid ${COLORS.BORDER}`,
          padding: '9px 14px',
          fontSize: '0.875rem',
          color: COLORS.TEXT_PRIMARY,
          verticalAlign: 'middle',
          ...(!ownerState.align || ownerState.align === 'inherit' ? { textAlign: 'center' } : {}),
        }),
        head: {
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: COLORS.INK,
          background: COLORS.SURFACE,
          borderBottom: `2px solid ${COLORS.BORDER}`,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.18s ease',
          '&:hover': {
            backgroundColor: 'rgba(248, 250, 252, 0.85) !important',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          background: COLORS.SURFACE,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          padding: '8px 10px',
          fontSize: '0.875rem',
          '&:hover': { backgroundColor: '#F1F5F9' },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: COLORS.PRIMARY,
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${COLORS.BORDER}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          background: COLORS.SURFACE,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
          borderRadius: 12,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: COLORS.CARD_GRADIENT,
          border: `1px solid ${COLORS.BORDER}`,
          borderRadius: '12px !important',
          marginBottom: '12px',
          boxShadow: 'none',
          '&.Mui-expanded': { marginBottom: '12px' },
          '&:before': { display: 'none' },
          '&:hover': { borderColor: `rgba(${COLORS.PRIMARY_RGB}, 0.2)` },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '8px 18px',
          minHeight: '52px',
          '&.Mui-expanded': { minHeight: '52px' },
          '&:hover': { backgroundColor: `rgba(${COLORS.PRIMARY_RGB}, 0.03)` },
        },
      },
    },
  },
});

export default theme;
