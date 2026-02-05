import { createTheme } from '@mui/material/styles';

// OJK Color Palette
export const COLORS = {
  PRIMARY: '#DA251C',
  PRIMARY_GRADIENT: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
  BACKGROUND: '#FBFBFD',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1D1D1F',
  TEXT_SECONDARY: '#86868B',
  BORDER: 'rgba(0, 0, 0, 0.08)',
  ERROR: '#D32F2F',
  SUCCESS: '#2E7D32',
} as const;

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.PRIMARY,
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
    success: {
      main: COLORS.SUCCESS,
    },
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
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
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
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    body1: {
      lineHeight: 1.5,
    },
    body2: {
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
        },
        containedPrimary: {
          background: COLORS.PRIMARY_GRADIENT,
          '&:hover': {
            background: COLORS.PRIMARY_GRADIENT,
            opacity: 0.9,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: COLORS.BORDER,
            },
            '&:hover fieldset': {
              borderColor: COLORS.PRIMARY,
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.PRIMARY,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
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
