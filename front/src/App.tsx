import { Routes, Route, Navigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { Box } from '@mui/material'
import NavBar from './modules/layout/NavBar'
import Login from './modules/auth/Login'
import Register from './modules/auth/Register'
import Spaces from './modules/spaces/Spaces'
import MyBookings from './modules/bookings/MyBookings'
import AdminDashboard from './modules/admin/AdminDashboard'
import AdminSpaces from './modules/admin/AdminSpaces'
import { useAuth } from './context/AuthContext'
import type { JSX } from 'react'

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const authenticated = !!user

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        Cargando...
      </Box>
    )
  }

  // Layout para login/register cuando NO hay sesión
  if (!authenticated && isAuthRoute) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e6ecf3 100%)', p: 2 }}
      >
        <Box width="100%" maxWidth={420}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Box>
      </Box>
    )
  }

  // Layout autenticado
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      {authenticated && !isAuthRoute && <NavBar />}
      <Box component="main" flexGrow={1} sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Routes>
          {/* Mostrar Dashboard si el usuario es admin, sino Spaces */}
          <Route
            path="/"
            element={
              authenticated ? (
                user?.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Spaces />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
          <Route path="/register" element={<Navigate to={authenticated ? '/' : '/register'} replace />} />
          <Route
            path="/my"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/spaces"
            element={
              <AdminRoute>
                <AdminSpaces />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
        </Routes>
      </Box>
    </Box>
  )
}
