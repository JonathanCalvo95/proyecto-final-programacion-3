import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import Login from './modules/auth/Login'
import Spaces from './modules/spaces/Spaces'
import Bookings from './modules/bookings/Bookings'
import AdminDashboard from './modules/admin/AdminDashboard'
import AdminSpaces from './modules/admin/AdminSpaces'
import AdminBookings from './modules/admin/AdminBookings'
import AdminUsers from './modules/admin/AdminUsers'
import Ratings from './modules/ratings/Ratings'
import PayBooking from './modules/pay/PayBooking'
import BookingDetail from './modules/bookings/BookingDetail'
import { useAuth } from './context/AuthContext'
import { USER_ROLE } from './types/enums'
import { Layout } from './modules/layout'
import type { UserRole } from './types/enums'

type GuardProps = {
  role?: UserRole
}

function Guard({ role }: GuardProps) {
  const { user } = useAuth()
  const loc = useLocation()

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: loc }} />
  }

  if (role && user.role !== role) {
    if (user.role === USER_ROLE.ADMIN) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/ratings" replace />
  }

  return <Outlet />
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

  const rootRedirect = user ? (user.role === USER_ROLE.ADMIN ? '/admin' : '/ratings') : '/auth/login'

  return (
    <Routes key={user ? 'auth' : 'guest'}>
      {/* Root */}
      <Route path="/" element={<Navigate to={rootRedirect} replace />} />

      {/* Auth */}
      <Route path="/auth">
        <Route path="login" element={user ? <Navigate to={rootRedirect} replace /> : <Login />} />
      </Route>

      <Route element={<Guard />}>
        <Route element={<Layout />}>
          {/* Solo admins */}
          <Route element={<Guard role={USER_ROLE.ADMIN} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/spaces" element={<AdminSpaces />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Rutas de usuario cliente */}
          <Route element={<Guard role={USER_ROLE.CLIENT} />}>
            <Route path="/spaces" element={<Spaces />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/pay/:bookingId" element={<PayBooking />} />
          </Route>

          {/* Detalle de reserva accesible para admin y cliente */}
          <Route path="/bookings/:id" element={<BookingDetail />} />

          <Route path="/ratings" element={<Ratings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={rootRedirect} replace />} />
    </Routes>
  )
}
