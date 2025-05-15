import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hydrateUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from the URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          console.error('No token found in callback URL');
          navigate('/login');
          return;
        }

        // Store the token
        localStorage.setItem('geek_token', token);

        // Hydrate the user state
        const success = await hydrateUser();
        if (success) {
          // Redirect to the app or home page
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, location, hydrateUser]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <CircularProgress />
    </Box>
  );
}