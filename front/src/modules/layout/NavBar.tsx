import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLE } from '../../types/enums'

export default function NavBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <WorkspacesOutlinedIcon sx={{ fontSize: 30 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
            Coworking
          </Typography>
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
              <Button color="inherit" component={RouterLink} to="/admin">
                Dashboard
              </Button>
              <Button color="inherit" component={RouterLink} to="/admin/spaces">
                Gestionar espacios
              </Button>
            </>
          )}
          <Button color="inherit" component={RouterLink} to="/">
            Espacios
          </Button>
          {user && (
            <Button color="inherit" component={RouterLink} to="/my">
              Mis Reservas
            </Button>
          )}

          {!user && (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Registro
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <>
              <IconButton color="inherit" onClick={handleMenu}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>{user.firstName}</MenuItem>
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
