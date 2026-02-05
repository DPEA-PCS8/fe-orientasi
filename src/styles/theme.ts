import { createTheme } from '@mui/material/styles';

// OJK Design System
// Clean, minimal, elegant with OJK branding

const ojkTheme = createTheme({
  palette: {
    primary: {
      main: '#DA251C', // OJK Red
      light: '#E35D55',
      dark: '#9A1A14',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#59595B', // OJK Grey
      light: '#808080',
      dark: '#333333',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fbfbfd',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#86868b',
    },
    error: {
      main: '#ff3b30',
    },
    warning: {
      main: '#ff9500',
    },
    info: {
      main: '#5ac8fa',
    },
    success: {
      main: '#34c759',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"SF Pro Text"',
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
    },
    body2: {
      letterSpacing: '-0.01em',
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
          fontWeight: 500,
          borderRadius: 980,
          padding: '10px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'scale(1.02)',
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
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(218, 37, 28, 0.15)',
            },
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
          color: '#1d1d1f',
          backgroundColor: '#fbfbfd',
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
          border: '1px solid rgba(0, 0, 0, 0.06)',
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
  },
});

export default ojkTheme;
