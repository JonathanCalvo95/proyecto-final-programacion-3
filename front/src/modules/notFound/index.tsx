    import { Box, Typography, Button, Container } from '@mui/material';
    import { Link } from 'react-router-dom';

    export const NotFound = () => {
      return (
        <Container maxWidth="md" sx={{ textAlign: 'center', mt: 8 }}>
          <Box sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
            <Typography variant="h1" component="h1" gutterBottom>
              404
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom>
              Page Not Found
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/"
            >
              Go to Homepage
            </Button>
          </Box>
        </Container>
      );
    };