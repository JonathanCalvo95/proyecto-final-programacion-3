import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { AppThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App'

function Fallback({ error }: { error: unknown }) {
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#c00' }}>
      <h2>Ha ocurrido un error</h2>
      <pre>{String((error as Error)?.message ?? error)}</pre>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={Fallback}>
      <AppThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <App />
            </LocalizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </AppThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
