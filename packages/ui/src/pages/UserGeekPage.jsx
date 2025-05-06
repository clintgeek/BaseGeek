import { useEffect, useState } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import useAuthStore from '../store/authStore.js';

export default function UserGeekPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { token } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/users', {
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
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Error deleting user');
    } finally {
      setDeleting(null);
    }
  };

  if (!token) {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity="error">Please log in to access user management.</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>User Management (userGeek)</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          View and manage registered users. (Delete user is available for now.)
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {users.map((user) => (
              <ListItem key={user._id} secondaryAction={
                <IconButton edge="end" color="error" onClick={() => handleDelete(user._id)} disabled={deleting === user._id}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}