import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSermon, updateSermon, deleteSermon } from '../api/sermonApi';
import type { CreateSermonInput } from '../types';

export function useCreateSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSermonInput) => createSermon(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sermons'] }),
  });
}

export function useUpdateSermon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateSermonInput>) => updateSermon(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sermons'] });
      qc.invalidateQueries({ queryKey: ['admin-sermon', id] });
    },
  });
}

export function useDeleteSermon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSermon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sermons'] }),
  });
}
