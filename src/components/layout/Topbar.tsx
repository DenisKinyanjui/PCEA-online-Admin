import { Menu, LogOut, User, ChevronDown /* , Building2, Check */ } from 'lucide-react';
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
  // MULTI-CHURCH: const { selectedChurch, setSelectedChurch, churches, isSuperAdmin } = useChurch();
  const { churchFilter } = useChurch();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // MULTI-CHURCH: church switcher dropdown state.
  // const [churchMenuOpen, setChurchMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // const churchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      // if (churchMenuRef.current && !churchMenuRef.current.contains(e.target as Node)) setChurchMenuOpen(false);
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
    <header className="h-16 bg-gray-950/80 backdrop-blur border-b border-gray-800 flex items-center justify-between
      px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">

      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-base font-semibold text-gray-100 hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* MULTI-CHURCH: church switcher — super_admin only.
        {isSuperAdmin && (
          <div className="relative" ref={churchMenuRef}>
            <button
              onClick={() => setChurchMenuOpen(!churchMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800
                hover:bg-gray-800/40 text-sm text-gray-300 transition-colors"
            >
              {/-* <Building2 className="h-4 w-4 text-gray-500" /> *-/}
              <span className="hidden md:block font-medium max-w-[160px] truncate">
                {selectedChurch?.name ?? 'All Churches'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${churchMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {churchMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-lg shadow-black/40 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-gray-800/40">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Church</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    onClick={() => { setSelectedChurch(null); setChurchMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/40 transition-colors"
                  >
                    <span className="font-medium">All Churches</span>
                    {!selectedChurch && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                  {churches.map((church) => (
                    <button
                      key={church._id}
                      onClick={() => { setSelectedChurch(church); setChurchMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/40 transition-colors"
                    >
                      <span className="truncate text-left">{church.name}</span>
                      {selectedChurch?._id === church._id && <Check className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        */}

        {/* Church badge — the single church this panel manages */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <span className="text-xs font-medium text-indigo-300 max-w-[140px] truncate sm:max-w-none sm:truncate-none">
            {churchFilter}
          </span>
        </div>
        {/* MULTI-CHURCH: badge was shown only for non-super_admin users, using their assigned church.
        {!isSuperAdmin && currentUser?.church && ( ... {currentUser.church.name} ... )}
        */}

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 text-sm text-gray-300 transition-colors"
          >
            <div className="w-7 h-7 bg-indigo-500/15 border border-indigo-500/25 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="hidden sm:block font-medium">{currentUser?.name ?? 'Admin'}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-lg shadow-black/40 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40">
                <p className="text-sm font-semibold text-gray-100">{currentUser?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{currentUser?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider
                  text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                  {roleLabel[currentUser?.role ?? ''] ?? currentUser?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
