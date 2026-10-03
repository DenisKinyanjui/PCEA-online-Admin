import axiosInstance from './axiosInstance';
import type { AnnouncementInput, AnnouncementListResponse, ApiAnnouncement } from '../types';

/** Absolute URL for a poster, built from the API-relative `imagePath`. */
export function announcementImageUrl(imagePath: string | null): string | null {
  return imagePath ? `${import.meta.env.VITE_API_URL}${imagePath}` : null;
}

function toFormData(input: Partial<AnnouncementInput>): FormData {
  const form = new FormData();
  if (input.title !== undefined) form.append('title', input.title);
  if (input.description !== undefined) form.append('description', input.description);
  if (input.expiresAt !== undefined) form.append('expiresAt', input.expiresAt);
  if (input.church) form.append('church', input.church);
  if (input.image) form.append('image', input.image);
  if (input.removeImage) form.append('removeImage', 'true');
  return form;
}

// Poster uploads can take longer than the default 20s timeout
const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 };

export async function fetchAnnouncements(): Promise<AnnouncementListResponse> {
  const { data } = await axiosInstance.get<AnnouncementListResponse>('/announcements/manage');
  return data;
}

export async function fetchAnnouncement(id: string): Promise<ApiAnnouncement> {
  const { data } = await axiosInstance.get<{ success: boolean; data: ApiAnnouncement }>(`/announcements/manage/${id}`);
  return data.data;
}

export async function createAnnouncement(input: AnnouncementInput): Promise<ApiAnnouncement> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiAnnouncement }>(
    '/announcements', toFormData(input), uploadConfig,
  );
  return data.data;
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>): Promise<ApiAnnouncement> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiAnnouncement }>(
    `/announcements/${id}`, toFormData(input), uploadConfig,
  );
  return data.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await axiosInstance.delete(`/announcements/${id}`);
}
