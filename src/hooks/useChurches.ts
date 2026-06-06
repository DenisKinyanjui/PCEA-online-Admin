import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllChurches, fetchChurch, createChurch, updateChurch, deleteChurch } from '../api/churchApi';
import type { CreateChurchInput } from '../types';

export function useChurches(activeOnly = false) {
  return useQuery({
    queryKey: ['admin-churches', activeOnly],
    queryFn: () => fetchAllChurches(activeOnly),
    staleTime: 1000 * 60 * 5,
  });
}

export function useChurch(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-church', id],
    queryFn: () => fetchChurch(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateChurch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChurchInput) => createChurch(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-churches'] }),
  });
}

export function useUpdateChurch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateChurchInput>) => updateChurch(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-churches'] });
      qc.invalidateQueries({ queryKey: ['admin-church', id] });
    },
  });
}

export function useDeleteChurch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChurch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-churches'] }),
  });
}
