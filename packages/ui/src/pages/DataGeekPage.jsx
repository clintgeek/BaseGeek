import { Box, Paper, Tabs, Tab, Card, CardContent, Typography, CircularProgress, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import MongoStatus from '../components/MongoStatus';
import api from '../api';

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
        const response = await api.get('/redis/status');
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

function formatPostgresUptime(uptime) {
  if (!uptime) return '';
  if (typeof uptime === 'string') return uptime;
  if (typeof uptime === 'object') {
    // Try to join all values (e.g., { hours: 1, minutes: 2, seconds: 3 })
    return Object.entries(uptime)
      .map(([k, v]) => `${v} ${k}`)
      .join(' ');
  }
  return String(uptime);
}

function PostgresStatus() {
  const [status, setStatus] = useState({
    isLoading: true,
    isConnected: false,
    error: null,
    version: null,
    uptime: null,
    dbSize: null,
    connectionCount: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/postgres/status');
        setStatus({
          isLoading: false,
          isConnected: response.data.status === 'connected',
          error: null,
          version: response.data.version,
          uptime: response.data.uptime,
          dbSize: response.data.dbSize,
          connectionCount: response.data.connectionCount
        });
      } catch (error) {
        setStatus({
          isLoading: false,
          isConnected: false,
          error: error.response?.data?.message || error.message,
          version: null,
          uptime: null,
          dbSize: null,
          connectionCount: null
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
          Postgres Status
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
              <Typography variant="body2">Version: {status.version}</Typography>
              <Typography variant="body2">Uptime: {formatPostgresUptime(status.uptime)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">DB Size: {status.dbSize}</Typography>
              <Typography variant="body2">Connections: {status.connectionCount}</Typography>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataGeekPage() {
  console.log('DataGeekPage component rendering');
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
      {tab === 2 && <PostgresStatus />}
    </Box>
  );
}