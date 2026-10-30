import axiosInstance from './axiosInstance';

export interface MemberDistrict {
  id: string;
  name: string;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  district: MemberDistrict | null;
  location: string;
  createdAt: string;
}

export interface MemberDistrictOption {
  _id: string;
  name: string;
  elderName: string;
  deacons: string[];
}

export interface DistrictInput {
  name: string;
  elderName: string;
  deacons: string[];
}

export interface MemberUpdateInput {
  name: string;
  email: string;
  districtId: string | null;
}

export async function fetchAdminMembers(): Promise<AdminMember[]> {
  const { data } = await axiosInstance.get<{ success: boolean; data: AdminMember[] }>('/members/admin');
  return data.data;
}

export async function fetchMemberDistricts(): Promise<MemberDistrictOption[]> {
  const { data } = await axiosInstance.get<{ success: boolean; data: MemberDistrictOption[] }>('/districts/manage');
  return data.data;
}

export async function createDistrict(input: DistrictInput): Promise<MemberDistrictOption> {
  const { data } = await axiosInstance.post<{ success: boolean; data: MemberDistrictOption }>('/districts', input);
  return data.data;
}

export async function updateDistrict(id: string, input: DistrictInput): Promise<MemberDistrictOption> {
  const { data } = await axiosInstance.put<{ success: boolean; data: MemberDistrictOption }>(
    `/districts/${id}`,
    input
  );
  return data.data;
}

export async function deleteDistrict(id: string): Promise<void> {
  await axiosInstance.delete(`/districts/${id}`);
}

export async function updateMember(id: string, input: MemberUpdateInput): Promise<void> {
  await axiosInstance.put(`/members/admin/${id}`, input);
}

export async function deleteMember(id: string): Promise<void> {
  await axiosInstance.delete(`/members/admin/${id}`);
}
