// FE-01 §4. Every user-scoped key starts with ['u', userId] so one user's cache can never satisfy another user's query.
export const queryKeys = {
  meta: ['meta'] as const,
  samplePlan: ['samplePlan'] as const,

  user: (userId: string) => ({
    all: ['u', userId] as const,
    quota: ['u', userId, 'quota'] as const,
    profiles: (page: number) => ['u', userId, 'profiles', { page }] as const,
    profile: (id: string) => ['u', userId, 'profile', id] as const,
    plans: (filters: Record<string, unknown>) => ['u', userId, 'plans', filters] as const,
    plan: (id: string) => ['u', userId, 'plan', id] as const,
    planStatus: (id: string) => ['u', userId, 'planStatus', id] as const,
    experiments: (filters: Record<string, unknown>) => ['u', userId, 'experiments', filters] as const,
    evaluation: (id: string) => ['u', userId, 'evaluation', id] as const,
  }),
};
