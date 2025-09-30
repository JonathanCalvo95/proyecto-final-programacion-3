import { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

function Sidebar() {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean | ((prevState: boolean) => boolean)) => () => {
    setOpen(newOpen);
  };

  const drawerContent = (
    <List>
      <ListItem key={"Home"} onClick={toggleDrawer(false)}>
        <ListItemText primary="Home" />
      </ListItem>
      <ListItem key={"Usuarios"} onClick={toggleDrawer(false)}>
        <ListItemText primary="Usuarios" />
      </ListItem>   
      <ListItem key={"Espacios"} onClick={toggleDrawer(false)}>
        <ListItemText primary="Espacios" />
      </ListItem>
      <ListItem key={"Reservas"} onClick={toggleDrawer(false)}>
        <ListItemText primary="Reservas" />
      </ListItem>
      <ListItem key={"Métricas"} onClick={toggleDrawer(false)}>
        <ListItemText primary="Métricas" />
      </ListItem>
    </List>
  );

  return (
    <div>
      <IconButton onClick={toggleDrawer(true)}>
        <MenuIcon />
      </IconButton>
      <Drawer open={open} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </div>
  );
}

export default Sidebar;