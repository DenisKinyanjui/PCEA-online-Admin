import { useState } from 'react';
import { Save, Loader, AlertCircle } from 'lucide-react';
import type { SermonJob, CreateSermonFromAIInput } from '../../../types';
import { createSermonFromAI } from '../../../api/uploadApi';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import TagInput from '../../ui/TagInput';

interface AIResultEditorProps {
  job: SermonJob;
  initialTitle: string;
  church?: string;
}

export default function AIResultEditor({ job, initialTitle, church }: AIResultEditorProps) {
  const toast = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialTitle || job.aiResult.titleSuggestions[0] || '');
  const [preacher, setPreacher] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(job.aiResult.summary || '');
  const [scriptureRefs, setScriptureRefs] = useState<string[]>(job.aiResult.keyVerses || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePublish = async () => {
    if (!title.trim()) { setError('Sermon title is required'); return; }
    if (!preacher.trim()) { setError('Preacher name is required'); return; }
    if (!date) { setError('Sermon date is required'); return; }

    setError('');
    setSaving(true);
    try {
      const input: CreateSermonFromAIInput = {
        jobId: job._id,
        title: title.trim(),
        preacher: preacher.trim(),
        date,
        summary: summary.trim(),
        scriptureReferences: scriptureRefs,
        church,
        audioUrl: job.sourceFileType === 'audio' ? job.sourceFileUrl : undefined,
      };
      await createSermonFromAI(input);
      toast('Sermon published successfully!', 'success');
      navigate('/sermons');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish sermon';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="admin-label">Sermon Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="admin-input w-full"
            placeholder="Sermon title"
          />
        </div>

        {/* Preacher */}
        <div>
          <label className="admin-label">Preacher *</label>
          <input
            type="text"
            value={preacher}
            onChange={(e) => setPreacher(e.target.value)}
            className="admin-input w-full"
            placeholder="e.g. Rev. John Kamau"
          />
        </div>

        {/* Date */}
        <div>
          <label className="admin-label">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input w-full"
          />
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <label className="admin-label">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="admin-input w-full resize-none"
            placeholder="Sermon summary…"
          />
        </div>

        {/* Scripture References */}
        <div className="md:col-span-2">
          <label className="admin-label">Scripture References</label>
          <TagInput
            tags={scriptureRefs}
            onChange={setScriptureRefs}
            placeholder="Add reference (e.g. John 3:16) and press Enter"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handlePublish}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Publishing…' : 'Publish Sermon'}
        </button>
      </div>
    </div>
  );
}
