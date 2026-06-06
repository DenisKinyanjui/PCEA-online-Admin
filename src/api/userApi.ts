import axiosInstance from './axiosInstance';
import type { ApiAdminUser, UserListResponse, CreateUserInput, UpdateUserInput } from '../types';

export async function fetchUsers(): Promise<UserListResponse> {
  const { data } = await axiosInstance.get<UserListResponse>('/users');
  return data;
}

export async function createUser(payload: CreateUserInput): Promise<ApiAdminUser> {
  const { data } = await axiosInstance.post<{ success: boolean; data: ApiAdminUser }>('/users', payload);
  return data.data;
}

export async function updateUser(id: string, payload: UpdateUserInput): Promise<ApiAdminUser> {
  const { data } = await axiosInstance.put<{ success: boolean; data: ApiAdminUser }>(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axiosInstance.delete(`/users/${id}`);
}
