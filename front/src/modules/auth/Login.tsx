import React from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    setLoading(true)
    try {
      await login(email, password)
      nav('/')
    } catch (err) {
      console.error(err)
      alert('Error de login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxWidth={420} mx="auto" mt={4}>
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <WorkspacesOutlinedIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.5,
                mt: 1,
                backgroundImage: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Coworking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de espacios y reservas
            </Typography>
          </Box>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <TextField name="email" label="Email" type="email" required fullWidth />
              <TextField name="password" label="Contraseña" type="password" required fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>
                Ingresar
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
