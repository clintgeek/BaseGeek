import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container, Grid } from '@mui/material';
import theme from './theme';
import MongoStatus from './components/MongoStatus';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              BaseGeek
            </Typography>
          </Toolbar>
        </AppBar>
        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to BaseGeek
              </Typography>
              <Typography variant="body1" gutterBottom>
                Your database management and shared services platform.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <MongoStatus />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;