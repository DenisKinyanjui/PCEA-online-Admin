import { useQuery } from '@tanstack/react-query';
import { fetchSermons, fetchSermon, fetchSermonMeta } from '../api/sermonApi';
import type { SermonFilters } from '../types';

export function useSermons(filters: SermonFilters = {}) {
  return useQuery({
    queryKey: ['admin-sermons', filters],
    queryFn: () => fetchSermons(filters),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });
}

export function useSermon(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-sermon', id],
    queryFn: () => fetchSermon(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSermonMeta() {
  return useQuery({
    queryKey: ['admin-sermon-meta'],
    queryFn: fetchSermonMeta,
    staleTime: 1000 * 60 * 10,
  });
}
