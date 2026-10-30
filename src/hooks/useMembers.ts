import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteMember,
  createDistrict,
  deleteDistrict,
  fetchAdminMembers,
  fetchMemberDistricts,
  updateMember,
  updateDistrict,
  type MemberUpdateInput,
  type DistrictInput,
} from '../api/memberApi';

export function useAdminMembers() {
  return useQuery({ queryKey: ['admin-members'], queryFn: fetchAdminMembers });
}

export function useMemberDistricts() {
  return useQuery({ queryKey: ['member-districts'], queryFn: fetchMemberDistricts });
}

export function useCreateDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDistrict,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-districts'] }),
  });
}

export function useUpdateDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DistrictInput }) => updateDistrict(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-districts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
  });
}

export function useDeleteDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-districts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemberUpdateInput }) => updateMember(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members'] }),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members'] }),
  });
}
