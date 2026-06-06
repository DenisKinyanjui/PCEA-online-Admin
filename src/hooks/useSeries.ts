import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllSeries, createSeries, updateSeries, deleteSeries } from '../api/seriesApi';
import type { CreateSeriesInput } from '../types';

export function useSeries(church?: string) {
  return useQuery({
    queryKey: ['admin-series', church],
    queryFn: () => fetchAllSeries(church),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSeriesInput) => createSeries(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-series'] }),
  });
}

export function useUpdateSeries(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateSeriesInput>) => updateSeries(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-series'] }),
  });
}

export function useDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSeries(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-series'] }),
  });
}
