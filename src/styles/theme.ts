import { createTheme } from '@mui/material/styles';

// OJK Color Palette with Glassmorphism
export const COLORS = {
  PRIMARY: '#DA251C',
  PRIMARY_GRADIENT: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
  BACKGROUND: '#F5F5F7',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1D1D1F',
  TEXT_SECONDARY: '#86868B',
  BORDER: 'rgba(0, 0, 0, 0.06)',
  BORDER_LIGHT: 'rgba(255, 255, 255, 0.2)',
  ERROR: '#FF3B30',
  SUCCESS: '#31A24C',
  WARNING: '#FF9500',
  GLASS_BG: 'rgba(255, 255, 255, 0.85)',
  GLASS_BORDER: 'rgba(0, 0, 0, 0.08)',
} as const;

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.PRIMARY,
      light: '#E35D55',
      dark: '#9A1A14',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#59595B',
      light: '#808080',
      dark: '#333333',
      contrastText: '#FFFFFF',
    },
    background: {
      default: COLORS.BACKGROUND,
      paper: COLORS.GLASS_BG,
    },
    text: {
      primary: COLORS.TEXT_PRIMARY,
      secondary: COLORS.TEXT_SECONDARY,
    },
    error: {
      main: COLORS.ERROR,
    },
    warning: {
      main: COLORS.WARNING,
    },
    info: {
      main: '#5ac8fa',
    },
    success: {
      main: COLORS.SUCCESS,
    },
    divider: COLORS.BORDER,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
    },
    body2: {
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '12px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: '0 4px 20px rgba(218, 37, 28, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(218, 37, 28, 0.25)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        containedPrimary: {
          background: COLORS.PRIMARY_GRADIENT,
          '&:hover': {
            background: COLORS.PRIMARY_GRADIENT,
            boxShadow: '0 12px 40px rgba(218, 37, 28, 0.35)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(218, 37, 28, 0.04)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          background: 'rgba(250, 251, 253, 0.8)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(251, 251, 253, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            '& fieldset': {
              borderColor: COLORS.GLASS_BORDER,
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(218, 37, 28, 0.4)',
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.1)',
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.PRIMARY,
              borderWidth: '2px',
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.15)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: COLORS.TEXT_SECONDARY,
          transition: 'all 0.2s ease',
          '&.Mui-checked': {
            color: COLORS.PRIMARY,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '16px 20px',
          transition: 'background-color 0.2s ease',
        },
        head: {
          fontWeight: 600,
          color: COLORS.TEXT_PRIMARY,
          backgroundColor: 'rgba(250, 251, 253, 0.8)',
          backdrop: 'blur(10px)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(218, 37, 28, 0.03) !important',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '10px 12px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(218, 37, 28, 0.08)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: COLORS.PRIMARY,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          borderRadius: 16,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: COLORS.GLASS_BG,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${COLORS.GLASS_BORDER}`,
          borderRadius: '12px !important',
          marginBottom: '16px',
          '&.Mui-expanded': {
            marginBottom: '16px',
          },
          '&:before': {
            display: 'none',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(218, 37, 28, 0.08)',
            borderColor: 'rgba(218, 37, 28, 0.2)',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
          minHeight: '56px',
          '&.Mui-expanded': {
            minHeight: '56px',
          },
          '&:hover': {
            backgroundColor: 'rgba(218, 37, 28, 0.04)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

export default theme;
