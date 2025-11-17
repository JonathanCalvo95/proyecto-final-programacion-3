import React from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string) || ''
    const password = (fd.get('password') as string) || ''

    setLoading(true)
    setError(null)

    try {
      await login(email.trim(), password)
      nav('/')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error iniciando sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'radial-gradient(circle at top, #1d4ed8 0, #020617 38%, #020617 100%)',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 4,
          boxShadow: '0 22px 55px rgba(15,23,42,0.65)',
          border: '1px solid rgba(148,163,184,0.5)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '20px',
                mx: 'auto',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 30% 0, #60a5fa, #1d4ed8)',
                color: 'common.white',
              }}
            >
              <WorkspacesOutlinedIcon sx={{ fontSize: 30 }} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.6,
                backgroundImage: 'linear-gradient(90deg, #0f172a, #1d4ed8)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Coworking
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Ingresá para gestionar tus reservas y espacios
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                name="email"
                label="Email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.1,
                  borderRadius: 999,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: 15,
                }}
              >
                {loading ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
            ¿No tenés cuenta? Pedí acceso al administrador.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
