import { useState } from 'react';
import { Box, Paper, Tabs, Tab, TextField, Button, Typography, Alert, Divider } from '@mui/material';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import useSharedAuthStore from '../store/sharedAuthStore.js';

export default function LoginPage() {
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  const [form, setForm] = useState({ identifier: '', email: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error, isLoading } = useSharedAuthStore();

  // Get redirect param from query string
  const params = new URLSearchParams(location.search);
  const redirectUrl = params.get('redirect') || '/';
  const app = params.get('app') || 'basegeek';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (tab === 0) {
        // Login
        console.log('Login attempt:', form.identifier, form.password, app);
        const result = await login(form.identifier, form.password, app);
        if (result && result.token) {
          // If redirectUrl is present and not just '/', redirect with token and state
          if (redirectUrl && redirectUrl !== '/') {
            const state = params.get('state');
            const url = new URL(decodeURIComponent(redirectUrl));
            url.searchParams.set('token', result.token);
            if (state) url.searchParams.set('state', state);
            window.location.href = url.toString();
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        // Register
        console.log('Register attempt:', form.identifier, form.email, form.password, app);
        const result = await register(form.identifier, form.email, form.password, app);
        if (result && result.token) {
          if (redirectUrl && redirectUrl !== '/') {
            const state = params.get('state');
            const url = new URL(decodeURIComponent(redirectUrl));
            url.searchParams.set('token', result.token);
            if (state) url.searchParams.set('state', state);
            window.location.href = url.toString();
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 400, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <AppsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            baseGeek
            <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', ml: 0.5, mt: 0.5 }}>{'</>'}</Typography>
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Welcome to the geekAPPs suite
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username or Email"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
          {tab === 1 && (
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
          )}
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, fontWeight: 'bold', fontSize: 16 }}
            disabled={isLoading}
          >
            {tab === 0 ? 'Login' : 'Register'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}