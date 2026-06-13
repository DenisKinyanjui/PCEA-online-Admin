import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { useChurches } from '../hooks/useChurches';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ApiAdminUser, CreateUserInput, UserRole } from '../types';

const roleColors: Record<UserRole, string> = {
  super_admin: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  church_admin: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  transcriptionist: 'text-amber-700 bg-amber-50 border-amber-200',
};
const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  church_admin: 'Church Admin',
  transcriptionist: 'Transcriptionist',
};

interface CreateForm { name: string; email: string; password: string; role: UserRole; church: string; }

const emptyCreate: CreateForm = { name: '', email: '', password: '', role: 'church_admin', church: '' };

export default function AdminUsers() {
  const toast = useToast();
  const { currentUser } = useAuth();
  const { data: usersData, isLoading } = useUsers();
  const { data: churchesData } = useChurches();
  const createMutation = useCreateUser();
  const deleteMutation = useDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [editTarget, setEditTarget] = useState<ApiAdminUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('church_admin');
  const [editChurch, setEditChurch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ApiAdminUser | null>(null);

  const updateMutation = useUpdateUser(editTarget?.id ?? '');
  const churches = churchesData?.data ?? [];
  const users = usersData?.data ?? [];

  const setC = (field: keyof CreateForm, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast('Name, email and password are required.', 'error'); return;
    }
    if (['church_admin', 'transcriptionist'].includes(createForm.role) && !createForm.church) {
      toast('A church must be assigned for this role.', 'error'); return;
    }
    try {
      const payload: CreateUserInput = {
        name: createForm.name, email: createForm.email, password: createForm.password,
        role: createForm.role,
        ...(createForm.church && { church: createForm.church }),
      };
      await createMutation.mutateAsync(payload);
      toast('User created!', 'success');
      setCreateForm(emptyCreate); setShowCreate(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to create user.', 'error');
    }
  };

  const startEdit = (u: ApiAdminUser) => {
    setEditTarget(u); setEditRole(u.role); setEditChurch(u.church?.id ?? '');
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({
        role: editRole,
        church: editRole === 'super_admin' ? null : (editChurch || null),
      });
      toast('User updated!', 'success');
      setEditTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to update user.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast('User deleted.', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to delete user.', 'error');
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description={`${usersData?.total ?? 0} users total`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New User
          </button>
        }
      />

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreate(false); setCreateForm(emptyCreate); }} />
          <div className="relative admin-card w-full max-w-lg p-6 shadow-xl">
            <button
              onClick={() => { setShowCreate(false); setCreateForm(emptyCreate); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Create New User</h3>
                <p className="text-xs text-gray-500">Fill in the details to add a user to the system.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Name <span className="text-red-500">*</span></label>
                <input value={createForm.name} onChange={(e) => setC('name', e.target.value)} className="admin-input" placeholder="Full name" />
              </div>
              <div>
                <label className="admin-label">Email <span className="text-red-500">*</span></label>
                <input type="email" value={createForm.email} onChange={(e) => setC('email', e.target.value)} className="admin-input" placeholder="user@church.org" />
              </div>
              <div>
                <label className="admin-label">Password <span className="text-red-500">*</span></label>
                <input type="password" value={createForm.password} onChange={(e) => setC('password', e.target.value)} className="admin-input" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="admin-label">Role <span className="text-red-500">*</span></label>
                <select value={createForm.role} onChange={(e) => setC('role', e.target.value)} className="admin-select">
                  <option value="church_admin">Church Admin</option>
                  <option value="transcriptionist">Transcriptionist</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {createForm.role !== 'super_admin' && (
                <div className="sm:col-span-2">
                  <label className="admin-label">Church <span className="text-red-500">*</span></label>
                  <select value={createForm.church} onChange={(e) => setC('church', e.target.value)} className="admin-select">
                    <option value="">— Select a church —</option>
                    {churches.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowCreate(false); setCreateForm(emptyCreate); }} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : (
                  <><Plus className="h-3.5 w-3.5" /> Create User</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit inline form */}
      {editTarget && (
        <div className="admin-card p-5 space-y-4 border-indigo-200 ring-1 ring-indigo-100">
          <h3 className="text-sm font-semibold text-gray-900">Editing: {editTarget.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Role</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="admin-select">
                <option value="church_admin">Church Admin</option>
                <option value="transcriptionist">Transcriptionist</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            {editRole !== 'super_admin' && (
              <div>
                <label className="admin-label">Church</label>
                <select value={editChurch} onChange={(e) => setEditChurch(e.target.value)} className="admin-select">
                  <option value="">— None —</option>
                  {churches.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditTarget(null)} className="btn-secondary"><X className="h-3.5 w-3.5" /> Cancel</button>
            <button onClick={handleUpdate} disabled={updateMutation.isPending} className="btn-primary">
              <Check className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      {isLoading ? (
        <div className="admin-card animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
              <div className="w-9 h-9 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <AdminEmptyState icon={Users} title="No users yet" description="Create the first user for this system." />
      ) : (
        <div className="admin-card">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                  {user.id === currentUser?.id && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">You</span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                {user.church && <p className="text-xs text-gray-400 mt-0.5">{user.church.name}</p>}
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit role">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {user.id !== currentUser?.id && (
                  <button onClick={() => setDeleteTarget(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User"
        message={`"${deleteTarget?.name}" will be permanently deleted from the system.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
