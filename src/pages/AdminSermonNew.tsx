import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SermonForm from '../components/ui/SermonForm';
import { useCreateSermon } from '../hooks/useSermonMutations';
import { useChurches } from '../hooks/useChurches';
import { useToast } from '../context/ToastContext';
import type { CreateSermonInput } from '../types';

export default function AdminSermonNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: churchesData } = useChurches();
  const createMutation = useCreateSermon();

  const handleSubmit = async (data: CreateSermonInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast('Sermon created successfully!', 'success');
      navigate('/admin/sermons');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to create sermon.', 'error');
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/sermons" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-100">New Sermon</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fill in the details below</p>
        </div>
      </div>
      <SermonForm
        churches={churchesData?.data ?? []}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Sermon"
      />
    </div>
  );
}
