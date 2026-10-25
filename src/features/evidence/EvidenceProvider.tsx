import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { EvidenceContext, type EvidenceContextValue, type EvidenceUsage } from './evidence-context';
import { EvidenceDrawer } from './EvidenceDrawer';
import type { Evidence } from './types';

interface EvidenceProviderProps {
  evidence: Evidence[];
  /** Where an evidence key is cited (for the drawer's "Used in" links). */
  usedIn?: (key: string, close: () => void) => EvidenceUsage[];
  children: ReactNode;
}

/** Makes a plan's evidence set available to every EvidenceChip below it, and owns the single shared drawer. */
export function EvidenceProvider({ evidence, usedIn, children }: EvidenceProviderProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const byKey = useMemo(() => new Map(evidence.map((item) => [item.key, item])), [evidence]);
  const close = useCallback(() => setOpenKey(null), []);

  const value = useMemo<EvidenceContextValue>(
    () => ({ get: (key) => byKey.get(key), open: (key) => setOpenKey(key) }),
    [byKey],
  );

  const current = openKey ? (byKey.get(openKey) ?? null) : null;

  return (
    <EvidenceContext.Provider value={value}>
      {children}
      <EvidenceDrawer
        evidence={current}
        usedIn={current && usedIn ? usedIn(current.key, close) : []}
        onOpenChange={(open) => !open && close()}
      />
    </EvidenceContext.Provider>
  );
}
