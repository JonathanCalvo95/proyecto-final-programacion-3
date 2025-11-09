import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './modules/auth/Login'
import { Box, Container } from '@mui/material'
import NavBar from './modules/layout/NavBar'
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
  return (
    <div className="App">
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <NavBar />
        <Container sx={{ py: 3, flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Spaces />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </div>
  )
}
