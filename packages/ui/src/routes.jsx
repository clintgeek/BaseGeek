import { Routes, Route } from 'react-router-dom';
import BaseGeekHome from './pages/BaseGeekHome';
import DataGeekPage from './pages/DataGeekPage';
import UserGeekPage from './pages/UserGeekPage';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><BaseGeekHome /></RequireAuth>} />
      <Route path="/datageek" element={<RequireAuth><DataGeekPage /></RequireAuth>} />
      <Route path="/usergeek" element={<RequireAuth><UserGeekPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
    </Routes>
  );
}

export default AppRoutes;