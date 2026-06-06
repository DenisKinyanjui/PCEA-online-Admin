import { Menu, LogOut, User, ChevronDown, Building2, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';

interface TopbarProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function Topbar({ onMenuToggle, title }: TopbarProps) {
  const { currentUser, logout } = useAuth();
  const { selectedChurch, setSelectedChurch, churches, isSuperAdmin } = useChurch();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [churchMenuOpen, setChurchMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const churchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (churchMenuRef.current && !churchMenuRef.current.contains(e.target as Node)) setChurchMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    church_admin: 'Church Admin',
    transcriptionist: 'Transcriptionist',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between
      px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30 shadow-sm">

      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-base font-semibold text-gray-900 hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Church switcher — super_admin only */}
        {isSuperAdmin && (
          <div className="relative" ref={churchMenuRef}>
            <button
              onClick={() => setChurchMenuOpen(!churchMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200
                hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="hidden md:block font-medium max-w-[160px] truncate">
                {selectedChurch?.name ?? 'All Churches'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${churchMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {churchMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Church</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    onClick={() => { setSelectedChurch(null); setChurchMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">All Churches</span>
                    {!selectedChurch && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                  {churches.map((church) => (
                    <button
                      key={church._id}
                      onClick={() => { setSelectedChurch(church); setChurchMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate text-left">{church.name}</span>
                      {selectedChurch?._id === church._id && <Check className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Church badge — non-super_admin */}
        {!isSuperAdmin && currentUser?.church && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-700 max-w-[140px] truncate">
              {currentUser.church.name}
            </span>
          </div>
        )}

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
          >
            <div className="w-7 h-7 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <span className="hidden sm:block font-medium">{currentUser?.name ?? 'Admin'}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{currentUser?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider
                  text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {roleLabel[currentUser?.role ?? ''] ?? currentUser?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
