import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppLayout from './components/AppLayout';
import AppRoutes from './routes'
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </AppLayout>
    </ThemeProvider>
  );
}