import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} component={RouterLink} to="/" color="inherit" style={{ textDecoration: 'none' }}>
          Coworking
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">Espacios</Button>
          {user && <Button color="inherit" component={RouterLink} to="/my">Mis Reservas</Button>}
          {user?.role === 'admin' && (
            <>
              <Button color="inherit" component={RouterLink} to="/admin">Dashboard</Button>
              <Button color="inherit" component={RouterLink} to="/admin/spaces">Espacios</Button>
            </>
          )}
          {!user && (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Registro</Button>
            </>
          )}
          {user && (
            <>
              <IconButton color="inherit" onClick={handleMenu}>
                <AccountCircle />
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem disabled>{user.name}</MenuItem>
                <MenuItem onClick={async () => { handleClose(); await logout(); nav('/'); }}>Salir</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
