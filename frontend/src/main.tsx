import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/ui/AuthGuard';

// Public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Admin / Manager only
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import AidatPage from './pages/dashboard/AidatPage';
import ExpensePage from './pages/dashboard/ExpensePage';
import MeetingManagePage from './pages/dashboard/MeetingManagePage';
import ApartmentsPage from './pages/dashboard/ApartmentsPage';
import AnnouncementsPage from './pages/dashboard/AnnouncementsPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import MaintenancePage from './pages/dashboard/MaintenancePage';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '12px' },
            success: { iconTheme: { primary: '#111111', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public — single all-in-one landing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/giris" element={<LoginPage />} />

          {/* Old routes redirect to landing (backwards compat) */}
          <Route path="/finansal" element={<Navigate to="/#finansal" replace />} />
          <Route path="/toplanti-notlari" element={<Navigate to="/#toplantilar" replace />} />

          {/* Protected — admin/manager only */}
          <Route path="/dashboard" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
            <Route index element={<DashboardOverview />} />
            <Route path="aidat" element={<AidatPage />} />
            <Route path="gelir-gider" element={<ExpensePage />} />
            <Route path="toplanti" element={<MeetingManagePage />} />
            <Route path="bakim" element={<MaintenancePage />} />
            <Route path="daireler" element={<ApartmentsPage />} />
            <Route path="duyurular" element={<AnnouncementsPage />} />
            <Route path="belgeler" element={<DocumentsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
