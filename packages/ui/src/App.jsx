import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import AuthCallback from './pages/AuthCallback';
import BaseGeekHome from './pages/BaseGeekHome';
import DataGeekPage from './pages/DataGeekPage';
import UserGeekPage from './pages/UserGeekPage';
import Settings from './pages/Settings';
import SharedAuthProvider from './components/SharedAuthProvider';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SharedAuthProvider app="basegeek">
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<BaseGeekHome />} />
              <Route path="data-geek" element={<DataGeekPage />} />
              <Route path="user-geek" element={<UserGeekPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SharedAuthProvider>
    </ThemeProvider>
  );
}

export default App;