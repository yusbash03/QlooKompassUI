import {
  CalendarClock,
  Handshake,
  Megaphone,
  MessageCircleHeart,
  ShoppingBag,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { components } from '@/shared/api/schema';

type Schemas = components['schemas'];
export type BusinessCategory = Schemas['BusinessCategory'];
export type MarketingObjective = Schemas['MarketingObjective'];
export type BudgetRange = Schemas['BudgetRange'];
export type ReferenceKindHint = Schemas['ReferenceKindHint'];

// Runtime lists of the contract enums, with UI labels (design brief §4.4). `satisfies` keeps them in step with the schema.
export const CATEGORIES = [
  { value: 'Streetwear', label: 'Streetwear' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'FootwearAccessories', label: 'Footwear & Accessories' },
  { value: 'Other', label: 'Other' },
] as const satisfies readonly { value: BusinessCategory; label: string }[];

export const OBJECTIVES = [
  { value: 'Awareness', label: 'Awareness', description: 'Get more people to know the brand', icon: Megaphone },
  {
    value: 'Engagement',
    label: 'Engagement',
    description: 'More likes, shares and conversations',
    icon: MessageCircleHeart,
  },
  { value: 'Sales', label: 'Sales', description: 'Turn interest into orders', icon: ShoppingBag },
  { value: 'Launch', label: 'Launch', description: 'Introduce a new drop or collection', icon: CalendarClock },
  { value: 'Community', label: 'Community', description: 'Build a loyal circle of customers', icon: UsersRound },
  {
    value: 'Partnerships',
    label: 'Partnerships',
    description: 'Find brands and creators to work with',
    icon: Handshake,
  },
] as const satisfies readonly { value: MarketingObjective; label: string; description: string; icon: LucideIcon }[];

export const BUDGETS = [
  { value: 'Under100k', label: 'Under ₦100k' },
  { value: 'From100kTo500k', label: '₦100k–₦500k' },
  { value: 'From500kTo2m', label: '₦500k–₦2m' },
  { value: 'Over2m', label: 'Over ₦2m' },
  { value: 'NotSure', label: 'Not sure' },
] as const satisfies readonly { value: BudgetRange; label: string }[];

export const REFERENCE_KINDS = [
  { value: 'Brand', label: 'Brand' },
  { value: 'Person', label: 'Person' },
  { value: 'Artist', label: 'Artist' },
  { value: 'Place', label: 'Place' },
  { value: 'Media', label: 'Show' },
  { value: 'Unknown', label: 'Other' },
] as const satisfies readonly { value: ReferenceKindHint; label: string }[];

export const LOCATION_SUGGESTIONS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'] as const;

export const MAX_REFERENCES = 8;

export function labelOf<T extends string>(options: readonly { value: T; label: string }[], value: T | ''): string {
  return options.find((o) => o.value === value)?.label ?? '';
}
