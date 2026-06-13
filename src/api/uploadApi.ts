import axiosInstance from './axiosInstance';
import type {
  UploadAudioResponse,
  UploadAttachmentResponse,
  AIUploadResponse,
  AIProcessResponse,
  AIStatusResponse,
  CreateSermonFromAIInput,
  ApiSermon,
} from '../types';

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

// ── AI Pipeline ───────────────────────────────────────────────────────────────

export async function aiUploadFile(
  file: File,
  church?: string,
  onProgress?: (pct: number) => void
): Promise<AIUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  if (church) form.append('church', church);
  const { data } = await axiosInstance.post<AIUploadResponse>('/uploads/ai-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

export async function triggerAIProcess(
  jobId: string,
  userPrompt?: string
): Promise<AIProcessResponse> {
  const { data } = await axiosInstance.post<AIProcessResponse>('/uploads/ai-process', {
    jobId,
    userPrompt: userPrompt ?? '',
  });
  return data;
}

export async function getAIJobStatus(jobId: string): Promise<AIStatusResponse> {
  const { data } = await axiosInstance.get<AIStatusResponse>(`/uploads/status/${jobId}`);
  return data;
}

export async function createSermonFromAI(
  input: CreateSermonFromAIInput
): Promise<{ success: boolean; data: ApiSermon }> {
  const { data } = await axiosInstance.post('/sermons/from-ai', input);
  return data;
}
