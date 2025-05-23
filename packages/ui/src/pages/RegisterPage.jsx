import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import useSharedAuthStore from '../store/sharedAuthStore.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { register, error, isLoading } = useSharedAuthStore();

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
      const result = await register(form.username, form.email, form.password, app);
      if (result.success) {
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error('Registration error:', err);
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
            Create your account
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
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
            Register
          </Button>
          <Button
            variant="text"
            color="primary"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => navigate('/login')}
          >
            Already have an account? Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}