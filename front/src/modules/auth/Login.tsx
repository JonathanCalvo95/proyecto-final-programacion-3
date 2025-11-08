import React from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      console.error(err);
      alert('Error de login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxWidth={420} mx="auto" mt={4}>
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2}>Login</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField name="email" label="Email" type="email" required fullWidth />
              <TextField name="password" label="Contraseña" type="password" required fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>Ingresar</Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
