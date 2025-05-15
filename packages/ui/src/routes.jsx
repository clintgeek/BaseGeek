import { Routes, Route } from 'react-router-dom';
import BaseGeekHome from './pages/BaseGeekHome';
import DataGeekPage from './pages/DataGeekPage';
import UserGeekPage from './pages/UserGeekPage';
import Settings from './pages/Settings';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BaseGeekHome />} />
      <Route path="/datageek" element={<DataGeekPage />} />
      <Route path="/usergeek" element={<UserGeekPage />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default AppRoutes;