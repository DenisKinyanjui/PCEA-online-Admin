import { useState, type FormEvent } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import TagInput from './TagInput';
import UploadField from './UploadField';
import { useChurch } from '../../context/ChurchContext';
import type { ApiSermon, CreateSermonInput, ApiChurch } from '../../types';

interface PointState {
  title: string;
  description: string;
  verses: string[];
}

interface FormState {
  title: string;
  preacher: string;
  date: string;
  church: string;
  scriptureReferences: string[];
  summary: string;
  audioUrl: string;
  videoType: 'youtube' | 'file' | '';
  videoUrl: string;
  introduction: string;
  points: PointState[];
  conclusion: string;
}

interface SermonFormProps {
  initialData?: ApiSermon;
  /** MULTI-CHURCH: options for the (disabled) church selector. */
  churches?: ApiChurch[];
  onSubmit: (data: CreateSermonInput) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

function emptyPoint(): PointState {
  return { title: '', description: '', verses: [] };
}

function toFormState(sermon: ApiSermon | undefined, defaultChurch: string): FormState {
  if (!sermon) {
    return {
      title: '', preacher: '', date: '', church: defaultChurch,
      scriptureReferences: [], summary: '', audioUrl: '', videoType: '', videoUrl: '',
      introduction: '', points: [emptyPoint()], conclusion: '',
    };
  }
  return {
    title: sermon.title,
    preacher: sermon.preacher,
    date: sermon.date.slice(0, 10),
    church: sermon.church ?? defaultChurch,
    scriptureReferences: sermon.scriptureReferences ?? [],
    summary: sermon.summary ?? '',
    audioUrl: sermon.audioUrl ?? '',
    videoType: sermon.video?.type ?? '',
    videoUrl: sermon.video?.url ?? '',
    introduction: sermon.content?.introduction ?? '',
    points: sermon.content?.points?.length
      ? sermon.content.points.map((p) => ({ title: p.title, description: p.description, verses: p.verses ?? [] }))
      : [emptyPoint()],
    conclusion: sermon.content?.conclusion ?? '',
  };
}

export default function SermonForm({ initialData, /* churches, */ onSubmit, isSubmitting, submitLabel = 'Save Sermon' }: SermonFormProps) {
  // MULTI-CHURCH: super admins picked the church from `churches`; now always the configured church.
  // const { churchFilter, isSuperAdmin } = useChurch();
  // const defaultChurch = churchFilter ?? initialData?.church ?? '';
  const { churchFilter } = useChurch();
  const defaultChurch = churchFilter;

  const [form, setForm] = useState<FormState>(() => toFormState(initialData, defaultChurch));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [openSection, setOpenSection] = useState<'media' | 'content' | null>('content');

  const set = (field: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addPoint = () => set('points', [...form.points, emptyPoint()]);
  const removePoint = (i: number) => set('points', form.points.filter((_, idx) => idx !== i));
  const updatePoint = (i: number, field: keyof PointState, value: string | string[]) =>
    set('points', form.points.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.preacher.trim()) e.preacher = 'Preacher is required';
    if (!form.date) e.date = 'Date is required';
    // MULTI-CHURCH: if (isSuperAdmin && !form.church) e.church = 'Church is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: form.title.trim(),
      preacher: form.preacher.trim(),
      date: form.date,
      church: form.church || undefined,
      scriptureReferences: form.scriptureReferences,
      summary: form.summary.trim() || undefined,
      audioUrl: form.audioUrl.trim() || undefined,
      video: form.videoType && form.videoUrl.trim()
        ? { type: form.videoType as 'youtube' | 'file', url: form.videoUrl.trim() }
        : null,
      content: {
        introduction: form.introduction.trim(),
        points: form.points
          .filter((p) => p.title.trim())
          .map((p) => ({ title: p.title.trim(), description: p.description.trim(), verses: p.verses })),
        conclusion: form.conclusion.trim(),
      },
    });
  };

  const Section = ({ id, label, children }: { id: 'media' | 'content'; label: string; children: React.ReactNode }) => (
    <div className="bg-blue-900/10 backdrop-blur border-2 border-gray-700 p-5  overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenSection(openSection === id ? null : id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-100">{label}</span>
        {openSection === id ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {openSection === id && <div className="px-5 pb-6 border-t border-gray-800 pt-5">{children}</div>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Core fields */}
      <div className="bg-blue-900/10 backdrop-blur border-2 border-gray-700 p-5 space-y-5">
        <h2 className="text-sm font-semibold text-gray-100">Basic Information</h2>

        <div>
          <label className="admin-label">Title <span className="text-red-400">*</span></label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Walking in Faith"
            className={`admin-input ${errors.title ? 'border-red-400' : ''}`}
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Preacher <span className="text-red-400">*</span></label>
            <input
              value={form.preacher}
              onChange={(e) => set('preacher', e.target.value)}
              placeholder="e.g. Rev. James Kariuki"
              className={`admin-input ${errors.preacher ? 'border-red-400' : ''}`}
            />
            {errors.preacher && <p className="text-xs text-red-400 mt-1">{errors.preacher}</p>}
          </div>
          <div>
            <label className="admin-label">Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={`admin-input ${errors.date ? 'border-red-400' : ''}`}
            />
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Church — locked to the platform's single church */}
        <div>
          <label className="admin-label">Church</label>
          <div className="admin-input bg-gray-800/40 text-gray-400 cursor-not-allowed">
            {form.church}
          </div>
        </div>

        {/* MULTI-CHURCH: church selector — super_admin could choose; others saw a locked badge.
        <div>
          <label className="admin-label">Church <span className="text-red-400">*</span></label>
          {isSuperAdmin ? (
            <>
              <div className="relative">
                <select
                  value={form.church}
                  onChange={(e) => set('church', e.target.value)}
                  className={`admin-select pr-8 ${errors.church ? 'border-red-400' : ''}`}
                >
                  <option value="">— Select a church —</option>
                  {churches.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
              </div>
              {errors.church && <p className="text-xs text-red-400 mt-1">{errors.church}</p>}
            </>
          ) : (
            <div className="admin-input bg-gray-800/40 text-gray-400 cursor-not-allowed">
              {form.church || 'No church assigned'}
            </div>
          )}
        </div>
        */}

        <div>
          <label className="admin-label">Summary</label>
          <textarea
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="Brief description of the sermon…"
            className="admin-textarea"
            rows={3}
          />
        </div>

        <div>
          <label className="admin-label">Scripture References</label>
          <TagInput
            tags={form.scriptureReferences}
            onChange={(tags) => set('scriptureReferences', tags)}
            placeholder="Add reference (e.g. John 3:16), press Enter…"
          />
        </div>
      </div>

      {/* Media */}
      <Section id="media" label="Media (Audio &amp; Video)">
        <div className="space-y-5">
          <div>
            <label className="admin-label">Audio URL</label>
            <input
              value={form.audioUrl}
              onChange={(e) => set('audioUrl', e.target.value)}
              placeholder="https://…"
              className="admin-input"
            />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-800" />
            <span className="text-xs text-gray-500 flex-shrink-0">or upload file</span>
            <div className="flex-1 border-t border-gray-800" />
          </div>
          <UploadField type="audio" label="Upload Audio" onUploadComplete={(url) => set('audioUrl', url)} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="admin-label">Video Type</label>
              <div className="relative">
                <select value={form.videoType} onChange={(e) => set('videoType', e.target.value)} className="admin-select pr-8">
                  <option value="">None</option>
                  <option value="youtube">YouTube</option>
                  <option value="file">Direct URL</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>
            {form.videoType && (
              <div className="sm:col-span-2">
                <label className="admin-label">Video URL</label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => set('videoUrl', e.target.value)}
                  placeholder={form.videoType === 'youtube' ? 'https://youtu.be/…' : 'https://…'}
                  className="admin-input"
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Transcript */}
      <Section id="content" label="Transcript / Sermon Content">
        <div className="space-y-6">
          <div>
            <label className="admin-label">Introduction</label>
            <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} placeholder="Opening paragraph…" className="admin-textarea" rows={4} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="admin-label mb-0">Main Points</label>
              <button type="button" onClick={addPoint} className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="h-3.5 w-3.5" /> Add Point
              </button>
            </div>
            <div className="space-y-4">
              {form.points.map((point, i) => (
                <div key={i} className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Point {i + 1}</span>
                    {form.points.length > 1 && (
                      <button type="button" onClick={() => removePoint(i)} className="btn-danger text-xs py-1 px-2">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input value={point.title} onChange={(e) => updatePoint(i, 'title', e.target.value)} placeholder="Point title…" className="admin-input" />
                  <textarea value={point.description} onChange={(e) => updatePoint(i, 'description', e.target.value)} placeholder="Point description…" className="admin-textarea" rows={3} />
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Key Verses</label>
                    <TagInput tags={point.verses} onChange={(tags) => updatePoint(i, 'verses', tags)} placeholder="Add verse (e.g. Romans 8:28), press Enter…" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="admin-label">Conclusion</label>
            <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} placeholder="Closing paragraph…" className="admin-textarea" rows={4} />
          </div>
        </div>
      </Section>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
          {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
