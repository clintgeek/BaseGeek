import { Grid, Paper, Typography } from '@mui/material';
import {
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

function StatCard({ title, value, icon }) {
  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            {title}
          </Typography>
          <Typography component="p" variant="h4">
            {value}
          </Typography>
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {icon}
        </Grid>
      </Grid>
    </Paper>
  );
}

function Dashboard() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Databases"
            value="2"
            icon={<StorageIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Active Connections"
            value="5"
            icon={<SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Security Status"
            value="Protected"
            icon={<SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default Dashboard;