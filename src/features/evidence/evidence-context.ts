import { createContext, useContext } from 'react';
import type { Evidence } from './types';

export interface EvidenceUsage {
  label: string;
  onSelect: () => void;
}

export interface EvidenceContextValue {
  get(key: string): Evidence | undefined;
  open(key: string): void;
}

export const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function useEvidence(): EvidenceContextValue {
  const value = useContext(EvidenceContext);
  if (!value) throw new Error('useEvidence must be used inside <EvidenceProvider>');
  return value;
}
