import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  Menu as MenuIcon,
  Apps as AppsIcon,
  Home as HomeIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import useSharedAuthStore from '../store/sharedAuthStore';

const drawerWidth = 240;
const headerBlue = '#6098cc'; // rgb(96, 152, 204)

const navItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Data Geek', icon: <StorageIcon />, path: '/datageek' },
  { label: 'User Geek', icon: <PeopleIcon />, path: '/usergeek' },
  { label: 'AI Geek', icon: <SmartToyIcon />, path: '/aigeek' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout } = useSharedAuthStore();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    console.log('Navigation clicked:', path);
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <AppsIcon sx={{ color: headerBlue, fontSize: 26 }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: headerBlue }}>
            BaseGeek <Box component="span" sx={{ color: headerBlue, fontWeight: 400, fontSize: '0.95em', ml: 0.5 }}>{'</>'}</Box>
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  // Find the current nav index for highlighting
  const currentNavIndex = navItems.findIndex(item => location.pathname === item.path);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          backgroundColor: headerBlue,
          color: '#fff',
          height: '60px',
        }}
        elevation={0}
      >
        <Toolbar sx={{ minHeight: '60px !important', height: '60px !important', px: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" alignItems="center" gap={1}>
            <AppsIcon sx={{ color: '#fff', fontSize: 26 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
              BaseGeek <Box component="span" sx={{ color: '#fff', fontWeight: 400, fontSize: '0.95em', ml: 0.5 }}>{'</>'}</Box>
            </Typography>
          </Box>
          <Box flex={1} />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: '60px',
          mb: { xs: '56px', sm: '64px' }, // space for bottom nav
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
      <Box sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        boxShadow: '0 -2px 8px 0 rgba(0,0,0,0.06)',
      }}>
        <BottomNavigation
          showLabels
          value={currentNavIndex === -1 ? 0 : currentNavIndex}
          onChange={(_e, newValue) => handleNavigation(navItems[newValue].path)}
          sx={{
            backgroundColor: '#fff',
            height: { xs: 56, sm: 64 },
            borderTop: '1px solid #e0e0e0',
          }}
        >
          {navItems.map((item, idx) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
              sx={{
                color: currentNavIndex === idx ? headerBlue : '#444',
                '&.Mui-selected': {
                  color: headerBlue,
                  fontWeight: 700,
                },
                fontSize: { xs: 12, sm: 14 },
              }}
            />
          ))}
        </BottomNavigation>
      </Box>
    </Box>
  );
}