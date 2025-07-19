import { Box, Typography, Paper, Card, CardContent, Grid, Chip, Avatar } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Note as NoteIcon,
  Book as BookIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';

export default function BaseGeekHome() {
  // Authorized apps with their details
  const authorizedApps = [
    {
      name: 'baseGeek',
      displayName: 'BaseGeek',
      description: 'Central authentication and user management hub',
      icon: DashboardIcon,
      color: '#1976d2',
      status: 'active'
    },
    {
      name: 'notegeek',
      displayName: 'NoteGeek',
      description: 'Markdown-based note-taking and organization',
      icon: NoteIcon,
      color: '#2e7d32',
      status: 'active'
    },
    {
      name: 'bujogeek',
      displayName: 'BuJoGeek',
      description: 'Bullet journal and task management system',
      icon: BookIcon,
      color: '#ed6c02',
      status: 'active'
    },
    {
      name: 'fitnessgeek',
      displayName: 'FitnessGeek',
      description: 'Nutrition tracking and fitness management',
      icon: FitnessIcon,
      color: '#9c27b0',
      status: 'active'
    }
  ];

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to baseGeek
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This will be your quick-look dashboard for all geekAPPs services.
        </Typography>
      </Paper>

      {/* Authorized Apps Tile */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          GeekSuite Applications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These are the authorized applications that use baseGeek for authentication and user management.
        </Typography>

        <Grid container spacing={2}>
          {authorizedApps.map((app) => (
            <Grid item xs={12} sm={6} md={3} key={app.name}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: app.color
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: app.color,
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <app.icon />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {app.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {app.description}
                  </Typography>
                  <Chip
                    label={app.status}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> All GeekSuite applications share the same user accounts and authentication system.
            You can use the same credentials to access any of these applications.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}