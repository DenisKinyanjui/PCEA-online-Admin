import axiosInstance from './axiosInstance';
import type { AuthUser } from '../types';

export async function login(email: string, password: string) {
  const { data } = await axiosInstance.post<{ success: boolean; token: string; user: AuthUser }>(
    '/auth/login',
    { email, password }
  );
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<{ success: boolean; user: AuthUser }>('/auth/me');
  return data.user;
}
