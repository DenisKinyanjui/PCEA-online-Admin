import axiosInstance from './axiosInstance';
import type { ApiChurch, ChurchListResponse, CreateChurchInput } from '../types';

export async function fetchAllChurches(activeOnly = false): Promise<ChurchListResponse> {
  const params = activeOnly ? { active: 'true' } : {};
  const { data } = await axiosInstance.get<ChurchListResponse>('/churches', { params });
  return data;
}

export async function fetchChurch(id: string): Promise<ApiChurch> {
  const { data } = await axiosInstance.get<{ success: boolean; data: ApiChurch }>(`/churches/${id}`);
  return data.data;
}

export async function createChurch(payload: CreateChurchInput): Promise<ApiChurch> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiChurch }>('/churches', payload);
  return data.data;
}

export async function updateChurch(id: string, payload: Partial<CreateChurchInput>): Promise<ApiChurch> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiChurch }>(`/churches/${id}`, payload);
  return data.data;
}

export async function deleteChurch(id: string): Promise<void> {
  await axiosInstance.delete(`/churches/${id}`);
}
