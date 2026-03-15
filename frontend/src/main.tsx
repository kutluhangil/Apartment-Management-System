import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/ui/AuthGuard';

// Public pages
import LandingPage from './pages/LandingPage';
import FinancePage from './pages/FinancePage';
import MeetingNotesPage from './pages/MeetingNotesPage';
import LoginPage from './pages/LoginPage';

// Dashboard pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import AidatPage from './pages/dashboard/AidatPage';
import ExpensePage from './pages/dashboard/ExpensePage';
import MeetingManagePage from './pages/dashboard/MeetingManagePage';
import ApartmentsPage from './pages/dashboard/ApartmentsPage';

// New Modules
import AnnouncementsPage from './pages/dashboard/AnnouncementsPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import MaintenancePage from './pages/dashboard/MaintenancePage';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#333333', secondary: '#fff' } }
        }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/finansal" element={<FinancePage />} />
          <Route path="/toplanti-notlari" element={<MeetingNotesPage />} />
          <Route path="/giris" element={<LoginPage />} />

          {/* Protected Dashboard */}
          <Route path="/dashboard" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
            <Route index element={<DashboardOverview />} />
            <Route path="aidat" element={<AidatPage />} />
            <Route path="gelir-gider" element={<ExpensePage />} />
            <Route path="toplanti" element={<MeetingManagePage />} />
            <Route path="daireler" element={<ApartmentsPage />} />
            <Route path="duyurular" element={<AnnouncementsPage />} />
            <Route path="belgeler" element={<DocumentsPage />} />
            <Route path="bakim" element={<MaintenancePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
