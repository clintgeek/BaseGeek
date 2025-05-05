import { Box, Paper, Tabs, Tab, Card, CardContent, Typography, CircularProgress, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import MongoStatus from '../components/MongoStatus';
import axios from 'axios';

function RedisStatus() {
  const [status, setStatus] = useState({
    isLoading: true,
    isConnected: false,
    error: null,
    redisVersion: null,
    uptime: null,
    connectedClients: null,
    usedMemory: null,
    totalKeys: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('/api/redis/status');
        setStatus({
          isLoading: false,
          isConnected: response.data.status === 'connected',
          error: null,
          redisVersion: response.data.redisVersion,
          uptime: response.data.uptime,
          connectedClients: response.data.connectedClients,
          usedMemory: response.data.usedMemory,
          totalKeys: response.data.totalKeys
        });
      } catch (error) {
        setStatus({
          isLoading: false,
          isConnected: false,
          error: error.response?.data?.message || error.message,
          redisVersion: null,
          uptime: null,
          connectedClients: null,
          usedMemory: null,
          totalKeys: null
        });
      }
    };
    fetchStatus();
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
          Redis Status
        </Typography>
        <Typography color={status.isConnected ? "success.main" : "error.main"} variant="subtitle1">
          {status.isConnected ? "Connected" : "Disconnected"}
        </Typography>
        {status.error && (
          <Typography color="error" variant="body2">
            Error: {status.error}
          </Typography>
        )}
        {status.isConnected && (
          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Version: {status.redisVersion}</Typography>
              <Typography variant="body2">Uptime (s): {status.uptime}</Typography>
              <Typography variant="body2">Clients: {status.connectedClients}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Used Memory: {status.usedMemory}</Typography>
              <Typography variant="body2">Total Keys: {status.totalKeys}</Typography>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

function PostgresStatusPlaceholder() {
  return (
    <Paper sx={{ p: 3 }}>
      Postgres Monitoring (coming soon...)
    </Paper>
  );
}

export default function DataGeekPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" centered>
          <Tab label="Mongo" />
          <Tab label="Redis" />
          <Tab label="Postgres" />
        </Tabs>
      </Paper>
      {tab === 0 && <MongoStatus />}
      {tab === 1 && <RedisStatus />}
      {tab === 2 && <PostgresStatusPlaceholder />}
    </Box>
  );
}