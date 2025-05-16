import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSharedAuthStore from '../store/sharedAuthStore';
import { Box, CircularProgress } from '@mui/material';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialize } = useSharedAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from the URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const app = params.get('app') || 'basegeek';

        if (!token) {
          console.error('No token found in callback URL');
          navigate('/login');
          return;
        }

        // Initialize auth with the token
        const success = await initialize(app);
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
  }, [navigate, location, initialize]);

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