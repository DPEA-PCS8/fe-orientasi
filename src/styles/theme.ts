import { createTheme } from '@mui/material/styles';

// OJK Color Palette
export const COLORS = {
  PRIMARY: '#DA251C',
  PRIMARY_GRADIENT: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
  BACKGROUND: '#FBFBFD',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1D1D1F',
  TEXT_SECONDARY: '#86868B',
  BORDER: 'rgba(0, 0, 0, 0.06)',
  ERROR: '#D32F2F',
  SUCCESS: '#2E7D32',
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
      paper: COLORS.SURFACE,
    },
    text: {
      primary: COLORS.TEXT_PRIMARY,
      secondary: COLORS.TEXT_SECONDARY,
    },
    error: {
      main: COLORS.ERROR,
    },
    warning: {
      main: '#ff9500',
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
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
    body2: {
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
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
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'scale(1.02)',
          },
        },
        containedPrimary: {
          background: COLORS.PRIMARY_GRADIENT,
          '&:hover': {
            background: COLORS.PRIMARY_GRADIENT,
            opacity: 0.9,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(218, 37, 28, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backdropFilter: 'saturate(180%) blur(20px)',
          backgroundColor: 'rgba(251, 251, 253, 0.8)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: COLORS.BORDER,
            },
            '&:hover fieldset': {
              borderColor: COLORS.PRIMARY,
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.1)',
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.PRIMARY,
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.15)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: COLORS.TEXT_SECONDARY,
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
          borderRadius: 6,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '16px 20px',
        },
        head: {
          fontWeight: 600,
          color: COLORS.TEXT_PRIMARY,
          backgroundColor: COLORS.BACKGROUND,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(218, 37, 28, 0.04) !important',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 4px 40px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${COLORS.BORDER}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '8px 12px',
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
        },
      },
    },
  },
});

export default theme;
