import {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import {motion} from 'motion/react';
import {Loader2} from 'lucide-react';
import Registration from './pages/Registration';
import Login from './pages/Login';
import Landing from './pages/Landing';
import POS from './pages/POS';
import SuperAdmin from './pages/SuperAdmin';
import AdminLogin from './pages/AdminLogin';
import PosLayout from './pages/pos/PosLayout';
import PosMenu from './pages/pos/PosMenu';
import PosSales from './pages/pos/PosSales';
import PosAccountSettings from './pages/pos/PosAccountSettings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/owner-login" element={<AdminLogin />} />
        <Route path="/owner-panel" element={<SuperAdmin />} />
        <Route path="/kasir" element={<PosLayout />}>
          <Route index element={<POS />} />
          <Route path="menu" element={<PosMenu />} />
          <Route path="penjualan" element={<PosSales />} />
          <Route path="settings" element={<PosAccountSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}
