import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AdminLayout from './components/layout/AdminLayout';
import { ROUTE_PERMISSIONS } from './config/roles';

import AdminLogin from './pages/AdminLogin';
import Admin403 from './pages/Admin403';
import AdminDashboard from './pages/AdminDashboard';
import AdminSermons from './pages/AdminSermons';
import AdminSermonNew from './pages/AdminSermonNew';
import AdminSermonEdit from './pages/AdminSermonEdit';
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
                {/* Accessible to all authenticated roles */}
                <Route index element={<AdminDashboard />} />
                <Route path="403" element={<Admin403 />} />

                <Route path="sermons" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.sermons}>
                    <AdminSermons />
                  </RoleGuard>
                } />
                <Route path="sermons/new" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.sermons}>
                    <AdminSermonNew />
                  </RoleGuard>
                } />
                <Route path="sermons/:id/edit" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.sermons}>
                    <AdminSermonEdit />
                  </RoleGuard>
                } />
                <Route path="uploads" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.uploads}>
                    <AdminUploads />
                  </RoleGuard>
                } />
                <Route path="profile" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.profile}>
                    <AdminProfile />
                  </RoleGuard>
                } />

                {/* Super admin only */}
                <Route path="churches" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.churches}>
                    <AdminChurches />
                  </RoleGuard>
                } />
                <Route path="churches/new" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.churches}>
                    <AdminChurchForm />
                  </RoleGuard>
                } />
                <Route path="churches/:id/edit" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.churches}>
                    <AdminChurchForm />
                  </RoleGuard>
                } />
                <Route path="users" element={
                  <RoleGuard allowedRoles={ROUTE_PERMISSIONS.users}>
                    <AdminUsers />
                  </RoleGuard>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
