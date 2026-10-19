import { NavLink } from 'react-router-dom';
import {
  Gauge, BookOpenText, Sprout, Newspaper, FolderUp, Church, UsersRound, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { ROUTE_PERMISSIONS } from '../../config/roles';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: string[];
}

interface NavGroup {
  label?: string;
  items: NavItemDef[];
}

const groups: NavGroup[] = [
  {
    items: [
      { to: '/admin', label: 'Dashboard', icon: Gauge, end: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/sermons', label: 'Sermons', icon: BookOpenText },
      { to: '/admin/uploads', label: 'Upload Sermon', icon: FolderUp },
      { to: '/admin/youth-messages', label: 'Message to the Youth', icon: Sprout, roles: ROUTE_PERMISSIONS.youthMessages },
      { to: '/admin/announcements', label: 'Announcements', icon: Newspaper, roles: ROUTE_PERMISSIONS.announcements },
    ],
  },
  {
    label: 'Church',
    items: [
      // MULTI-CHURCH: { to: '/admin/churches', label: 'Churches', icon: Church, roles: ROUTE_PERMISSIONS.churches },
      { to: '/admin/church', label: 'Church Profile', icon: Church, roles: ROUTE_PERMISSIONS.churchProfile },
      { to: '/admin/users', label: 'Users', icon: UsersRound, roles: ROUTE_PERMISSIONS.users },
    ],
  },
];

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  church_admin: 'Church Admin',
  transcriptionist: 'Transcriptionist',
};

function initials(name?: string) {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function NavItem({ to, label, icon: Icon, end, onClose }: NavItemDef & { onClose: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          isActive
            ? 'bg-blue-700/50 text-white font-medium'
            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/40'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute -left-3 top-2.5 bottom-2.5 w-[3px] rounded-r bg-blue-500 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Icon
            size={19}
            strokeWidth={isActive ? 2 : 1.75}
            className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { currentUser } = useAuth();
  // const { churchFilter } = useChurch();
  const role = currentUser?.role ?? '';

  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.roles || item.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-950/80 border-r border-gray-800
        z-50 flex flex-col transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
          <img src="/images/PCEALogo.webp" alt="PCEA" className="w-8 h-8 flex-shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-100 leading-tight">PCEA</p>
            <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">Emmanuel Thome Church</p>
            {/* <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">{churchFilter}</p> */}
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden -mr-1 p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
          {visibleGroups.map((group, i) => (
            <div key={group.label ?? i} className={i > 0 ? 'mt-6' : ''}>
              {group.label && (
                <p className="px-3 mb-2 text-[11px] font-medium text-gray-500">{group.label}</p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavItem {...item} onClose={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="p-3 border-t border-gray-800">
          <NavLink
            to="/admin/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 p-2 rounded-md transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                isActive ? 'bg-gray-800' : 'hover:bg-gray-800/40'
              }`
            }
          >
            <span className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold
              flex items-center justify-center flex-shrink-0">
              {initials(currentUser?.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-gray-100 truncate leading-tight">
                {currentUser?.name ?? 'Admin'}
              </span>
              <span className="block text-xs text-gray-500 truncate leading-tight mt-0.5">
                {roleLabel[role] ?? role}
              </span>
            </span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}