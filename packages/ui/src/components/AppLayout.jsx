import { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerMenuItems = [
  { label: 'baseGeek', icon: DashboardOutlinedIcon, path: '/' },
  { label: 'dataGeek', icon: StorageOutlinedIcon, path: '/datageek' },
  { label: 'userGeek', icon: PeopleOutlinedIcon, path: '/usergeek' },
];

const bottomNavItems = [
  { label: 'baseGeek', icon: DashboardOutlinedIcon, path: '/' },
  { label: 'dataGeek', icon: StorageOutlinedIcon, path: '/datageek' },
  { label: 'userGeek', icon: PeopleOutlinedIcon, path: '/usergeek' },
  { label: 'Settings', icon: SettingsOutlinedIcon, path: '/settings' },
];

export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Set bottom nav index based on current path
  const currentNavIndex = bottomNavItems.findIndex(item => item.path === location.pathname);
  const [bottomNav, setBottomNav] = useState(currentNavIndex === -1 ? 0 : currentNavIndex);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Keep bottom nav in sync with route
  if (bottomNav !== currentNavIndex && currentNavIndex !== -1) {
    setTimeout(() => setBottomNav(currentNavIndex), 0);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* Header */}
      <AppBar position="fixed" sx={{ bgcolor: '#6098CC', zIndex: (theme) => theme.zIndex.drawer + 1, height: 60 }}>
        <Toolbar sx={{ height: 60, minHeight: 60 }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AppsOutlinedIcon sx={{ fontSize: 24, mr: 0.5, color: 'inherit' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center' }}>
              baseGeek
              <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', ml: 0.5, mt: 0.5 }}>{'</>'}</Typography>
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{ '& .MuiDrawer-paper': { width: 250, boxSizing: 'border-box', marginTop: '64px' } }}
      >
        <Box sx={{ width: 250 }}>
          <List>
            {drawerMenuItems.map((item) => (
              <ListItem
                button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
            <ListItem button onClick={() => { navigate('/settings'); setDrawerOpen(false); }}>
              <ListItemIcon>
                <SettingsOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, pt: 8, pb: 8 }}>
        {children}
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1201 }} elevation={3}>
        <BottomNavigation
          value={bottomNav}
          onChange={(_, newValue) => {
            setBottomNav(newValue);
            navigate(bottomNavItems[newValue].path);
          }}
          showLabels
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction key={item.label} label={item.label} icon={<item.icon />} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}