import { useMemo, useState } from 'react';
import { MapPin, Save, Trash2, UsersRound } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import SearchInput from '../components/ui/SearchInput';
import { useToast } from '../context/ToastContext';
import {
  useAdminMembers,
  useDeleteMember,
  useMemberDistricts,
  useUpdateMember,
} from '../hooks/useMembers';
import type { AdminMember } from '../api/memberApi';

interface MemberRowProps {
  member: AdminMember;
  districts: { _id: string; name: string }[];
  onSave: (member: AdminMember, name: string, email: string, districtId: string) => Promise<void>;
  onDelete: (member: AdminMember) => void;
  isSaving: boolean;
}

function MemberRow({ member, districts, onSave, onDelete, isSaving }: MemberRowProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [districtId, setDistrictId] = useState(member.district?.id ?? '');
  const hasChanges =
    name !== member.name ||
    email !== member.email ||
    districtId !== (member.district?.id ?? '');

  return (
    <div className="grid gap-4 border-b border-gray-800 px-5 py-4 last:border-0 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-start">
      <label className="admin-label">
        Member name
        <input value={name} onChange={(event) => setName(event.target.value)} className="admin-input mt-1" />
      </label>
      <label className="admin-label">
        Email (admin only)
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input mt-1" />
      </label>
      <label className="admin-label">
        District
        <select value={districtId} onChange={(event) => setDistrictId(event.target.value)} className="admin-select mt-1">
          <option value="">Unassigned</option>
          {districts.map((district) => (
            <option key={district._id} value={district._id}>{district.name}</option>
          ))}
        </select>
      </label>
      <div className="text-sm text-gray-400">
        {member.location ? (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <span><span className="text-amber-300">Location for assignment:</span> {member.location}</span>
          </p>
        ) : (
          <p className="pt-2 text-xs text-gray-500">No address/location provided</p>
        )}
      </div>
      <div className="flex gap-2 lg:pt-6">
        <button
          type="button"
          onClick={() => void onSave(member, name.trim(), email.trim(), districtId)}
          disabled={!hasChanges || isSaving || !name.trim() || !email.trim()}
          className="btn-primary"
          title="Save member details"
        >
          <Save className="h-4 w-4" /> Save
        </button>
        <button
          type="button"
          onClick={() => onDelete(member)}
          className="btn-secondary text-red-300 hover:text-red-200"
          title="Remove member"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const toast = useToast();
  const { data: members = [], isLoading, isError } = useAdminMembers();
  const { data: districts = [] } = useMemberDistricts();
  const updateMutation = useUpdateMember();
  const deleteMutation = useDeleteMember();
  const [deleteTarget, setDeleteTarget] = useState<AdminMember | null>(null);
  const [search, setSearch] = useState('');
  const [districtSort, setDistrictSort] = useState<'asc' | 'desc'>('asc');
  const visibleMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return [...members]
      .filter((member) =>
        !normalizedSearch ||
        member.name.toLocaleLowerCase().includes(normalizedSearch) ||
        member.email.toLocaleLowerCase().includes(normalizedSearch)
      )
      .sort((first, second) => {
        const firstDistrict = first.district?.name ?? 'Unassigned';
        const secondDistrict = second.district?.name ?? 'Unassigned';
        const districtComparison = firstDistrict.localeCompare(secondDistrict, undefined, {
          sensitivity: 'base',
        });
        if (districtComparison !== 0) {
          return districtSort === 'asc' ? districtComparison : -districtComparison;
        }
        return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
      });
  }, [members, search, districtSort]);

  const saveMember = async (
    member: AdminMember,
    name: string,
    email: string,
    districtId: string
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        input: { name, email, districtId: districtId || null },
      });
      toast('Member updated.', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast(message ?? 'Failed to update member.', 'error');
    }
  };

  const removeMember = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast('Member removed.', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast(message ?? 'Failed to remove member.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length === 1 ? '' : 's'}; contact details and locations are admin-only`}
      />
      {isLoading ? (
        <div className="admin-card p-6 text-sm text-gray-400">Loading members…</div>
      ) : isError ? (
        <div role="alert" className="admin-card p-6 text-sm text-red-300">Could not load members. Check your access and try again.</div>
      ) : members.length === 0 ? (
        <AdminEmptyState icon={UsersRound} title="No members yet" description="Members who create public accounts will appear here." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name or email…"
              className="flex-1"
            />
            <label className="sr-only" htmlFor="member-district-sort">Sort members by district</label>
            <select
              id="member-district-sort"
              value={districtSort}
              onChange={(event) => setDistrictSort(event.target.value as 'asc' | 'desc')}
              className="admin-select sm:w-56"
            >
              <option value="asc">District: A to Z</option>
              <option value="desc">District: Z to A</option>
            </select>
          </div>
          {visibleMembers.length === 0 ? (
            <div className="admin-card">
              <AdminEmptyState
                icon={UsersRound}
                title="No matching members"
                description="Try a different name or email search."
              />
            </div>
          ) : (
            <div className="admin-card">
              {visibleMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              districts={districts}
              onSave={saveMember}
              onDelete={setDeleteTarget}
              isSaving={updateMutation.isPending}
            />
          ))}
            </div>
          )}
        </>
      )}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Remove member?"
        message={`This will permanently remove ${deleteTarget?.name ?? 'this member'} and their account.`}
        onConfirm={() => void removeMember()}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
