import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSermons from './pages/AdminSermons';
import AdminSermonNew from './pages/AdminSermonNew';
import AdminSermonEdit from './pages/AdminSermonEdit';
import AdminSeries from './pages/AdminSeries';
import AdminChurches from './pages/AdminChurches';
import AdminChurchForm from './pages/AdminChurchForm';
import AdminUsers from './pages/AdminUsers';
import AdminUploads from './pages/AdminUploads';
import AdminProfile from './pages/AdminProfile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="sermons" element={<AdminSermons />} />
                <Route path="sermons/new" element={<AdminSermonNew />} />
                <Route path="sermons/:id/edit" element={<AdminSermonEdit />} />
                <Route path="series" element={<AdminSeries />} />
                <Route path="churches" element={<AdminChurches />} />
                <Route path="churches/new" element={<AdminChurchForm />} />
                <Route path="churches/:id/edit" element={<AdminChurchForm />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="uploads" element={<AdminUploads />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
