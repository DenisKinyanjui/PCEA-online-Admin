import axiosInstance from './axiosInstance';

export interface ContentSection {
  _id?: string;
  title: string;
  body: string;
  items: string[];
  closing: string;
}

export interface ManagedSiteContent {
  heroImages: { _id: string; src: string; originalName: string; mimeType: string }[];
  aboutHeroImageIds: string[];
  aboutUploadedImages: { _id: string; src: string; originalName: string; mimeType: string }[];
  aboutImages: { _id: string; src: string; originalName: string; mimeType: string }[];
  about: { intro: string; sections: ContentSection[] };
}

const contentPath = (src: string) =>
  src.startsWith('/content/') ? `${axiosInstance.defaults.baseURL}${src}` : src;

function normalizeContent(content: ManagedSiteContent): ManagedSiteContent {
  return {
    ...content,
    heroImages: content.heroImages.map((image) => ({ ...image, src: contentPath(image.src) })),
    aboutUploadedImages: content.aboutUploadedImages.map((image) => ({ ...image, src: contentPath(image.src) })),
    aboutImages: content.aboutImages.map((image) => ({ ...image, src: contentPath(image.src) })),
  };
}

export async function fetchManagedContent(): Promise<ManagedSiteContent> {
  const { data } = await axiosInstance.get<{ success: boolean; data: ManagedSiteContent }>('/content/manage');
  return normalizeContent(data.data);
}

export async function saveAboutContent(about: ManagedSiteContent['about']): Promise<ManagedSiteContent> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ManagedSiteContent }>(
    '/content/manage/about',
    { about },
  );
  return normalizeContent(data.data);
}

export async function uploadHeroImage(file: File): Promise<ManagedSiteContent> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axiosInstance.post<{ success: boolean; data: ManagedSiteContent }>(
    '/content/manage/hero-images',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return normalizeContent(data.data);
}

export async function deleteHeroImage(id: string): Promise<ManagedSiteContent> {
  const { data } = await axiosInstance.delete<{ success: boolean; data: ManagedSiteContent }>(
    `/content/manage/hero-images/${id}`,
  );
  return normalizeContent(data.data);
}

export async function saveAboutHeroImages(imageIds: string[]): Promise<ManagedSiteContent> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ManagedSiteContent }>(
    '/content/manage/about/hero-images',
    { imageIds },
  );
  return normalizeContent(data.data);
}

export async function uploadAboutImage(file: File): Promise<ManagedSiteContent> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await axiosInstance.post<{ success: boolean; data: ManagedSiteContent }>(
    '/content/manage/about/images',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return normalizeContent(data.data);
}

export async function deleteAboutImage(id: string): Promise<ManagedSiteContent> {
  const { data } = await axiosInstance.delete<{ success: boolean; data: ManagedSiteContent }>(
    `/content/manage/about/images/${id}`,
  );
  return normalizeContent(data.data);
}
