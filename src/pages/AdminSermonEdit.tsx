import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SermonForm from '../components/ui/SermonForm';
import { SermonDetailSkeleton } from '../components/ui/Skeletons';
import { useSermon } from '../hooks/useSermons';
import { useUpdateSermon } from '../hooks/useSermonMutations';
import { useChurches } from '../hooks/useChurches';
import { useToast } from '../context/ToastContext';
import type { CreateSermonInput } from '../types';

export default function AdminSermonEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: sermon, isLoading, isError } = useSermon(id);
  const { data: churchesData } = useChurches();
  const updateMutation = useUpdateSermon(id!);

  const handleSubmit = async (data: CreateSermonInput) => {
    try {
      await updateMutation.mutateAsync(data);
      toast('Sermon updated successfully!', 'success');
      navigate('/admin/sermons');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to update sermon.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-6" />
        <SermonDetailSkeleton />
      </div>
    );
  }

  if (isError || !sermon) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Sermon not found.</p>
        <Link to="/admin/sermons" className="btn-secondary">Back to Sermons</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/sermons" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-100">Edit Sermon</h1>
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{sermon.title}</p>
        </div>
      </div>
      <SermonForm
        initialData={sermon}
        churches={churchesData?.data ?? []}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}
