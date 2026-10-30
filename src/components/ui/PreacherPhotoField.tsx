import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Loader, Upload, X } from 'lucide-react';
import { uploadPreacherPhoto } from '../../api/uploadApi';

interface PreacherPhotoFieldProps {
  value: string;
  previewUrl?: string;
  onChange: (url: string) => void;
}

export default function PreacherPhotoField({ value, previewUrl, onChange }: PreacherPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The profile photo must be 5 MB or smaller.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const response = await uploadPreacherPhoto(file);
      setLocalPreviewUrl(URL.createObjectURL(file));
      onChange(response.url);
    } catch (uploadError: unknown) {
      const message = (uploadError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="admin-label">Preacher Profile Photo</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img
            src={localPreviewUrl || previewUrl || value}
            alt="Preacher profile preview"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span
            className="h-16 w-16 rounded-full flex items-center justify-center bg-gray-800 text-gray-400"
            aria-hidden="true"
          >
            Photo
          </span>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-xs"
          >
            {uploading ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : value ? 'Change photo' : 'Add photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setLocalPreviewUrl(''); setError(''); }}
              disabled={uploading}
              className="btn-ghost text-xs"
              aria-label="Remove preacher profile photo"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WEBP · maximum 5 MB</p>
      {error && <p className="text-xs text-red-400 mt-1" role="alert">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
