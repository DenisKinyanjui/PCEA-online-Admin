import { useState } from 'react';
import { Copy, CheckCircle, Upload, Music, FileText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import UploadField from '../components/ui/UploadField';

interface UploadedItem {
  url: string;
  name: string;
  type: 'audio' | 'attachment';
  copied: boolean;
}

export default function AdminUploads() {
  const [uploads, setUploads] = useState<UploadedItem[]>([]);

  const handleUploadComplete = (
    url: string,
    type: 'audio' | 'attachment',
    meta?: { originalName?: string }
  ) => {
    setUploads((prev) => [
      { url, name: meta?.originalName ?? url.split('/').pop() ?? url, type, copied: false },
      ...prev,
    ]);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setUploads((prev) => prev.map((u) => u.url === url ? { ...u, copied: true } : u));
    setTimeout(() => setUploads((prev) => prev.map((u) => u.url === url ? { ...u, copied: false } : u)), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uploads"
        description="Upload audio files and attachments for your sermons"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center">
              <Music className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Audio Upload</h3>
              <p className="text-xs text-gray-500">MP3, MP4, WAV, OGG — max 100 MB</p>
            </div>
          </div>
          <UploadField type="audio" onUploadComplete={(url, meta) => handleUploadComplete(url, 'audio', meta)} />
        </div>

        {/* Attachment */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Attachment Upload</h3>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX — max 100 MB</p>
            </div>
          </div>
          <UploadField type="attachment" onUploadComplete={(url, meta) => handleUploadComplete(url, 'attachment', meta)} />
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="admin-card">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-500" />
              Uploaded this session
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Copy the URL to use in a sermon form</p>
          </div>
          <div className="divide-y divide-gray-100">
            {uploads.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'audio'
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  {item.type === 'audio'
                    ? <Music className="h-3.5 w-3.5 text-indigo-600" />
                    : <FileText className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate">{item.url}</p>
                </div>
                <button
                  onClick={() => copyUrl(item.url)}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    item.copied
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Copy URL"
                >
                  {item.copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
