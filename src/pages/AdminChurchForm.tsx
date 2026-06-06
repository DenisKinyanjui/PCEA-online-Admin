import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChurch as useChurchById, useCreateChurch, useUpdateChurch } from '../hooks/useChurches';
import { useToast } from '../context/ToastContext';
import type { CreateChurchInput } from '../types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/p\.c\.e\.a\.?/gi, 'pcea')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface ChurchFormState {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  isActive: boolean;
}

const empty: ChurchFormState = {
  name: '', slug: '', tagline: '', description: '', address: '',
  contactEmail: '', contactPhone: '', logoUrl: '', isActive: true,
};

export default function AdminChurchForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const { data: existing, isLoading } = useChurchById(id);
  const createMutation = useCreateChurch();
  const updateMutation = useUpdateChurch(id ?? '');

  const [form, setForm] = useState<ChurchFormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof ChurchFormState, string>>>({});

  // Populate form once the async query resolves (useState initializer runs before data arrives)
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        tagline: existing.tagline ?? '',
        description: existing.description,
        address: existing.address,
        contactEmail: existing.contactEmail,
        contactPhone: existing.contactPhone,
        logoUrl: existing.logoUrl,
        isActive: existing.isActive,
      });
    }
  }, [existing]);

  // Auto-populate slug from name on create
  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : toSlug(name),
    }));
  };

  const set = (field: keyof ChurchFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Church name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug may only contain lowercase letters, numbers, hyphens';
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateChurchInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      logoUrl: form.logoUrl.trim(),
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast('Church updated successfully!', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        toast('Church created successfully!', 'success');
      }
      navigate('/admin/churches');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to save church.', 'error');
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-40" />
        <div className="admin-card p-5 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/churches" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Church' : 'New Church'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Update church information' : 'Register a new church in the system'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core info */}
        <div className="admin-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Church Details</h2>

          <div>
            <label className="admin-label">Church Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. P.C.E.A Emmanuel Thome Church"
              className={`admin-input ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="admin-label">
              Slug <span className="text-red-500">*</span>
              <span className="font-normal text-gray-400 ml-2">(used for future subdomain support)</span>
            </label>
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase())}
              placeholder="e.g. pcea-emmanuel-thome"
              className={`admin-input font-mono text-sm ${errors.slug ? 'border-red-400' : ''}`}
            />
            {errors.slug ? (
              <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Future URL: <span className="font-mono">{form.slug || 'your-slug'}.pcea.ke</span></p>
            )}
          </div>

          <div>
            <label className="admin-label">
              Hero Tagline
              <span className="font-normal text-gray-400 ml-2">(shown as the main headline on the church's subdomain)</span>
            </label>
            <input
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder='e.g. "Growing in Christ, Guided by His Word"'
              className="admin-input"
            />
          </div>

          <div>
            <label className="admin-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of the church shown below the tagline…"
              className="admin-textarea"
              rows={2}
            />
          </div>

          <div>
            <label className="admin-label">Address</label>
            <input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Physical address"
              className="admin-input"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="admin-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                placeholder="info@church.org"
                className={`admin-input ${errors.contactEmail ? 'border-red-400' : ''}`}
              />
              {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail}</p>}
            </div>
            <div>
              <label className="admin-label">Contact Phone</label>
              <input
                value={form.contactPhone}
                onChange={(e) => set('contactPhone', e.target.value)}
                placeholder="+254 700 000 000"
                className="admin-input"
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Logo URL</label>
            <input
              value={form.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)}
              placeholder="https://…"
              className="admin-input"
            />
          </div>
        </div>

        {/* Status */}
        <div className="admin-card p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Active Church</p>
              <p className="text-xs text-gray-500">Inactive churches are hidden from the public site</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/admin/churches" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isPending} className="btn-primary px-6">
            {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Church'}
          </button>
        </div>
      </form>
    </div>
  );
}
