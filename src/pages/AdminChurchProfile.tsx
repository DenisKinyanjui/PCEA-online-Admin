import { Building2 } from 'lucide-react';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import AdminChurchForm from './AdminChurchForm';
import { useChurch } from '../context/ChurchContext';
import { useChurches } from '../hooks/useChurches';
import { CHURCH_NAME, CHURCH_SLUG } from '../config/church';

// Single-church replacement for the multi-church "Churches" list: edits the one
// church record the public site is built from.
export default function AdminChurchProfile() {
  const { selectedChurch } = useChurch();
  const { isLoading } = useChurches();

  if (isLoading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-40" />
        <div className="admin-card p-5 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  if (!selectedChurch) {
    return (
      <AdminEmptyState
        icon={Building2}
        title="Church record not found"
        description={`No church with slug "${CHURCH_SLUG}" exists. Create "${CHURCH_NAME}" in the database (or set VITE_CHURCH_SLUG) to manage its profile.`}
      />
    );
  }

  return <AdminChurchForm churchId={selectedChurch._id} />;
}
