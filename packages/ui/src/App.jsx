import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import BaseGeekHome from './pages/BaseGeekHome';
import DataGeekPage from './pages/DataGeekPage';
import { Box, Typography, Paper } from '@mui/material';
import theme from './theme';

function SettingsPlaceholder() {
  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Settings page coming soon...
        </Typography>
      </Paper>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<BaseGeekHome />} />
            <Route path="/datageek" element={<DataGeekPage />} />
            <Route path="/settings" element={<SettingsPlaceholder />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}