import { Box, Typography, Paper } from '@mui/material';

export default function BaseGeekHome() {
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
    </Box>
  );
}