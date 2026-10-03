import { createContext, useContext, /* useState, */ useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useChurches } from '../hooks/useChurches';
import { CHURCH_NAME, CHURCH_SLUG } from '../config/church';
import type { ApiChurch } from '../types';

interface ChurchContextValue {
  /** The single church this admin panel manages (null until the church list loads). */
  selectedChurch: ApiChurch | null;
  // MULTI-CHURCH: super admins could switch churches from the top bar.
  // setSelectedChurch: (church: ApiChurch | null) => void;
  churches: ApiChurch[];
  isSuperAdmin: boolean;
  /** The church name to use for API filtering — always the configured church. */
  churchFilter: string;
}

const ChurchContext = createContext<ChurchContextValue | null>(null);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // MULTI-CHURCH: super admins could switch between churches; others were locked to their own.
  // const [superAdminSelected, setSuperAdminSelected] = useState<ApiChurch | null>(null);

  const { data: churchData } = useChurches();
  const churches = useMemo(() => churchData?.data ?? [], [churchData]);

  const selectedChurch = useMemo(
    () => churches.find((c) => c.slug === CHURCH_SLUG) ?? null,
    [churches],
  );

  // MULTI-CHURCH:
  // const selectedChurch = useMemo(() => {
  //   if (isSuperAdmin) return superAdminSelected;
  //   if (currentUser?.church) {
  //     // Find the full Church object matching the user's church
  //     return churches.find((c) => c._id === currentUser.church?.id) ?? null;
  //   }
  //   return null;
  // }, [isSuperAdmin, superAdminSelected, currentUser, churches]);
  //
  // const setSelectedChurch = (church: ApiChurch | null) => {
  //   if (isSuperAdmin) setSuperAdminSelected(church);
  // };
  //
  // const churchFilter = selectedChurch?.name ?? (isSuperAdmin ? undefined : currentUser?.church?.name);
  const churchFilter = selectedChurch?.name ?? CHURCH_NAME;

  return (
    <ChurchContext.Provider value={{ selectedChurch, churches, isSuperAdmin, churchFilter }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurch must be inside ChurchProvider');
  return ctx;
}
