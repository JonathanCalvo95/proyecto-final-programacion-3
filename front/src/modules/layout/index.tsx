import { Box, Container } from '@mui/material';
import Sidebar from '../sidebar';

    export const Layout = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
                <Sidebar/>

        Content inside the container
      </Box>
    </Container>
  )
};