import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, Globe } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useChurches, useDeleteChurch } from '../hooks/useChurches';
import { useToast } from '../context/ToastContext';
import type { ApiChurch } from '../types';

export default function AdminChurches() {
  const toast = useToast();
  const { data, isLoading, isError } = useChurches();
  const deleteMutation = useDeleteChurch();
  const [deleteTarget, setDeleteTarget] = useState<ApiChurch | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast('Church deleted.', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to delete church.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const churches = data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Churches"
        description={`${data?.total ?? 0} churches registered`}
        action={
          <Link to="/admin/churches/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New Church
          </Link>
        }
      />

      {isError && <p className="text-red-500 text-sm">Failed to load churches.</p>}

      {isLoading ? (
        <div className="admin-card animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : churches.length === 0 ? (
        <AdminEmptyState
          icon={Building2}
          title="No churches yet"
          description="Add your first church to start managing multi-church content."
          action={<Link to="/admin/churches/new" className="btn-primary mt-2">Add Church</Link>}
        />
      ) : (
        <div className="admin-card">
          {churches.map((church) => (
            <div
              key={church._id}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-indigo-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{church.name}</p>
                  {!church.isActive && (
                    <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Globe className="h-3 w-3" />
                    {church.slug}
                  </span>
                  {church.contactEmail && (
                    <span className="text-xs text-gray-400 truncate">{church.contactEmail}</span>
                  )}
                </div>
                {church.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{church.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Link
                  to={`/admin/churches/${church._id}/edit`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(church)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Church"
        message={`"${deleteTarget?.name}" will be permanently deleted. This will fail if sermons are linked to it.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
