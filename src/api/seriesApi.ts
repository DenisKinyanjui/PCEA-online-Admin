import axiosInstance from './axiosInstance';
import type { ApiSeries, SeriesListResponse, CreateSeriesInput } from '../types';

export async function fetchAllSeries(church?: string): Promise<SeriesListResponse> {
  const params = church ? { church } : {};
  const { data } = await axiosInstance.get<SeriesListResponse>('/series', { params });
  return data;
}

export async function createSeries(payload: CreateSeriesInput): Promise<ApiSeries> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiSeries }>('/series', payload);
  return data.data;
}

export async function updateSeries(id: string, payload: Partial<CreateSeriesInput>): Promise<ApiSeries> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiSeries }>(`/series/${id}`, payload);
  return data.data;
}

export async function deleteSeries(id: string): Promise<void> {
  await axiosInstance.delete(`/series/${id}`);
}
