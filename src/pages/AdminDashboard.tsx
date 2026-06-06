import { Link } from 'react-router-dom';
import { BookOpen, BookMarked, Plus, ArrowRight, Calendar, Building2 } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import DataTable, { type Column } from '../components/ui/DataTable';
import { useSermons } from '../hooks/useSermons';
import { useSeries } from '../hooks/useSeries';
import { useChurches } from '../hooks/useChurches';
import { useChurch } from '../context/ChurchContext';
import type { ApiSermonSummary } from '../types';

export default function AdminDashboard() {
  const { churchFilter, isSuperAdmin } = useChurch();

  const { data: sermonData, isLoading: sermonsLoading } = useSermons({
    church: churchFilter,
    page: 1,
    limit: 5,
  });
  const { data: seriesData, isLoading: seriesLoading } = useSeries(churchFilter);
  const { data: churchesData, isLoading: churchesLoading } = useChurches();

  const latestSermons = sermonData?.data ?? [];
  const totalSermons = sermonData?.total ?? 0;
  const totalSeries = seriesData?.total ?? 0;
  const totalChurches = churchesData?.total ?? 0;

  const thisYear = new Date().getFullYear().toString();

  const columns: Column<ApiSermonSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (s) => (
        <Link to={`/admin/sermons/${s._id}/edit`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
          {s.title}
        </Link>
      ),
    },
    { key: 'preacher', header: 'Preacher', render: (s) => <span className="text-gray-500">{s.preacher}</span> },
    {
      key: 'church',
      header: 'Church',
      render: (s) => (
        <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
          {s.church}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span className="text-gray-400 text-xs whitespace-nowrap">
          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {churchFilter ? `Viewing: ${churchFilter}` : 'All Churches'}
          </p>
        </div>
        <Link to="/admin/sermons/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Sermon
        </Link>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
        <StatsCard label="Total Sermons" value={totalSermons} icon={BookOpen} color="indigo" isLoading={sermonsLoading} />
        <StatsCard label="Series" value={totalSeries} icon={BookMarked} color="emerald" isLoading={seriesLoading} />
        {isSuperAdmin && (
          <StatsCard label="Churches" value={totalChurches} icon={Building2} color="sky" isLoading={churchesLoading} />
        )}
        <StatsCard
          label="Added This Year"
          value={latestSermons.filter((s) => new Date(s.date).getFullYear().toString() === thisYear).length}
          icon={Calendar}
          color="amber"
          isLoading={sermonsLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/admin/sermons/new" className="admin-card p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">New Sermon</p>
            <p className="text-xs text-gray-500">Add a sermon with transcript</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </Link>

        {isSuperAdmin && (
          <Link to="/admin/churches" className="admin-card p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Manage Churches</p>
              <p className="text-xs text-gray-500">Register or update church info</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        )}
      </div>

      {/* Recent sermons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent Sermons</h2>
          <Link to="/admin/sermons" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <DataTable columns={columns} data={latestSermons} keyExtractor={(s) => s._id} isLoading={sermonsLoading} />
      </div>
    </div>
  );
}
