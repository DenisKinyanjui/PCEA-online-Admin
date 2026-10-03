import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchYouthMessages, fetchYouthMessage, createYouthMessage, updateYouthMessage, deleteYouthMessage,
} from '../api/youthMessageApi';
import type { YouthMessageInput } from '../types';

export function useYouthMessages() {
  return useQuery({
    queryKey: ['admin-youth-messages'],
    queryFn: fetchYouthMessages,
    staleTime: 1000 * 60,
  });
}

export function useYouthMessage(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-youth-message', id],
    queryFn: () => fetchYouthMessage(id!),
    enabled: Boolean(id),
  });
}

export function useCreateYouthMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: YouthMessageInput) => createYouthMessage(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-youth-messages'] }),
  });
}

export function useUpdateYouthMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: YouthMessageInput) => updateYouthMessage(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-youth-messages'] });
      qc.invalidateQueries({ queryKey: ['admin-youth-message', id] });
    },
  });
}

export function useDeleteYouthMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteYouthMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-youth-messages'] }),
  });
}
