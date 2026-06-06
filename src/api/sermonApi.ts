import axiosInstance from './axiosInstance';
import type {
  ApiSermon,
  SermonsResponse,
  SermonFilters,
  SermonMetaData,
  CreateSermonInput,
} from '../types';

export async function fetchSermons(filters: SermonFilters = {}): Promise<SermonsResponse> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.preacher) params.preacher = filters.preacher;
  if (filters.church) params.church = filters.church;
  if (filters.year) params.year = filters.year;
  if (filters.series) params.series = filters.series;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const { data } = await axiosInstance.get<SermonsResponse>('/sermons', { params });
  return data;
}

export async function fetchSermon(id: string): Promise<ApiSermon> {
  const { data } = await axiosInstance.get<{ success: boolean; data: ApiSermon }>(`/sermons/${id}`);
  return data.data;
}

export async function fetchSermonMeta(): Promise<SermonMetaData> {
  const { data } = await axiosInstance.get<{ success: boolean; data: SermonMetaData }>('/sermons/meta');
  return data.data;
}

export async function createSermon(payload: CreateSermonInput): Promise<ApiSermon> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiSermon }>('/sermons', payload);
  return data.data;
}

export async function updateSermon(id: string, payload: Partial<CreateSermonInput>): Promise<ApiSermon> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiSermon }>(`/sermons/${id}`, payload);
  return data.data;
}

export async function deleteSermon(id: string): Promise<void> {
  await axiosInstance.delete(`/sermons/${id}`);
}
