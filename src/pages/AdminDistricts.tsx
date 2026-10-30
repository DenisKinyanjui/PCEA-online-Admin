import { useState, type FormEvent } from 'react';
import { Check, Edit2, MapPin, Plus, Trash2, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useToast } from '../context/ToastContext';
import {
  useCreateDistrict,
  useDeleteDistrict,
  useMemberDistricts,
  useUpdateDistrict,
} from '../hooks/useMembers';
import type { DistrictInput, MemberDistrictOption } from '../api/memberApi';

export default function AdminDistricts() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [elderName, setElderName] = useState('');
  const [deaconsText, setDeaconsText] = useState('');
  const [editTarget, setEditTarget] = useState<MemberDistrictOption | null>(null);
  const [editName, setEditName] = useState('');
  const [editElderName, setEditElderName] = useState('');
  const [editDeaconsText, setEditDeaconsText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MemberDistrictOption | null>(null);
  const { data: districts = [], isLoading, isError } = useMemberDistricts();
  const createMutation = useCreateDistrict();
  const updateMutation = useUpdateDistrict();
  const deleteMutation = useDeleteDistrict();

  const districtInput = (districtName: string, districtElder: string, deacons: string): DistrictInput => ({
    name: districtName.trim(),
    elderName: districtElder.trim(),
    deacons: deacons.split(/\r?\n/).map((deacon) => deacon.trim()).filter(Boolean),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const districtName = name.trim();
    if (!districtName) return;
    try {
      await createMutation.mutateAsync(districtInput(districtName, elderName, deaconsText));
      setName('');
      setElderName('');
      setDeaconsText('');
      toast('District added. It is now available in member signup.', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast(message ?? 'Failed to add district.', 'error');
    }
  };

  const beginEdit = (district: MemberDistrictOption) => {
    setEditTarget(district);
    setEditName(district.name);
    setEditElderName(district.elderName ?? '');
    setEditDeaconsText((district.deacons ?? []).join('\n'));
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editTarget || !editName.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: editTarget._id,
        input: districtInput(editName, editElderName, editDeaconsText),
      });
      setEditTarget(null);
      toast('District updated.', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast(message ?? 'Failed to update district.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      if (editTarget?._id === deleteTarget._id) setEditTarget(null);
      toast('District deleted.', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast(message ?? 'Failed to delete district.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Districts"
        description="Add the districts that members can select when creating an account."
      />

      <section className="admin-card p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            District name
            <input
              id="district-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input mt-1"
              placeholder="e.g. Rehoboth"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label className="admin-label">
            District elder
            <input
              value={elderName}
              onChange={(event) => setElderName(event.target.value)}
              className="admin-input mt-1"
              placeholder="Elder full name"
              maxLength={100}
            />
          </label>
          <label className="admin-label sm:col-span-2">
            Deacons
            <textarea
              value={deaconsText}
              onChange={(event) => setDeaconsText(event.target.value)}
              className="admin-input mt-1 min-h-24"
              placeholder={'Enter one deacon name per line'}
            />
            <span className="mt-1 block text-xs text-gray-500">Add up to 12 names, one per line.</span>
          </label>
          <button type="submit" disabled={createMutation.isPending || !name.trim()} className="btn-primary justify-center sm:col-span-2">
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? 'Adding…' : 'Add district'}
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          Districts are linked to this church. New active districts become selectable in signup immediately.
        </p>
      </section>

      <section className="admin-card">
        <div className="border-b border-gray-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-100">Active districts ({districts.length})</h2>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-gray-400">Loading districts…</p>
        ) : isError ? (
          <p role="alert" className="p-5 text-sm text-red-300">Could not load districts.</p>
        ) : districts.length === 0 ? (
          <div className="p-5">
            <AdminEmptyState
              icon={MapPin}
              title="No districts added yet"
              description="Add each district above. Members will then be able to select it during signup."
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {districts.map((district) => (
              <li key={district._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                {editTarget?._id === district._id ? (
                  <form onSubmit={handleUpdate} className="grid w-full gap-3 md:grid-cols-2">
                    <label className="admin-label">
                      District name
                      <input
                        aria-label={`Edit ${district.name}`}
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="admin-input mt-1"
                        minLength={2}
                        maxLength={100}
                        required
                        autoFocus
                      />
                    </label>
                    <label className="admin-label">
                      District elder
                      <input
                        value={editElderName}
                        onChange={(event) => setEditElderName(event.target.value)}
                        className="admin-input mt-1"
                        maxLength={100}
                      />
                    </label>
                    <label className="admin-label md:col-span-2">
                      Deacons (one name per line)
                      <textarea
                        value={editDeaconsText}
                        onChange={(event) => setEditDeaconsText(event.target.value)}
                        className="admin-input mt-1 min-h-24"
                      />
                    </label>
                    <div className="flex gap-2 md:col-span-2">
                      <button type="submit" className="btn-primary" disabled={updateMutation.isPending || !editName.trim()}>
                        <Check className="h-4 w-4" /> Save
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)} disabled={updateMutation.isPending}>
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                    <span className="flex-1 text-sm text-gray-200">
                      {district.name}
                      {(district.elderName || district.deacons?.length) && (
                        <span className="mt-1 block text-xs text-gray-500">
                          {district.elderName ? `Elder: ${district.elderName}` : 'Elder not listed'}
                          {district.deacons?.length ? ` · Deacons: ${district.deacons.join(', ')}` : ''}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => beginEdit(district)}
                      className="btn-secondary"
                      title={`Edit ${district.name}`}
                    >
                      <Edit2 className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(district)}
                      className="btn-secondary text-red-300 hover:text-red-200"
                      title={`Delete ${district.name}`}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete district?"
        message={`Delete ${deleteTarget?.name ?? 'this district'}? A district with assigned members cannot be deleted; reassign or unassign those members first.`}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
