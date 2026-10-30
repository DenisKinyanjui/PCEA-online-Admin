import { useMemo } from 'react';
import { usePreacherProfiles } from '../../hooks/useSermons';
import axiosInstance from '../../api/axiosInstance';
import PreacherPhotoField from './PreacherPhotoField';

interface PreacherSelectorProps {
  preacher: string;
  photoUrl: string;
  fallbackPhotoPreviewUrl?: string;
  onPreacherChange: (preacher: string) => void;
  onPhotoChange: (photoUrl: string) => void;
}

export default function PreacherSelector({
  preacher,
  photoUrl,
  fallbackPhotoPreviewUrl,
  onPreacherChange,
  onPhotoChange,
}: PreacherSelectorProps) {
  const { data: profiles = [], isLoading, isError } = usePreacherProfiles();
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.preacher.trim().toLowerCase() === preacher.trim().toLowerCase()),
    [profiles, preacher],
  );
  const photoPreviewUrl = selectedProfile?.preacherPhotoPath
    ? `${axiosInstance.defaults.baseURL}${selectedProfile.preacherPhotoPath}`
    : fallbackPhotoPreviewUrl ?? selectedProfile?.preacherPhotoUrl;

  const handlePreacherChange = (value: string) => {
    onPreacherChange(value);
    const matchedProfile = profiles.find(
      (profile) => profile.preacher.trim().toLowerCase() === value.trim().toLowerCase(),
    );
    onPhotoChange(matchedProfile?.preacherPhotoUrl ?? '');
  };

  return (
    <div className="space-y-2">
      <label className="admin-label" htmlFor="sermon-preacher">Preacher <span className="text-red-400">*</span></label>
      <select
        value={selectedProfile?.preacher ?? (preacher ? '__new__' : '')}
        onChange={(event) => {
          if (event.target.value === '__new__') {
            handlePreacherChange('');
            return;
          }
          const profile = profiles.find((item) => item.preacher === event.target.value);
          handlePreacherChange(profile?.preacher ?? '');
        }}
        className="admin-select"
        aria-label="Choose an existing preacher or add a new one"
      >
        <option value="">Select an existing preacher or add new</option>
        {profiles.map((profile) => (
          <option key={profile.preacher} value={profile.preacher}>{profile.preacher}</option>
        ))}
        <option value="__new__">Add a new preacher</option>
      </select>

      <input
        id="sermon-preacher"
        value={preacher}
        onChange={(event) => handlePreacherChange(event.target.value)}
        placeholder="e.g. Rev. James Kariuki"
        className="admin-input"
      />
      {isLoading && <p className="text-xs text-gray-500">Loading existing preachers…</p>}
      {isError && (
        <p className="text-xs text-amber-400" role="status">
          Could not load existing preachers. You can still enter a name manually.
        </p>
      )}
      {selectedProfile?.preacherPhotoUrl && photoUrl && (
        <p className="text-xs text-emerald-400">Saved profile photo will be reused.</p>
      )}
      <PreacherPhotoField
        value={photoUrl}
        previewUrl={photoPreviewUrl}
        onChange={onPhotoChange}
      />
    </div>
  );
}
