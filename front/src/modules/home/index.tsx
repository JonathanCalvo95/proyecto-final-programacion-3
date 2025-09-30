import { Container, Typography, Box } from '@mui/material';

export const Home = () => (
  <>
    <Container maxWidth="md"> {/* Container que envuelve el contenido */}
      <Box sx={{ mt: 4, mb: 4 }}> {/* Caja con margen */}
        <Typography variant="h2" component="h1" gutterBottom> {/* Título principal */}
          ¡Bienvenido a mi página de inicio!
        </Typography>
        <Typography variant="body1" paragraph> {/* Párrafo de texto */}
          Esta es una página de inicio básica creada con React, TypeScript y Material UI.
        </Typography>
        <Typography variant="body1">
          MUI nos ayuda a construir interfaces de usuario modernas siguiendo el diseño de Google [7].
        </Typography>
      </Box>
    </Container>
  </>
)