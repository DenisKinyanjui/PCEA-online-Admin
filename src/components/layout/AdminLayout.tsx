import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ChurchProvider } from '../../context/ChurchContext';

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/sermons': 'Sermons',
  '/admin/sermons/new': 'New Sermon',
  // MULTI-CHURCH:
  // '/admin/churches': 'Churches',
  // '/admin/churches/new': 'New Church',
  '/admin/church': 'Church Profile',
  '/admin/announcements': 'Announcements',
  '/admin/announcements/new': 'New Announcement',
  '/admin/youth-messages': 'Message to the Youth',
  '/admin/youth-messages/new': 'New Message to the Youth',
  '/admin/users': 'Users',
  '/admin/uploads': 'Uploads',
  '/admin/profile': 'Profile',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title = pathname.includes('/edit')
    ? pathname.includes('/churches/') ? 'Edit Church'
      : pathname.includes('/announcements/') ? 'Edit Announcement'
      : pathname.includes('/youth-messages/') ? 'Edit Message to the Youth' : 'Edit Sermon'
    : (titles[pathname] ?? 'Admin');

  return (
    <ChurchProvider>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
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
