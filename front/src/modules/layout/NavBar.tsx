import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLE } from '../../types/enums'

export default function NavBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }

    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navButtonSx = (path: string) => ({
    borderRadius: 8,
    px: 2.5,
    py: 1,
    fontSize: 14,
    lineHeight: 1.4,
    textTransform: 'none' as const,
    fontWeight: 500,
    color: 'rgba(248,250,252,0.86)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    minHeight: 36,
    ...(isActive(path) && {
      backgroundColor: 'rgba(248,250,252,0.16)',
      borderColor: 'rgba(248,250,252,0.28)',
    }),
    '&:hover': {
      backgroundColor: 'rgba(248,250,252,0.22)',
      borderColor: isActive(path) ? 'rgba(248,250,252,0.28)' : 'rgba(148,163,184,0.45)',
    },
    transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
  })

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderRadius: 0,
        background: 'linear-gradient(120deg, rgba(15,23,42,0.96), rgba(30,64,175,0.97))',
        borderBottom: '1px solid rgba(148,163,184,0.45)',
        backdropFilter: 'blur(14px)',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          px: { xs: 2, md: 3, lg: 6 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            gap: 1.2,
            minWidth: 160,
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(248,250,252,0.12)',
              flexShrink: 0,
            }}
          >
            <WorkspacesOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ lineHeight: 1.1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              Coworking
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.8)' }}>
              Admin & reservas
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {user?.role === USER_ROLE.ADMIN && (
            <>
              <Button component={RouterLink} to="/admin" sx={navButtonSx('/admin')}>
                Métricas
              </Button>
              <Button component={RouterLink} to="/admin/spaces" sx={navButtonSx('/admin/spaces')}>
                Gestionar espacios
              </Button>
              <Button component={RouterLink} to="/admin/bookings" sx={navButtonSx('/admin/bookings')}>
                Gestionar reservas
              </Button>
            </>
          )}

          {user && user.role !== USER_ROLE.ADMIN && (
            <>
              <Button component={RouterLink} to="/ratings" sx={navButtonSx('/ratings')}>
                Calificaciones
              </Button>
              <Button component={RouterLink} to="/spaces" sx={navButtonSx('/spaces')}>
                Reservar espacio
              </Button>
              <Button component={RouterLink} to="/bookings" sx={navButtonSx('/bookings')}>
                Mis reservas
              </Button>
            </>
          )}
          {user && user.role === USER_ROLE.ADMIN && (
            <>
              <Button component={RouterLink} to="/ratings" sx={navButtonSx('/ratings')}>
                Calificaciones
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!user && (
            <>
              <Button
                component={RouterLink}
                to="/auth/login"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  px: 2.5,
                  py: 1,
                  borderRadius: 8,
                  color: 'rgba(248,250,252,0.9)',
                  border: '1px solid rgba(148,163,184,0.6)',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(248,250,252,0.08)',
                    borderColor: 'rgba(209,213,219,0.9)',
                  },
                }}
              >
                Login
              </Button>
            </>
          )}

          {user && (
            <>
              <Typography variant="body2" sx={{ mr: 0.5, color: 'rgba(226,232,240,0.9)' }}>
                {user.firstName}
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleMenu}
                sx={{
                  p: 0.5,
                  borderRadius: 8,
                  bgcolor: 'rgba(15,23,42,0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(15,23,42,0.7)',
                  },
                }}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {user?.role === USER_ROLE.ADMIN && (
                  <MenuItem
                    component={RouterLink}
                    to="/admin/users"
                    onClick={handleClose}
                  >
                    Usuarios
                  </MenuItem>
                )}
                <MenuItem
                  onClick={async () => {
                    handleClose()
                    await logout()
                    nav('/')
                  }}
                >
                  Salir
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
