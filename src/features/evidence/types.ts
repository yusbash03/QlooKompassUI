import { Hash, MapPin, Tag, Tv, UserRound, type LucideIcon } from 'lucide-react';
import type { components } from '@/shared/api/schema';

type Schemas = components['schemas'];
export type Evidence = Schemas['EvidenceDto'];
export type EvidenceQuality = Schemas['EvidenceQuality'];
export type Insight = Schemas['InsightDto'];
export type Collaboration = Schemas['CollaborationDto'];
export type Campaign = Schemas['CampaignDto'];
export type Experiment = Schemas['ExperimentDto'];
export type UnlinkedMention = Schemas['UnlinkedMentionDto'];

/** FE-01 §6 — exact wording for the strength-pill tooltip. */
export const QUALITY_TOOLTIP = 'Heuristic based on how this was retrieved — not a probability.';

/** Human label + icon for a Qloo entity URN (e.g. "urn:entity:brand"). Icons always sit next to text. */
export function entityKind(entityType: string): { label: string; icon: LucideIcon } {
  const kind = entityType.split(':').pop() ?? entityType;
  switch (kind) {
    case 'brand':
      return { label: 'Brand', icon: Tag };
    case 'person':
    case 'artist':
      return { label: kind === 'artist' ? 'Artist' : 'Person', icon: UserRound };
    case 'place':
    case 'destination':
    case 'locality':
      return { label: 'Place', icon: MapPin };
    case 'tv_show':
    case 'movie':
    case 'podcast':
    case 'book':
      return { label: 'Show', icon: Tv };
    case 'tag':
    case 'theme':
      return { label: 'Theme', icon: Hash };
    default:
      return { label: kind.replace(/_/g, ' '), icon: Hash };
  }
}
