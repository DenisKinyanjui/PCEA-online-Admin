import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Quote } from 'lucide-react';
import {
  useYouthMessage, useYouthMessages, useCreateYouthMessage, useUpdateYouthMessage,
} from '../hooks/useYouthMessages';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import type { ApiYouthMessage } from '../types';

const MINISTER_MAX = 120;
const VERSE_MAX = 500;
const MESSAGE_MAX = 10000;

/** Local YYYY-MM-DD */
function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today if it's Sunday, otherwise the most recent Sunday. */
function lastSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return toDateInput(d);
}

const formatServiceDate = (ymd: string) =>
  new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

// ── Page: loads the message (edit) before mounting the editor ─────────────────

export default function AdminYouthMessageForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useYouthMessage(id);

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
        <p className="text-gray-400 mb-4">Message not found.</p>
        <Link to="/admin/youth-messages" className="btn-secondary">Back to Messages</Link>
      </div>
    );
  }

  return <YouthMessageEditor key={data?._id ?? 'new'} existing={data} />;
}

// ── Editor ────────────────────────────────────────────────────────────────────

interface Errors { minister?: string; message?: string; date?: string }

function YouthMessageEditor({ existing }: { existing?: ApiYouthMessage }) {
  const isEdit = Boolean(existing);
  const navigate = useNavigate();
  const toast = useToast();
  const { churchFilter } = useChurch();
  const { data: allMessages } = useYouthMessages();
  const createMutation = useCreateYouthMessage();
  const updateMutation = useUpdateYouthMessage(existing?._id ?? '');

  const [minister, setMinister] = useState(existing?.minister ?? '');
  const [date, setDate] = useState(() => (existing ? existing.date.slice(0, 10) : lastSunday()));
  const [bibleVerse, setBibleVerse] = useState(existing?.bibleVerse ?? '');
  const [message, setMessage] = useState(existing?.message ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [today] = useState(() => toDateInput(new Date()));

  // Suggest ministers who have given a message before
  const pastMinisters = useMemo(
    () => [...new Set((allMessages?.data ?? []).map((m) => m.minister))].sort(),
    [allMessages],
  );

  const validate = (): boolean => {
    const e: Errors = {};
    if (!minister.trim()) e.minister = 'Name of the pastor or guest minister is required';
    if (!message.trim()) e.message = 'Message is required';
    if (!date) e.date = 'Service date is required';
    else if (date > today) e.date = 'Date cannot be in the future';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const input = {
      minister: minister.trim(),
      message: message.trim(),
      bibleVerse: bibleVerse.trim(),
      date,
    };

    try {
      if (existing) {
        await updateMutation.mutateAsync(input);
        toast('Message updated!', 'success');
      } else {
        await createMutation.mutateAsync({ ...input, church: churchFilter });
        toast('Message saved!', 'success');
      }
      navigate('/admin/youth-messages');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: { message: string }[] } } })?.response?.data;
      toast(msg?.errors?.[0]?.message ?? msg?.message ?? 'Failed to save message.', 'error');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/youth-messages" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-100">{isEdit ? 'Edit Message to the Youth' : 'New Message to the Youth'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">The word given to the youth before they were prayed for</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="admin-card p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Pastor / Guest Minister <span className="text-red-400">*</span></label>
                <input
                  value={minister}
                  maxLength={MINISTER_MAX}
                  list="past-ministers"
                  onChange={(e) => { setMinister(e.target.value); setErrors((x) => ({ ...x, minister: undefined })); }}
                  placeholder="e.g. Rev. Jane Wanjiku"
                  className={`admin-input ${errors.minister ? 'border-red-400' : ''}`}
                />
                <datalist id="past-ministers">
                  {pastMinisters.map((name) => <option key={name} value={name} />)}
                </datalist>
                {errors.minister && <p className="text-xs text-red-400 mt-1">{errors.minister}</p>}
              </div>
              <div>
                <label className="admin-label">Service Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={date}
                  max={today}
                  onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }}
                  className={`admin-input ${errors.date ? 'border-red-400' : ''}`}
                />
                {errors.date
                  ? <p className="text-xs text-red-400 mt-1">{errors.date}</p>
                  : date && <p className="text-xs text-gray-500 mt-1">{formatServiceDate(date)}</p>}
              </div>
            </div>

            <div>
              <label className="admin-label">
                Bible Verse <span className="font-normal text-gray-500 ml-1">(optional)</span>
              </label>
              <input
                value={bibleVerse}
                maxLength={VERSE_MAX}
                onChange={(e) => setBibleVerse(e.target.value)}
                placeholder="e.g. 1 Timothy 4:12 — Don't let anyone look down on you because you are young…"
                className="admin-input"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="admin-label">Message <span className="text-red-400">*</span></label>
                <span className="text-[11px] text-gray-500">{message.length}/{MESSAGE_MAX}</span>
              </div>
              <textarea
                value={message}
                maxLength={MESSAGE_MAX}
                onChange={(e) => { setMessage(e.target.value); setErrors((x) => ({ ...x, message: undefined })); }}
                placeholder="What was said to the youth before prayer — line breaks are kept."
                className={`admin-textarea ${errors.message ? 'border-red-400' : ''}`}
                rows={10}
              />
              {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/admin/youth-messages" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Message'}
            </button>
          </div>
        </form>

        {/* Preview — mirrors the public card */}
        <aside className="lg:col-span-2 lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
          <div className="rounded-2xl bg-gray-900 border border-gray-800 shadow-sm p-6">
            <Quote className="h-7 w-7 text-indigo-500/40" />
            <p className="text-gray-200 leading-relaxed mt-3 line-clamp-6 whitespace-pre-line">
              {message || 'The message to the youth will appear here.'}
            </p>
            {bibleVerse && (
              <p className="mt-4 inline-flex items-start gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-1">
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                <span className="line-clamp-1">{bibleVerse}</span>
              </p>
            )}
            <div className="mt-5 pt-4 border-t border-gray-800">
              <p className="text-sm font-semibold text-gray-100">{minister || 'Pastor / Guest Minister'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{date ? formatServiceDate(date) : 'Service date'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
