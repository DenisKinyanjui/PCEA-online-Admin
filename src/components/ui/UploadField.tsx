import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, CheckCircle, XCircle, Loader, X } from 'lucide-react';
import { uploadAudio, uploadAttachment } from '../../api/uploadApi';

interface UploadFieldProps {
  type: 'audio' | 'attachment';
  onUploadComplete: (url: string, meta?: { originalName?: string; fileType?: string }) => void;
  label?: string;
}

export default function UploadField({ type, onUploadComplete, label }: UploadFieldProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedName, setUploadedName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'audio'
    ? '.mp3,.mp4,.wav,.ogg,audio/*'
    : '.pdf,.doc,.docx,application/pdf,application/msword';

  const handleFile = async (file: File) => {
    setStatus('uploading');
    setProgress(0);
    setError('');
    try {
      if (type === 'audio') {
        const res = await uploadAudio(file, setProgress);
        setUploadedName(file.name);
        onUploadComplete(res.url);
      } else {
        const res = await uploadAttachment(file, setProgress);
        setUploadedName(res.originalName);
        onUploadComplete(res.url, { originalName: res.originalName, fileType: res.fileType });
      }
      setStatus('success');
    } catch {
      setError('Upload failed. Please try again.');
      setStatus('error');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => { setStatus('idle'); setUploadedName(''); setError(''); setProgress(0); };

  return (
    <div>
      {label && <label className="admin-label">{label}</label>}

      {status === 'success' ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 flex-1 truncate font-medium">{uploadedName}</p>
          <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {status === 'uploading' ? (
            <div className="space-y-3">
              <Loader className="h-6 w-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Uploading… {progress}%</p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {type === 'audio' ? 'MP3, MP4, WAV, OGG (max 100 MB)' : 'PDF, DOC, DOCX (max 100 MB)'}
              </p>
            </>
          )}
          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2 justify-center text-red-500">
              <XCircle className="h-4 w-4" />
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
