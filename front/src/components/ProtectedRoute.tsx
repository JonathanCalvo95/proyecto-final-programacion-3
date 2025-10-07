import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider'; // Asegúrate de que la ruta sea correcta

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Obteniendo el estado de autenticación

  if (!isAuthenticated) {
    return <Navigate to="/login" />; // Redirige a la página de login si no está autenticado
  }

  return <>{children}</>; // Si está autenticado, renderiza el contenido de la ruta protegida
};

export default ProtectedRoute;
