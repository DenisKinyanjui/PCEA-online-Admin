import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, FileText, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteHeroImage,
  deleteAboutImage,
  fetchManagedContent,
  saveAboutHeroImages,
  saveAboutContent,
  uploadAboutImage,
  uploadHeroImage,
  type ContentSection,
  type ManagedSiteContent,
} from '../api/contentApi';
import { useToast } from '../context/ToastContext';

const emptySection = (): ContentSection => ({ title: '', body: '', items: [], closing: '' });

export default function AdminContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['managed-site-content'],
    queryFn: fetchManagedContent,
  });
  if (isLoading) {
    return <div className="max-w-4xl animate-pulse space-y-4"><div className="h-8 bg-gray-800 rounded w-48" /><div className="admin-card h-64" /></div>;
  }

  if (isError || !data) {
    return <p className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">{error instanceof Error ? error.message : 'Could not load site content.'}</p>;
  }

  return <ContentEditor key={data.aboutHeroImageIds.join('|')} data={data} />;
}

function ContentEditor({ data }: { data: ManagedSiteContent }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<'home' | 'about' | null>(null);
  const [intro, setIntro] = useState(data.about.intro);
  const [selectedAboutHeroImageIds, setSelectedAboutHeroImageIds] = useState(data.aboutHeroImageIds);
  const [sections, setSections] = useState<ContentSection[]>(
    () => data.about.sections.map((section) => ({ ...section, items: [...section.items] })),
  );

  const saveMutation = useMutation({
    mutationFn: () => saveAboutContent({ intro, sections }),
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast('About page content saved.', 'success');
    },
    onError: () => toast('Could not save About page content.', 'error'),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadHeroImage,
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast('Hero image uploaded.', 'success');
    },
    onError: () => toast('Could not upload hero image.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHeroImage,
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast('Hero image deleted.', 'success');
    },
    onError: () => toast('Could not delete hero image.', 'error'),
  });

  const saveAboutImagesMutation = useMutation({
    mutationFn: () => saveAboutHeroImages(selectedAboutHeroImageIds),
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      setSelectedAboutHeroImageIds(content.aboutHeroImageIds);
      toast('About page images saved.', 'success');
    },
    onError: () => toast('Could not save About page images.', 'error'),
  });

  const uploadAboutImageMutation = useMutation({
    mutationFn: uploadAboutImage,
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast('About page image uploaded.', 'success');
    },
    onError: () => toast('Could not upload About page image.', 'error'),
  });

  const deleteAboutImageMutation = useMutation({
    mutationFn: deleteAboutImage,
    onSuccess: (content) => {
      queryClient.setQueryData(['managed-site-content'], content);
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast('About page image deleted.', 'success');
    },
    onError: () => toast('Could not delete About page image.', 'error'),
  });

  const setSection = (index: number, update: Partial<ContentSection>) => {
    setSections((current) => current.map((section, i) => i === index ? { ...section, ...update } : section));
  };

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) uploadMutation.mutate(file);
  };

  const handleAboutImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) uploadAboutImageMutation.mutate(file);
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <div className="max-w-5xl space-y-10">
      {selectedSection === null ? (
        <>
          <header className="pb-6 border-b border-gray-800">
            <h1 className="text-xl font-semibold text-gray-100 tracking-tight">Site Content</h1>
            <p className="text-sm text-gray-500 mt-1">Choose which page content you want to manage.</p>
          </header>
          <div className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedSection('home')}
              className="admin-card group p-6 text-left transition-colors hover:border-sky-500/50 hover:bg-gray-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <ImagePlus className="mb-4 h-6 w-6 text-sky-400" />
              <h2 className="text-base font-semibold text-gray-100">Home / Hero</h2>
              <p className="mt-2 text-sm text-gray-400">
                Add or remove the images shown in the home page hero. {data.heroImages.length} {data.heroImages.length === 1 ? 'image' : 'images'} uploaded.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSection('about')}
              className="admin-card group p-6 text-left transition-colors hover:border-sky-500/50 hover:bg-gray-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <FileText className="mb-4 h-6 w-6 text-sky-400" />
              <h2 className="text-base font-semibold text-gray-100">About Us</h2>
              <p className="mt-2 text-sm text-gray-400">
                Edit the church history and About page sections, including Mission, Vision, District, Give, and Join Us.
              </p>
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="flex items-start gap-4 border-b border-gray-800 pb-6">
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              aria-label="Back to site content sections"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-100 tracking-tight">
                {selectedSection === 'home' ? 'Home / Hero' : 'About Us'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {selectedSection === 'home'
                  ? 'Manage the images displayed in the home page hero.'
                  : 'Manage the history and sections displayed on the About page.'}
              </p>
            </div>
          </header>
        </>
      )}

      {selectedSection === 'home' && <section>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-medium text-gray-200">Hero images</h2>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WEBP, up to 5 MB each; up to 20 images.</p>
          </div>
          <label className={`btn-primary cursor-pointer ${uploadMutation.isPending || data.heroImages.length >= 20 ? 'opacity-50 pointer-events-none' : ''}`}>
            <ImagePlus size={16} />
            {uploadMutation.isPending ? 'Uploading…' : 'Add image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleImage}
              disabled={uploadMutation.isPending || data.heroImages.length >= 20}
            />
          </label>
        </div>
        {data.heroImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 px-6 py-12 text-center text-sm text-gray-500">
            No hero images yet. Add an image to show it on the home page.
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.heroImages.map((image) => (
              <li key={image._id} className="admin-card overflow-hidden">
                <img src={image.src.startsWith('/content/') ? `${apiBase}${image.src}` : image.src} alt={image.originalName} className="h-40 w-full object-contain bg-gray-950" />
                <div className="flex items-center gap-2 p-3">
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-400" title={image.originalName}>{image.originalName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete hero image "${image.originalName}"?`)) deleteMutation.mutate(image._id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    aria-label={`Delete ${image.originalName}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>}

      {selectedSection === 'about' && <>
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3">
            <div>
              <h2 className="text-sm font-medium text-gray-200">About page images</h2>
              <p className="mt-1 text-xs text-gray-500">Choose specific Home / Hero images or upload images used only on the About page. Up to 20 images total.</p>
            </div>
            <label className={`btn-primary cursor-pointer ${uploadAboutImageMutation.isPending || selectedAboutHeroImageIds.length + data.aboutUploadedImages.length >= 20 ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImagePlus size={16} />
              {uploadAboutImageMutation.isPending ? 'Uploading…' : 'Upload About image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAboutImage}
                disabled={uploadAboutImageMutation.isPending || selectedAboutHeroImageIds.length + data.aboutUploadedImages.length >= 20}
              />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-gray-300">Select from Home / Hero</h3>
              <button
                type="button"
                onClick={() => saveAboutImagesMutation.mutate()}
                disabled={saveAboutImagesMutation.isPending}
                className="btn-secondary"
              >
                <Save size={15} /> {saveAboutImagesMutation.isPending ? 'Saving…' : 'Save image selection'}
              </button>
            </div>
            {data.heroImages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-800 px-5 py-8 text-center text-sm text-gray-500">No Home / Hero images available to select.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.heroImages.map((image) => {
                  const isSelected = selectedAboutHeroImageIds.includes(image._id);
                  const selectionLimitReached = selectedAboutHeroImageIds.length + data.aboutUploadedImages.length >= 20;
                  return (
                    <li key={image._id} className="admin-card overflow-hidden">
                      <img src={image.src} alt={image.originalName} className="h-36 w-full object-contain bg-gray-950" />
                      <label className="flex cursor-pointer items-center gap-2 p-3 text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isSelected && selectionLimitReached}
                          onChange={(event) => {
                            setSelectedAboutHeroImageIds((current) => event.target.checked
                              ? [...current, image._id]
                              : current.filter((id) => id !== image._id));
                          }}
                          className="accent-sky-500"
                        />
                        <span className="min-w-0 truncate" title={image.originalName}>{image.originalName}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {data.aboutUploadedImages.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-300">About-only images</h3>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.aboutUploadedImages.map((image) => (
                  <li key={image._id} className="admin-card overflow-hidden">
                    <img src={image.src} alt={image.originalName} className="h-36 w-full object-contain bg-gray-950" />
                    <div className="flex items-center gap-2 p-3">
                      <span className="min-w-0 flex-1 truncate text-xs text-gray-400" title={image.originalName}>{image.originalName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete About page image "${image.originalName}"?`)) {
                            deleteAboutImageMutation.mutate(image._id);
                          }
                        }}
                        disabled={deleteAboutImageMutation.isPending}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        aria-label={`Delete ${image.originalName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <form onSubmit={handleSave} className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-sm font-medium text-gray-200">About page</h2>
            <p className="text-xs text-gray-500 mt-1">Manage the church history and the Mission, Vision, District, Give, and Join Us sections.</p>
          </div>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-shrink-0">
            <Save size={15} /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-gray-400">Church history</span>
          <textarea value={intro} onChange={(event) => setIntro(event.target.value)} rows={3} maxLength={5000} className="admin-input w-full resize-y" />
        </label>

        {sections.map((section, index) => (
          <fieldset key={section._id ?? `section-${index}`} className="admin-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <input
                value={section.title}
                onChange={(event) => setSection(index, { title: event.target.value })}
                placeholder="Section title"
                maxLength={120}
                required
                className="admin-input min-w-0 flex-1"
              />
              <button type="button" onClick={() => setSections((current) => current.filter((_, i) => i !== index))} className="rounded p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${section.title || 'section'}`}>
                <Trash2 size={15} />
              </button>
            </div>
            <textarea value={section.body} onChange={(event) => setSection(index, { body: event.target.value })} placeholder="Section text" rows={3} maxLength={5000} className="admin-input w-full resize-y" />
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-500">List items (one per line)</span>
              <textarea
                value={section.items.join('\n')}
                onChange={(event) => setSection(index, { items: event.target.value.split('\n').slice(0, 30) })}
                rows={3}
                className="admin-input w-full resize-y"
              />
            </label>
            <input value={section.closing} onChange={(event) => setSection(index, { closing: event.target.value })} placeholder="Optional closing text" maxLength={2000} className="admin-input w-full" />
          </fieldset>
        ))}

        <button type="button" onClick={() => setSections((current) => [...current, emptySection()])} className="btn-secondary">
          <Plus size={15} /> Add section
        </button>
        </form>
      </>}
    </div>
  );
}
