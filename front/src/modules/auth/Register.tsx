import React from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const firstName = fd.get('firstName') as string
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    setLoading(true)
    try {
      await register(firstName, email, password)
      nav('/')
    } catch (err) {
      console.error(err)
      alert('Error de registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxWidth={480} mx="auto" mt={4}>
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2}>
            Registro
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField name="firstName" label="Nombre" required fullWidth />
              <TextField name="email" label="Email" type="email" required fullWidth />
              <TextField
                name="password"
                label="Contraseña"
                type="password"
                required
                fullWidth
                inputProps={{ minLength: 6 }}
              />
              <Button type="submit" variant="contained" disabled={loading}>
                Crear cuenta
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
