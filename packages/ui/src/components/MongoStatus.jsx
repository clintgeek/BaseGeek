import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

export default function MongoStatus() {
  const [status, setStatus] = useState({
    isLoading: true,
    isConnected: false,
    error: null,
    serverInfo: null,
    dbStats: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('/api/mongo/status');
        setStatus({
          isLoading: false,
          isConnected: true,
          error: null,
          serverInfo: response.data.serverInfo,
          dbStats: response.data.dbStats
        });
      } catch (error) {
        setStatus({
          isLoading: false,
          isConnected: false,
          error: error.response?.data?.message || error.message,
          serverInfo: null,
          dbStats: null
        });
      }
    };

    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          MongoDB Status
        </Typography>

        <Box mb={2}>
          <Typography color={status.isConnected ? "success.main" : "error.main"} variant="subtitle1">
            {status.isConnected ? "Connected" : "Disconnected"}
          </Typography>
          {status.error && (
            <Typography color="error" variant="body2">
              Error: {status.error}
            </Typography>
          )}
        </Box>

        {status.serverInfo && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Server Information</Typography>
            <Typography variant="body2">Version: {status.serverInfo.version}</Typography>
            <Typography variant="body2">Uptime: {Math.floor(status.serverInfo.uptime / 3600)} hours</Typography>
            <Typography variant="body2">Host: {status.serverInfo.host}</Typography>
          </Box>
        )}

        {status.dbStats && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Database Statistics</Typography>
            <Typography variant="body2">Collections: {status.dbStats.collections}</Typography>
            <Typography variant="body2">Documents: {status.dbStats.objects}</Typography>
            <Typography variant="body2">Storage Size: {(status.dbStats.storageSize / 1024 / 1024).toFixed(2)} MB</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}