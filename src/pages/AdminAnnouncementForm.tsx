import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X, CalendarClock, RefreshCw } from 'lucide-react';
import { useAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from '../hooks/useAnnouncements';
import { announcementImageUrl } from '../api/announcementApi';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import type { ApiAnnouncement } from '../types';

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const IMAGE_MAX_MB = 5;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Local YYYY-MM-DD for a date input. */
function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

/** An announcement stays visible through the whole of its expiry date (local time). */
function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

const PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

// ── Page: loads the announcement (edit) before mounting the editor ────────────

export default function AdminAnnouncementForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useAnnouncement(id);

  if (id && isLoading) {
    return (
      <div className="max-w-5xl animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-52" />
        <div className="admin-card p-5 space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  if (id && (isError || !data)) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Announcement not found.</p>
        <Link to="/admin/announcements" className="btn-secondary">Back to Announcements</Link>
      </div>
    );
  }

  return <AnnouncementEditor key={data?._id ?? 'new'} existing={data} />;
}

// ── Editor ────────────────────────────────────────────────────────────────────

interface Errors { title?: string; description?: string; expiresAt?: string; image?: string }

function AnnouncementEditor({ existing }: { existing?: ApiAnnouncement }) {
  const isEdit = Boolean(existing);
  const navigate = useNavigate();
  const toast = useToast();
  const { churchFilter } = useChurch();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement(existing?._id ?? '');

  const [isExpired] = useState(() => (existing ? new Date(existing.expiresAt).getTime() <= Date.now() : false));

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  // An expired announcement must be given a new date to be saved (renewal)
  const [expiryDate, setExpiryDate] = useState(
    existing && !isExpired ? toDateInput(new Date(existing.expiresAt)) : addDays(7),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const localPreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  const existingImage = !removeExisting ? announcementImageUrl(existing?.imagePath ?? null) : null;
  const previewImage = localPreview ?? existingImage;
  const today = toDateInput(new Date());

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, image: 'Use a JPG, PNG, WEBP or GIF image' })); return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: `Poster must be ${IMAGE_MAX_MB} MB or smaller` })); return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    if (existing?.imagePath) setRemoveExisting(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    pickImage(e.dataTransfer.files?.[0]);
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!expiryDate) e.expiresAt = 'Expiry date is required';
    else if (expiryDate < today) e.expiresAt = 'Expiry date cannot be in the past';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const base = {
      title: title.trim(),
      description: description.trim(),
      expiresAt: endOfDayIso(expiryDate),
    };

    try {
      if (existing) {
        await updateMutation.mutateAsync({
          ...base,
          image: imageFile,
          removeImage: removeExisting && !imageFile,
        });
        toast('Announcement updated!', 'success');
      } else {
        await createMutation.mutateAsync({ ...base, church: churchFilter, image: imageFile });
        toast('Announcement published!', 'success');
      }
      navigate('/admin/announcements');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'Failed to save announcement.', 'error');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const expiryLabel = expiryDate
    ? new Date(`${expiryDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/announcements" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-100">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Appears on the home page, below Recent Sermons, until it expires</p>
        </div>
      </div>

      {isExpired && (
        <div className="mb-4 flex items-start gap-3 p-3 rounded-lg border border-amber-500/25 bg-amber-500/10 text-sm text-amber-200">
          <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
          This announcement expired on {new Date(existing!.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} and
          is hidden from the website. Pick a new expiry date to publish it again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="admin-card p-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="admin-label">Title <span className="text-red-400">*</span></label>
                <span className="text-[11px] text-gray-500">{title.length}/{TITLE_MAX}</span>
              </div>
              <input
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: undefined })); }}
                placeholder="e.g. Harvest Thanksgiving Service"
                className={`admin-input ${errors.title ? 'border-red-400' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="admin-label">Description <span className="text-red-400">*</span></label>
                <span className="text-[11px] text-gray-500">{description.length}/{DESCRIPTION_MAX}</span>
              </div>
              <textarea
                value={description}
                maxLength={DESCRIPTION_MAX}
                onChange={(e) => { setDescription(e.target.value); setErrors((x) => ({ ...x, description: undefined })); }}
                placeholder="What's happening, when and where — line breaks are kept."
                className={`admin-textarea ${errors.description ? 'border-red-400' : ''}`}
                rows={6}
              />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            </div>
          </div>

          <div className="admin-card p-5">
            <label className="admin-label">
              Photo / Poster <span className="font-normal text-gray-500 ml-1">(optional)</span>
            </label>
            {previewImage ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-800/40">
                <img src={previewImage} alt="Poster preview" className="w-full max-h-80 object-contain" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-900/90 backdrop-blur text-xs font-medium text-gray-300 shadow-sm hover:bg-gray-900"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="p-1.5 rounded-lg bg-gray-900/90 backdrop-blur text-gray-400 shadow-sm hover:text-red-400 hover:bg-gray-900"
                    title="Remove poster"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/40'
                }`}
              >
                <ImagePlus className="h-7 w-7 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  <span className="text-indigo-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP or GIF · max {IMAGE_MAX_MB} MB</p>
              </div>
            )}
            {errors.image && <p className="text-xs text-red-400 mt-2">{errors.image}</p>}
            <input
              ref={inputRef}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              onChange={(e) => pickImage(e.target.files?.[0])}
              className="hidden"
            />
          </div>

          <div className="admin-card p-5">
            <label className="admin-label">Expiry Date <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={expiryDate}
                min={today}
                onChange={(e) => { setExpiryDate(e.target.value); setErrors((x) => ({ ...x, expiresAt: undefined })); }}
                className={`admin-input w-auto ${errors.expiresAt ? 'border-red-400' : ''}`}
              />
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setExpiryDate(addDays(p.days)); setErrors((x) => ({ ...x, expiresAt: undefined })); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    expiryDate === addDays(p.days)
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                      : 'border-gray-800 text-gray-400 hover:bg-gray-800/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {errors.expiresAt ? (
              <p className="text-xs text-red-400 mt-1.5">{errors.expiresAt}</p>
            ) : expiryLabel && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Visible on the website through the end of {expiryLabel}, then hidden automatically.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/admin/announcements" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Announcement'}
            </button>
          </div>
        </form>

        {/* Live preview — mirrors the public card */}
        <aside className="lg:col-span-2 lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
          <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-sm">
            {previewImage && (
              <div className="aspect-[4/3] bg-gray-800 overflow-hidden">
                <img src={previewImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                {expiryDate ? `Until ${new Date(`${expiryDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Announcement'}
              </p>
              <h3 className="text-lg font-semibold text-gray-100 mt-2 leading-snug line-clamp-2">
                {title || 'Announcement title'}
              </h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-3 whitespace-pre-line">
                {description || 'A short description of the announcement will appear here.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
