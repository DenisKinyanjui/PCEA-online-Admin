import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };
  const roleLabelMap: Record<string, string> = {
    super_admin: 'Super Admin',
    church_admin: 'Church Admin',
    transcriptionist: 'Transcriptionist',
  };
  const roleLabel = roleLabelMap[currentUser?.role ?? ''] ?? currentUser?.role ?? 'User';

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Profile" description="Your account details" />

      {/* Avatar + name */}
      <div className="admin-card p-6 flex items-center gap-5">
        <div className="w-14 h-14 bg-indigo-500/15 border-2 border-indigo-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-100">{currentUser?.name}</h2>
          <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider
            text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="admin-card divide-y divide-gray-800">
        <div className="flex items-center gap-4 px-5 py-4">
          <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Email address</p>
            <p className="text-sm font-medium text-gray-100">{currentUser?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Role</p>
            <p className="text-sm font-medium text-gray-100">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Church context */}
      <div className="admin-card p-5 bg-gray-800/40">
        <p className="text-xs text-gray-500 mb-1">Current Church (MVP)</p>
        <p className="text-sm font-semibold text-gray-100">P.C.E.A Emmanuel Thome Church</p>
        <p className="text-xs text-gray-500 mt-2">Multi-church support can be enabled in a future update.</p>
      </div>

      {/* Sign out */}
      <button onClick={handleLogout} className="btn-danger w-full justify-center py-3 text-sm">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
