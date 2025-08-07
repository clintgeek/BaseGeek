import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AIGeekPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Configuration state
  const [config, setConfig] = useState({
    anthropic: { apiKey: '', enabled: true },
    groq: { apiKey: '', enabled: false },
    gemini: { apiKey: '', enabled: false }
  });

  // Usage statistics
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    providerUsage: {},
    appUsage: {}
  });

  // Show/hide API keys
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    loadConfiguration();
    loadStatistics();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/config', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      setError('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/ai/stats', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setSuccess('AI configuration saved successfully');
        await loadStatistics(); // Refresh stats after config change
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to save configuration');
      }
    } catch (error) {
      setError('Failed to save AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ provider })
      });

      if (response.ok) {
        setSuccess(`${provider} API key is valid`);
      } else {
        setError(`${provider} API key is invalid`);
      }
    } catch (error) {
      setError(`Failed to test ${provider} API key`);
    } finally {
      setLoading(false);
    }
  };

  const resetStatistics = async () => {
    try {
      const response = await fetch('/api/ai/reset-stats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        setSuccess('Statistics reset successfully');
        await loadStatistics();
      }
    } catch (error) {
      setError('Failed to reset statistics');
    }
  };

  const handleConfigChange = (provider, field, value) => {
    setConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const formatCost = (cost) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const getProviderStatus = (provider) => {
    const providerConfig = config[provider];
    if (!providerConfig.enabled) return 'disabled';
    if (!providerConfig.apiKey) return 'no-key';
    return 'ready';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircleIcon color="success" />;
      case 'no-key': return <WarningIcon color="warning" />;
      case 'disabled': return <ErrorIcon color="disabled" />;
      default: return <ErrorIcon color="error" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'no-key': return 'No API Key';
      case 'disabled': return 'Disabled';
      default: return 'Error';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        AI Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<SettingsIcon />} label="Configuration" />
        <Tab icon={<AnalyticsIcon />} label="Usage & Cost" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">AI Provider Configuration</Typography>
              <Box>
                <Tooltip title={showKeys ? 'Hide API Keys' : 'Show API Keys'}>
                  <IconButton onClick={() => setShowKeys(!showKeys)}>
                    {showKeys ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveConfiguration}
                  disabled={loading}
                  sx={{ ml: 2 }}
                >
                  Save Configuration
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {Object.entries(config).map(([provider, providerConfig]) => {
                const status = getProviderStatus(provider);
                return (
                  <Grid item xs={12} md={6} key={provider}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {provider}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(status)}
                            <Chip
                              label={getStatusText(status)}
                              size="small"
                              color={status === 'ready' ? 'success' : status === 'no-key' ? 'warning' : 'default'}
                            />
                          </Box>
                        </Box>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={providerConfig.enabled}
                              onChange={(e) => handleConfigChange(provider, 'enabled', e.target.checked)}
                            />
                          }
                          label="Enable Provider"
                          sx={{ mb: 2 }}
                        />

                        <TextField
                          fullWidth
                          label="API Key"
                          type={showKeys ? 'text' : 'password'}
                          value={providerConfig.apiKey}
                          onChange={(e) => handleConfigChange(provider, 'apiKey', e.target.value)}
                          disabled={!providerConfig.enabled}
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => testProvider(provider)}
                            disabled={!providerConfig.enabled || !providerConfig.apiKey}
                          >
                            Test API Key
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Overall Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Overall Statistics</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadStatistics}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stats.totalCalls}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Calls
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {formatTokens(stats.totalTokens)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tokens
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {formatCost(stats.totalCost)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Cost
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stats.totalCalls > 0 ? formatCost(stats.totalCost / stats.totalCalls) : '$0.0000'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Cost/Call
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Provider Usage */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Provider Usage
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Provider</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Tokens</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(stats.providerUsage).map(([provider, usage]) => (
                        <TableRow key={provider}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{provider}</TableCell>
                          <TableCell align="right">{usage.calls}</TableCell>
                          <TableCell align="right">{formatTokens(usage.tokens)}</TableCell>
                          <TableCell align="right">{formatCost(usage.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* App Usage */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  App Usage
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>App</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(stats.appUsage || {}).map(([app, usage]) => (
                        <TableRow key={app}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{app}</TableCell>
                          <TableCell align="right">{usage.calls}</TableCell>
                          <TableCell align="right">{formatCost(usage.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Reset Statistics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clear all usage statistics and cost tracking
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={resetStatistics}
                    disabled={loading}
                  >
                    Reset Statistics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AIGeekPage;
