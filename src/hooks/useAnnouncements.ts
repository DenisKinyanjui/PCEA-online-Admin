import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnnouncements, fetchAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} from '../api/announcementApi';
import type { AnnouncementInput } from '../types';

export function useAnnouncements() {
  return useQuery({
    queryKey: ['admin-announcements'],
    queryFn: fetchAnnouncements,
    staleTime: 1000 * 60,
  });
}

export function useAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-announcement', id],
    queryFn: () => fetchAnnouncement(id!),
    enabled: Boolean(id),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => createAnnouncement(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });
}

export function useUpdateAnnouncement(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AnnouncementInput>) => updateAnnouncement(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      qc.invalidateQueries({ queryKey: ['admin-announcement', id] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });
}
