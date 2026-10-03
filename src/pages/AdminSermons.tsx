import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, BookOpen } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { type Column } from '../components/ui/DataTable';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import { useSermons } from '../hooks/useSermons';
import { useDeleteSermon } from '../hooks/useSermonMutations';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import type { ApiSermonSummary } from '../types';

const LIMIT = 10;

export default function AdminSermons() {
  const toast = useToast();
  const { churchFilter } = useChurch();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [churchFilter]);

  const { data, isLoading } = useSermons({
    search: debouncedSearch || undefined,
    church: churchFilter,
    page,
    limit: LIMIT,
  });

  const deleteMutation = useDeleteSermon();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast('Sermon deleted successfully.', 'success');
    } catch {
      toast('Failed to delete sermon.', 'error');
    } finally { setDeleteTarget(null); }
  };

  const sermons = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  const columns: Column<ApiSermonSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (s) => (
        <div>
          <p className="font-medium text-gray-100 line-clamp-1">{s.title}</p>
        </div>
      ),
    },
    { key: 'preacher', header: 'Preacher', render: (s) => <span className="text-gray-400 text-sm">{s.preacher}</span> },
    // MULTI-CHURCH: church column (every sermon belongs to the same church now).
    // {
    //   key: 'church',
    //   header: 'Church',
    //   render: (s) => (
    //     <span className="text-xs bg-gray-800 text-gray-400 border border-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
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
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (s) => (
        <div className="flex items-center gap-1 justify-end">
          <a
            href={`http://localhost:5173/sermons/${s._id}`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="View on site"
          >
            <Eye className="h-3.5 w-3.5" />
          </a>
          <Link to={`/admin/sermons/${s._id}/edit`} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Edit">
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => setDeleteTarget({ id: s._id, title: s.title })} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sermons"
        description={`${data?.total ?? 0} sermons total`}
        action={<Link to="/admin/sermons/new" className="btn-primary"><Plus className="h-4 w-4" /> New Sermon</Link>}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search sermons…" className="max-w-sm" />

      {!isLoading && sermons.length === 0 ? (
        <AdminEmptyState icon={BookOpen} title="No sermons found" description="Try a different search or create a new sermon." action={<Link to="/admin/sermons/new" className="btn-primary mt-2">Add Sermon</Link>} />
      ) : (
        <>
          <DataTable columns={columns} data={sermons} keyExtractor={(s) => s._id} isLoading={isLoading} />
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}`}>
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Sermon"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
