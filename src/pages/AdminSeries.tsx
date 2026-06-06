import { useState } from 'react';
import { Plus, Edit2, Trash2, BookMarked, Check, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useSeries, useCreateSeries, useUpdateSeries, useDeleteSeries } from '../hooks/useSeries';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import type { ApiSeries } from '../types';

export default function AdminSeries() {
  const toast = useToast();
  const { churchFilter, isSuperAdmin, selectedChurch } = useChurch();
  const { data, isLoading } = useSeries(churchFilter);
  const createMutation = useCreateSeries();
  const deleteSeriesMutation = useDeleteSeries();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editTarget, setEditTarget] = useState<ApiSeries | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ApiSeries | null>(null);

  const updateMutation = useUpdateSeries(editTarget?._id ?? '');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const payload = {
        name: newName.trim(),
        description: newDesc.trim(),
        ...(isSuperAdmin && selectedChurch ? { church: selectedChurch.name } : {}),
      };
      await createMutation.mutateAsync(payload);
      toast('Series created!', 'success');
      setNewName(''); setNewDesc(''); setShowCreateForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to create series.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editTarget || !editName.trim()) return;
    try {
      await updateMutation.mutateAsync({ name: editName.trim(), description: editDesc.trim() });
      toast('Series updated!', 'success');
      setEditTarget(null);
    } catch {
      toast('Failed to update series.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSeriesMutation.mutateAsync(deleteTarget._id);
      toast('Series deleted.', 'success');
    } catch {
      toast('Failed to delete series.', 'error');
    } finally { setDeleteTarget(null); }
  };

  const seriesList = data?.data ?? [];

  const canCreate = !isSuperAdmin || Boolean(selectedChurch);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Series"
        description={churchFilter ? `${data?.total ?? 0} series for ${churchFilter}` : `${data?.total ?? 0} series total`}
        action={
          <button onClick={() => setShowCreateForm(true)} disabled={!canCreate} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4" /> New Series
          </button>
        }
      />

      {isSuperAdmin && !selectedChurch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          Select a church from the topbar to create a series, or view all series below.
        </div>
      )}

      {showCreateForm && (
        <div className="admin-card p-5 space-y-4 border-indigo-200 ring-1 ring-indigo-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Create New Series
            {churchFilter && <span className="font-normal text-gray-500 ml-2">for {churchFilter}</span>}
          </h3>
          <div>
            <label className="admin-label">Name <span className="text-red-500">*</span></label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Journey of Faith" className="admin-input" autoFocus />
          </div>
          <div>
            <label className="admin-label">Description</label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description…" className="admin-textarea" rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowCreateForm(false); setNewName(''); setNewDesc(''); }} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !newName.trim()} className="btn-primary">
              {createMutation.isPending ? 'Creating…' : 'Create Series'}
            </button>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="admin-card p-5 space-y-4 border-indigo-200 ring-1 ring-indigo-100">
          <h3 className="text-sm font-semibold text-gray-900">Editing: {editTarget.name}</h3>
          <div>
            <label className="admin-label">Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="admin-label">Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="admin-textarea" rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditTarget(null)} className="btn-secondary"><X className="h-3.5 w-3.5" /> Cancel</button>
            <button onClick={handleUpdate} disabled={updateMutation.isPending} className="btn-primary">
              <Check className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="admin-card animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <AdminEmptyState icon={BookMarked} title="No series yet" description="Group your sermons into series for better organization." />
      ) : (
        <div className="admin-card">
          {seriesList.map((s) => (
            <div key={s._id} className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.church}</span>
                </div>
                {s.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>}
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditTarget(s); setEditName(s.name); setEditDesc(s.description); }} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Series"
        message={`"${deleteTarget?.name}" will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteSeriesMutation.isPending}
      />
    </div>
  );
}
