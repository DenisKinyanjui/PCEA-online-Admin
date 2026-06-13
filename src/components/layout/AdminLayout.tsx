import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ChurchProvider } from '../../context/ChurchContext';

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/sermons': 'Sermons',
  '/admin/sermons/new': 'New Sermon',
  '/admin/churches': 'Churches',
  '/admin/churches/new': 'New Church',
  '/admin/users': 'Users',
  '/admin/uploads': 'Uploads',
  '/admin/profile': 'Profile',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title = pathname.includes('/edit')
    ? pathname.includes('/churches/') ? 'Edit Church' : 'Edit Sermon'
    : (titles[pathname] ?? 'Admin');

  return (
    <ChurchProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} title={title} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ChurchProvider>
  );
}
