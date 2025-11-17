import { Box } from '@mui/material'
import NavBar from './NavBar'
import { Outlet } from 'react-router-dom'

export const Layout = () => {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <NavBar />
      <Box
        component="main"
        flexGrow={1}
        sx={{
          p: { xs: 2, md: 3, lg: 4 },
          backgroundColor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
