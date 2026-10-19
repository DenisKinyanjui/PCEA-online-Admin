import { Link } from 'react-router-dom';
import { BookOpen, Plus, ArrowRight, Calendar, Building2, Users, Newspaper, FolderUp } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import DataTable, { type Column } from '../components/ui/DataTable';
import { useSermons } from '../hooks/useSermons';
// MULTI-CHURCH: import { useChurches } from '../hooks/useChurches';
import { useChurch } from '../context/ChurchContext';
import { ROUTE_PERMISSIONS } from '../config/roles';
import { useAuth } from '../context/AuthContext';
import type { ApiSermonSummary } from '../types';

export default function AdminDashboard() {
  const { churchFilter } = useChurch();
  const { currentUser } = useAuth();
  const canEditChurch = ROUTE_PERMISSIONS.churchProfile.includes(currentUser?.role ?? 'transcriptionist');
  const canManageAnnouncements = ROUTE_PERMISSIONS.announcements.includes(currentUser?.role ?? 'transcriptionist');

  const { data: sermonData, isLoading: sermonsLoading } = useSermons({
    church: churchFilter,
    page: 1,
    limit: 5,
  });
  // MULTI-CHURCH:
  // const { data: churchesData, isLoading: churchesLoading } = useChurches();

  const latestSermons = sermonData?.data ?? [];
  const totalSermons = sermonData?.total ?? 0;
  const totalPreachers = sermonData?.totalPreachers ?? 0;
  // const totalChurches = churchesData?.total ?? 0;

  const today = new Date();
  const thisYear = today.getFullYear().toString();
  const todayDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });

  const columns: Column<ApiSermonSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (s) => (
        <Link to={`/admin/sermons/${s._id}/edit`} className="font-medium text-gray-100 hover:text-indigo-400 transition-colors line-clamp-1">
          {s.title}
        </Link>
      ),
    },
    { key: 'preacher', header: 'Preacher', render: (s) => <span className="text-gray-400">{s.preacher}</span> },
    // MULTI-CHURCH: church column (every sermon belongs to the same church now).
    // {
    //   key: 'church',
    //   header: 'Church',
    //   render: (s) => (
    //     <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
    //       {s.church}
    //     </span>
    //   ),
    // },
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back!</p>
          <h1 className="text-xl font-bold text-gray-100">{churchFilter}</h1>
          {/* MULTI-CHURCH: {churchFilter ? `Viewing: ${churchFilter}` : 'All Churches'} */}
        </div>

        {/* Current date and day */}
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-100">{todayDate}</p>
          <p className="text-xs text-gray-400 mt-0.5">{todayDay}</p>
        </div>
      </div>

      {/* Stats */}
      {/* MULTI-CHURCH: super admins saw a third "Churches" stat (grid-cols-2 lg:grid-cols-3). */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard label="Total Sermons" value={totalSermons} icon={BookOpen} color="indigo" isLoading={sermonsLoading} />
        <StatsCard label="Total Preachers" value={totalPreachers} icon={Users} color="sky" isLoading={sermonsLoading} />
        {/* MULTI-CHURCH:
        {isSuperAdmin && (
          <StatsCard label="Churches" value={totalChurches} icon={Building2} color="sky" isLoading={churchesLoading} />
        )}
        */}
        <StatsCard
          label="Added This Year"
          value={latestSermons.filter((s) => new Date(s.date).getFullYear().toString() === thisYear).length}
          icon={Calendar}
          color="amber"
          isLoading={sermonsLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/admin/sermons/new" className="bg-gray-800/10 backdrop-blur border border-gray-800 p-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-100">New Sermon</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </Link>

        {canManageAnnouncements && (
          <Link to="/admin/announcements" className="bg-gray-800/10 backdrop-blur border border-gray-800 p-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-100">Announcements</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </Link>
        )}

        <Link to="/admin/uploads" className="bg-gray-800/10 backdrop-blur border border-gray-800 p-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group">
          <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center">
            <FolderUp className="h-5 w-5 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-100">Uploads</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </Link>

        {/* MULTI-CHURCH: super admins had "Manage Churches" → /admin/churches ("Register or update church info"). */}
        {canEditChurch && (
          <Link to="/admin/church" className="bg-gray-800/10 backdrop-blur border border-gray-800 p-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-100">Church Profile</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </Link>
        )}
      </div>

      {/* Recent sermons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-100">Recent Sermons</h2>
          <Link to="/admin/sermons" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <DataTable columns={columns} data={latestSermons} keyExtractor={(s) => s._id} isLoading={sermonsLoading} />
      </div>
    </div>
  );
}