import { z } from 'zod';

// `llmOnlyOutput` is an untyped object in the contract ("same shape as GrowthPlanDraft without evidence"), so read it
// leniently: keep what we can display, drop what doesn't fit, never fail the whole page over one odd field.
const text = z.string().trim().min(1);
const list = <T extends z.ZodType>(item: T) =>
  z.array(z.unknown()).transform((xs) =>
    xs.flatMap((x) => {
      const parsed = item.safeParse(x);
      return parsed.success ? [parsed.data as z.output<T>] : [];
    }),
  );

const draftSchema = z.object({
  summary: z.object({ headline: text.nullish() }).nullish().catch(null),
  insights: list(z.object({ title: text, finding: text.optional() })).catch([]),
  collaborations: list(z.object({ partnerName: text, culturalConnection: text.optional() })).catch([]),
  campaigns: list(z.object({ title: text, angle: text.optional() })).catch([]),
  experiments: list(z.object({ hypothesis: text })).catch([]),
  mentionedEntities: list(z.object({ name: text, evidenceKey: z.string().nullish() })).catch([]),
});

export type LlmOnlyDraft = z.output<typeof draftSchema>;

export function parseLlmOnlyDraft(value: unknown): LlmOnlyDraft | null {
  const parsed = draftSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : null;
}

/** Named entities the AI-only plan mentioned that can't be traced to retrieved data (all of them, by construction). */
export function unverifiedNames(draft: LlmOnlyDraft): string[] {
  return [...new Set(draft.mentionedEntities.filter((e) => !e.evidenceKey).map((e) => e.name))];
}
