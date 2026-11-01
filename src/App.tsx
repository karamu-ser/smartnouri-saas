import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { LanguageProvider } from './i18n/LanguageContext';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import MenuViewer from './pages/MenuViewer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ClientDashboard from './pages/ClientDashboard';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/menu/:slug" element={<MenuViewer />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </MotionConfig>
  );
}
