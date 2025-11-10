import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import NavBar from './modules/layout/NavBar'
import Login from './modules/auth/Login'
import Register from './modules/auth/Register'
import Spaces from './modules/spaces/Spaces'
import MyBookings from './modules/bookings/MyBookings'
import AdminDashboard from './modules/admin/AdminDashboard'
import AdminSpaces from './modules/admin/AdminSpaces'
import { useAuth } from './context/AuthContext'
import { USER_ROLE } from './types/enums'

function RequireAuth() {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/auth/login" replace state={{ from: loc }} />
  return <Outlet />
}
function RequireAdmin() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth/login" replace />
  if (user.role !== USER_ROLE.ADMIN) return <Navigate to="/spaces" replace />
  return <Outlet />
}

function AppLayout() {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <NavBar />
      <Box component="main" flexGrow={1} sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    )
  }

  const rootRedirect = user ? (user.role === USER_ROLE.ADMIN ? '/admin' : '/spaces') : '/auth/login'

  return (
    <Routes key={user ? 'auth' : 'guest'}>
      <Route path="/" element={<Navigate to={rootRedirect} replace />} />

      <Route path="/auth">
        <Route path="login" element={user ? <Navigate to={rootRedirect} replace /> : <Login />} />
        <Route path="register" element={user ? <Navigate to={rootRedirect} replace /> : <Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/bookings" element={<MyBookings />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/spaces" element={<AdminSpaces />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={rootRedirect} replace />} />
    </Routes>
  )
}
