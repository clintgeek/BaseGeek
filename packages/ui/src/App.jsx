import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import RequireAuth from './components/RequireAuth';
import SharedAuthProvider from './components/SharedAuthProvider';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SharedAuthProvider app="basegeek">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          />
        </Routes>
      </SharedAuthProvider>
    </ThemeProvider>
  );
}

export default App;