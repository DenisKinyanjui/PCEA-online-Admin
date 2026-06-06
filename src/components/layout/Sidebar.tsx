import { NavLink, useResolvedPath, useMatch } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BookMarked, Upload, User, ChevronRight, X, Building2, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  roles?: string[];
}

const nav: NavItemDef[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sermons', label: 'Sermons', icon: BookOpen, end: false },
  { to: '/admin/series', label: 'Series', icon: BookMarked, end: false },
  { to: '/admin/churches', label: 'Churches', icon: Building2, end: false, roles: ['super_admin', 'church_admin'] },
  { to: '/admin/users', label: 'Users', icon: Users, end: false, roles: ['super_admin', 'church_admin'] },
  { to: '/admin/uploads', label: 'Uploads', icon: Upload, end: false },
  { to: '/admin/profile', label: 'Profile', icon: User, end: false },
];

function NavItem({ to, label, icon: Icon, end, onClose }: NavItemDef & { onClose: () => void }) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end });
  const isActive = Boolean(match);

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? '';

  const visibleNav = nav.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200
        z-50 flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">PCEA Admin</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ministry Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {visibleNav.map((item) => (
              <li key={item.to}>
                <NavItem {...item} onClose={onClose} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-400">PCEA Online Ministry v1.0</p>
        </div>
      </aside>
    </>
  );
}
