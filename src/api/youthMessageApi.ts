import axiosInstance from './axiosInstance';
import type { ApiYouthMessage, YouthMessageInput } from '../types';

export async function fetchYouthMessages(): Promise<{ total: number; data: ApiYouthMessage[] }> {
  const { data } = await axiosInstance.get<{ success: boolean; total: number; data: ApiYouthMessage[] }>(
    '/youth-messages/manage',
  );
  return data;
}

export async function fetchYouthMessage(id: string): Promise<ApiYouthMessage> {
  const { data } = await axiosInstance.get<{ success: boolean; data: ApiYouthMessage }>(`/youth-messages/manage/${id}`);
  return data.data;
}

export async function createYouthMessage(input: YouthMessageInput): Promise<ApiYouthMessage> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiYouthMessage }>('/youth-messages', input);
  return data.data;
}

export async function updateYouthMessage(id: string, input: YouthMessageInput): Promise<ApiYouthMessage> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiYouthMessage }>(`/youth-messages/${id}`, input);
  return data.data;
}

export async function deleteYouthMessage(id: string): Promise<void> {
  await axiosInstance.delete(`/youth-messages/${id}`);
}
