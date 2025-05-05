import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppLayout from './components/AppLayout';
import AppRoutes from './routes'
import theme from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </ThemeProvider>
  );
}