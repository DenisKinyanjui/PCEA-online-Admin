import axiosInstance from './axiosInstance';
import type { UploadAudioResponse, UploadAttachmentResponse } from '../types';

export async function uploadAudio(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadAudioResponse> {
  const form = new FormData();
  form.append('audio', file);
  const { data } = await axiosInstance.post<UploadAudioResponse>('/uploads/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

export async function uploadAttachment(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadAttachmentResponse> {
  const form = new FormData();
  form.append('attachment', file);
  const { data } = await axiosInstance.post<UploadAttachmentResponse>('/uploads/attachment', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}
