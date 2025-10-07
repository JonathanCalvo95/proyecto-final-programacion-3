import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { TextField, Button, Container, Box, Typography } from '@mui/material';

interface ILoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ILoginFormData>();

  const onSubmit: SubmitHandler<ILoginFormData> = (data) => {
    console.log('Login data:', data);
    // Implement your authentication logic here (e.g., API call)
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Iniciar sesion
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          
          <TextField margin="normal" required fullWidth id="username" label="Nombre de usuario" autoComplete="username" autoFocus
            {...register('username', { required: 'El nombre de usuario es requerido' })} error={!!errors.username} helperText={errors.username?.message} />
          
          <TextField margin="normal" required fullWidth id="password" label="Contraseña" type="password" autoComplete="current-password" 
          {...register('password', { required: 'La contraseña es requerida' })} error={!!errors.password} helperText={errors.password?.message} />
            
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} > Ingresar </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;