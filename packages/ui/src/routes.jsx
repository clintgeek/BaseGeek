import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/databases"
        element={
          <RequireAuth>
            <Databases />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default AppRoutes;