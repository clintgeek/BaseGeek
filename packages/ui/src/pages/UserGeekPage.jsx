import { useEffect, useState } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';
import useSharedAuthStore from '../store/sharedAuthStore.js';

export default function UserGeekPage() {
  console.log('UserGeekPage component rendering');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { token } = useSharedAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleDelete = async (id) => {
    setDeleting(id);
    setError('');
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Error deleting user');
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenCreate = () => {
    setForm({ username: '', email: '', password: '' });
    setOpenCreate(true);
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError('');
      await api.post('/users', form, { headers: { Authorization: `Bearer ${token}` } });
      setOpenCreate(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Error creating user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users across the GeekSuite applications
          </Typography>
        </Box>
        <IconButton color="primary" onClick={handleOpenCreate} aria-label="add user">
          <AddIcon />
        </IconButton>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(user.id)}
                  disabled={deleting === user.id}
                >
                  {deleting === user.id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              }
            >
              <ListItemText
                primary={user.username}
                secondary={user.email}
              />
            </ListItem>
          ))}
          {users.length === 0 && !loading && (
            <ListItem>
              <ListItemText
                primary="No users found"
                secondary="There are no users in the system"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating || !form.username || !form.email || !form.password}>
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
