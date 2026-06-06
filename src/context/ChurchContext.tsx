import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useChurches } from '../hooks/useChurches';
import type { ApiChurch } from '../types';

interface ChurchContextValue {
  selectedChurch: ApiChurch | null;
  setSelectedChurch: (church: ApiChurch | null) => void;
  churches: ApiChurch[];
  isSuperAdmin: boolean;
  /** The church name to use for API filtering. null = no filter (super_admin all-churches view). */
  churchFilter: string | undefined;
}

const ChurchContext = createContext<ChurchContextValue | null>(null);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Super admins can switch between churches; others are locked to their own.
  const [superAdminSelected, setSuperAdminSelected] = useState<ApiChurch | null>(null);

  const { data: churchData } = useChurches();
  const churches = churchData?.data ?? [];

  const selectedChurch = useMemo(() => {
    if (isSuperAdmin) return superAdminSelected;
    if (currentUser?.church) {
      // Find the full Church object matching the user's church
      return churches.find((c) => c._id === currentUser.church?.id) ?? null;
    }
    return null;
  }, [isSuperAdmin, superAdminSelected, currentUser, churches]);

  const setSelectedChurch = (church: ApiChurch | null) => {
    if (isSuperAdmin) setSuperAdminSelected(church);
  };

  const churchFilter = selectedChurch?.name ?? (isSuperAdmin ? undefined : currentUser?.church?.name);

  return (
    <ChurchContext.Provider value={{ selectedChurch, setSelectedChurch, churches, isSuperAdmin, churchFilter }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurch must be inside ChurchProvider');
  return ctx;
}
