import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from 'react';
import {
  Upload, Music, FileText, Sparkles, XCircle, Loader, AlertCircle,
  RefreshCw, CheckCircle, Brain, ArrowLeft, Video,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ProcessingStepper from '../components/admin/ai/ProcessingStepper';
import AISermonPreviewCard from '../components/admin/ai/AISermonPreviewCard';
import AIResultEditor from '../components/admin/ai/AIResultEditor';
import AIStatusBadge from '../components/admin/ai/AIStatusBadge';
import { aiUploadFile, triggerAIProcess, getAIJobStatus } from '../api/uploadApi';
import { useToast } from '../context/ToastContext';
// MULTI-CHURCH: church came from the signed-in user.
// import { useAuth } from '../context/AuthContext';
import { CHURCH_NAME } from '../config/church';
import type { SermonJob } from '../types';

type PipelineStep = 'upload' | 'confirm' | 'processing' | 'result';

// Mirrors the backend list — the server converts any of these to MP3 for transcription
const ALLOWED_AUDIO = [
  'audio/mpeg', 'audio/mp3',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac',
  'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/ogg', 'audio/webm',
];
const ALLOWED_DOCS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
// Video: the server extracts the audio track for transcription and the published sermon shows the video
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const POLL_INTERVAL_MS = 2500;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminUploads() {
  const toast = useToast();
  // const { currentUser } = useAuth();

  const [step, setStep] = useState<PipelineStep>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState<SermonJob | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState('');

  const [selectedTitle, setSelectedTitle] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getAIJobStatus(id);
        setJob(res.data);
        if (res.data.status === 'completed') {
          stopPolling();
          setStep('result');
          if (res.data.aiResult.titleSuggestions.length > 0) {
            setSelectedTitle(res.data.aiResult.titleSuggestions[0]);
          }
        } else if (res.data.status === 'failed') {
          stopPolling();
          setProcessError(res.data.errorMessage || 'AI processing failed. Please try again.');
        }
      } catch {
        // keep polling — transient network issue
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const validateFile = (file: File): string => {
    if (![...ALLOWED_AUDIO, ...ALLOWED_VIDEO, ...ALLOWED_DOCS].includes(file.type)) {
      return 'Unsupported file type. Allowed: MP3, M4A, WAV, OGG, AAC audio, MP4/WebM/MOV video, PDF, DOC, DOCX';
    }
    if (file.size > MAX_BYTES) {
      return `File too large (${formatBytes(file.size)}). Maximum is 100 MB`;
    }
    return '';
  };

  const handleFile = async (file: File) => {
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }

    setSelectedFile(file);
    setUploadError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      // MULTI-CHURCH: const church = currentUser?.role !== 'super_admin' ? undefined : undefined;
      const church = CHURCH_NAME;
      const res = await aiUploadFile(file, church, setUploadProgress);
      setJobId(res.jobId);
      setStep('confirm');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setUploadError(msg);
      toast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirmProcess = async () => {
    setProcessError('');
    setProcessing(true);
    try {
      await triggerAIProcess(jobId, userPrompt);
      setStep('processing');

      // Fetch initial job state then start polling
      const res = await getAIJobStatus(jobId);
      setJob(res.data);
      startPolling(jobId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start processing';
      setProcessError(msg);
      toast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!jobId) return;
    setProcessError('');
    setProcessing(true);
    try {
      await triggerAIProcess(jobId, userPrompt);
      const res = await getAIJobStatus(jobId);
      setJob(res.data);
      setStep('processing');
      startPolling(jobId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to retry processing';
      setProcessError(msg);
      toast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setStep('upload');
    setSelectedFile(null);
    setJobId('');
    setJob(null);
    setUserPrompt('');
    setUploadProgress(0);
    setUploadError('');
    setProcessError('');
    setSelectedTitle('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const isAudio = selectedFile ? ALLOWED_AUDIO.includes(selectedFile.type) : false;
  const isVideo = selectedFile ? ALLOWED_VIDEO.includes(selectedFile.type) : false;

  const stepLabels = [
    { key: 'upload', label: 'Upload File' },
    { key: 'confirm', label: 'Add Context' },
    { key: 'processing', label: 'AI Processing' },
    { key: 'result', label: 'Review & Publish' },
  ] as const;
  const currentStepIdx = stepLabels.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Sermon Builder"
        description="Upload audio, video or documents — AI transcribes, structures, and extracts sermon content automatically"
      />

      {/* Progress Steps */}
      <div className="admin-card p-4">
        <div className="flex items-center gap-0">
          {stepLabels.map((s, idx) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                    idx < currentStepIdx
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : idx === currentStepIdx
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-500'
                  }`}
                >
                  {idx < currentStepIdx ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium text-center leading-tight ${
                    idx <= currentStepIdx ? 'text-gray-200' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mb-5 transition-colors ${
                    idx < currentStepIdx ? 'bg-emerald-400' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Upload ─────────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-center">
              <Brain className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">Upload Sermon File</h3>
              <p className="text-xs text-gray-400">Audio, video or document — AI will process it</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              uploading
                ? 'border-indigo-500/40 bg-indigo-500/10 cursor-default'
                : isDragging
                ? 'border-indigo-400 bg-indigo-500/10 cursor-copy scale-[1.01]'
                : 'border-gray-700 hover:border-indigo-400 hover:bg-gray-800/40 cursor-pointer'
            }`}
          >
            {uploading ? (
              <div className="space-y-4 max-w-xs mx-auto">
                <Loader className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-sm font-medium text-indigo-300">
                  Uploading{selectedFile ? ` "${selectedFile.name}"` : ''}…
                </p>
                <div className="h-2 bg-indigo-500/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-500">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  <span className="text-indigo-400 font-semibold">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Audio: MP3, M4A, WAV, OGG &nbsp;·&nbsp; Video: MP4, WebM, MOV &nbsp;·&nbsp; Documents: PDF, DOC, DOCX &nbsp;·&nbsp; Max 100 MB
                </p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-300">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Format hints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 bg-gray-800/40 border border-gray-800 rounded-lg">
              <Music className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-300">Audio Sermon</p>
                <p className="text-xs text-gray-500">MP3 · M4A · WAV · OGG</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-800/40 border border-gray-800 rounded-lg">
              <Video className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-300">Video Sermon</p>
                <p className="text-xs text-gray-500">MP4 · WebM · MOV</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-800/40 border border-gray-800 rounded-lg">
              <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-300">Written Document</p>
                <p className="text-xs text-gray-500">PDF · DOC · DOCX</p>
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.m4a,.aac,.wav,.ogg,audio/*,.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* ── Step 2: Confirm / Add Context ────────────────────────────────────── */}
      {step === 'confirm' && selectedFile && (
        <div className="space-y-4">
          {/* File summary card */}
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isAudio
                    ? 'bg-indigo-500/10 border-indigo-500/25'
                    : isVideo
                    ? 'bg-rose-500/10 border-rose-500/25'
                    : 'bg-emerald-500/10 border-emerald-500/25'
                }`}
              >
                {isAudio ? (
                  <Music className="h-5 w-5 text-indigo-400" />
                ) : isVideo ? (
                  <Video className="h-5 w-5 text-rose-400" />
                ) : (
                  <FileText className="h-5 w-5 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {isAudio ? 'Audio file' : isVideo ? 'Video file · audio will be transcribed' : 'Document'} · {formatBytes(selectedFile.size)}
                </p>
              </div>
              <AIStatusBadge status="uploaded" />
            </div>
          </div>

          {/* Prompt card */}
          <div className="admin-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-100 mb-1">
                Add Context for AI{' '}
                <span className="text-xs font-normal text-gray-500">(optional)</span>
              </h3>
              <p className="text-xs text-gray-400">
                Help the AI understand the sermon better — specify the preacher, series, date, or
                special instructions.
              </p>
            </div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              maxLength={1000}
              className="admin-input w-full resize-none"
              placeholder={`e.g. "Preached by Rev. James Waweru on Easter Sunday 2024. Part of the 'Resurrection Power' series. Focus on extracting practical life application points."`}
            />
            <p className="text-xs text-gray-500 text-right">{userPrompt.length}/1000</p>

            {processError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {processError}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleReset}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Upload different file
              </button>
              <button
                onClick={handleConfirmProcess}
                disabled={processing}
                className="btn-primary flex items-center gap-2"
              >
                {processing ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {processing ? 'Starting…' : 'Process with AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Processing ────────────────────────────────────────────────── */}
      {step === 'processing' && job && (
        <div className="space-y-4">
          <div className="admin-card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-center">
                  <Brain className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">AI is processing your sermon</h3>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{job.originalFileName}</p>
                </div>
              </div>
              <AIStatusBadge status={job.status} />
            </div>

            <ProcessingStepper job={job} />

            {job.status === 'failed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-300">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {job.errorMessage || 'Processing failed. Please try again.'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="btn-ghost flex items-center gap-2 text-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Start over
                  </button>
                  <button
                    onClick={handleRetry}
                    disabled={processing}
                    className="btn-primary flex items-center gap-2"
                  >
                    {processing ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Result Preview + Editor ──────────────────────────────────── */}
      {step === 'result' && job && (
        <div className="space-y-5">
          {/* Header */}
          <div className="admin-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-100">AI Processing Complete</h3>
                <p className="text-xs text-gray-400">{job.originalFileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AIStatusBadge status="completed" />
              <button
                onClick={handleReset}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                New upload
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Left: AI Preview */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-3">
                AI Generated Content
              </h3>
              <AISermonPreviewCard
                job={job}
                selectedTitle={selectedTitle}
                onSelectTitle={setSelectedTitle}
              />
            </div>

            {/* Right: Editor */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-3">
                Publish Sermon
              </h3>
              <div className="admin-card p-5">
                <AIResultEditor
                  job={job}
                  initialTitle={selectedTitle}
                  church={CHURCH_NAME} // MULTI-CHURCH: currentUser?.church?.name
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
