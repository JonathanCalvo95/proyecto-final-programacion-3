import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#6366f1' },
    background: {
      default: '#e5e7eb',
      paper: '#ffffff',
    },
    divider: 'rgba(148,163,184,0.35)',
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'].join(','),
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: 0.08,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    body2: {
      color: 'rgba(15,23,42,0.78)',
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 14,
          boxShadow: '0 18px 45px rgba(15,23,42,0.08)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 14,
          border: '1px solid rgba(148,163,184,0.35)',
          boxShadow: '0 18px 45px rgba(15,23,42,0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: 'rgba(148,163,184,0.35)',
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
  },
})

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
