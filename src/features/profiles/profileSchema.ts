import { z } from 'zod';
import type { components } from '@/shared/api/schema';
import {
  BUDGETS,
  CATEGORIES,
  MAX_REFERENCES,
  OBJECTIVES,
  REFERENCE_KINDS,
  type BudgetRange,
  type BusinessCategory,
  type MarketingObjective,
} from './profile-options';

export type BusinessProfileRequest = components['schemas']['BusinessProfileRequest'];
export type BusinessProfileDto = components['schemas']['BusinessProfileDto'];

const values = <T extends string>(options: readonly { value: T }[]) => options.map((o) => o.value) as [T, ...T[]];

const optionalText = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer`);

/** A select/radio that starts empty (''), must be chosen, and narrows to the enum once valid. */
function requiredChoice<T extends string>(options: readonly { value: T }[], message: string) {
  const allowed = new Set<string>(values(options));
  return z.string().transform((value, ctx): T => {
    if (!allowed.has(value)) {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    }
    return value as T;
  });
}

// Mirrors BusinessProfileRequest limits in contracts/openapi.yaml exactly (FE-01 §5). Only brand name, category,
// products and objective are required — everything else may be left blank (US-C4).
export const profileSchema = z
  .object({
    brandName: z
      .string()
      .trim()
      .min(2, 'Brand name needs at least 2 characters')
      .max(100, 'Use 100 characters or fewer'),
    category: requiredChoice<BusinessCategory>(CATEGORIES, 'Choose a category'),
    categoryOther: optionalText(60),
    description: optionalText(1000),
    brandIdentity: optionalText(500),
    productsDescription: z
      .string()
      .trim()
      .min(10, 'Describe what you sell in at least 10 characters')
      .max(1000, 'Use 1000 characters or fewer'),
    targetMarket: optionalText(200),
    primaryLocation: optionalText(100),
    marketingObjective: requiredChoice<MarketingObjective>(OBJECTIVES, 'Choose your main goal'),
    objectiveNotes: optionalText(300),
    budgetRange: z.union([z.enum(values(BUDGETS)), z.literal('')]),
    referenceEntities: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Enter a name').max(100, 'Use 100 characters or fewer'),
          kindHint: z.enum(values(REFERENCE_KINDS)),
        }),
      )
      .max(MAX_REFERENCES, `Add up to ${MAX_REFERENCES} references`),
  })
  .refine((profile) => profile.category !== 'Other' || profile.categoryOther.length > 0, {
    path: ['categoryOther'],
    message: 'Tell us your category',
    // Run even while other steps are still invalid, so step 1 can block on it (Zod skips object refinements otherwise).
    when: () => true,
  });

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormValues = z.output<typeof profileSchema>;

export const emptyProfile: ProfileFormInput = {
  brandName: '',
  category: '',
  categoryOther: '',
  description: '',
  brandIdentity: '',
  productsDescription: '',
  targetMarket: '',
  primaryLocation: '',
  marketingObjective: '',
  objectiveNotes: '',
  budgetRange: '',
  referenceEntities: [],
};

const orNull = (value: string) => (value.length > 0 ? value : null);

export function toRequest(values: ProfileFormValues): BusinessProfileRequest {
  return {
    brandName: values.brandName,
    category: values.category,
    categoryOther: values.category === 'Other' ? orNull(values.categoryOther) : null,
    description: orNull(values.description),
    brandIdentity: orNull(values.brandIdentity),
    productsDescription: values.productsDescription,
    targetMarket: orNull(values.targetMarket),
    primaryLocation: orNull(values.primaryLocation),
    marketingObjective: values.marketingObjective,
    objectiveNotes: orNull(values.objectiveNotes),
    budgetRange: values.budgetRange === '' ? null : (values.budgetRange as BudgetRange),
    referenceEntities: values.referenceEntities,
  };
}

export function fromDto(dto: BusinessProfileDto): ProfileFormInput {
  return {
    brandName: dto.brandName,
    category: dto.category,
    categoryOther: dto.categoryOther ?? '',
    description: dto.description ?? '',
    brandIdentity: dto.brandIdentity ?? '',
    productsDescription: dto.productsDescription,
    targetMarket: dto.targetMarket ?? '',
    primaryLocation: dto.primaryLocation ?? '',
    marketingObjective: dto.marketingObjective,
    objectiveNotes: dto.objectiveNotes ?? '',
    budgetRange: dto.budgetRange ?? '',
    referenceEntities: dto.referenceEntities ?? [],
  };
}
