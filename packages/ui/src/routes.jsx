import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Settings from './pages/Settings';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/databases" element={<Databases />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default AppRoutes;