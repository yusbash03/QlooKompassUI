import { authHandlers } from './auth';
import { evaluationHandlers } from './evaluations';
import { growthPlanHandlers } from './growthPlans';
import { metaHandlers } from './meta';
import { profileHandlers } from './profiles';
import { quotaHandlers } from './quota';

/** Every fake-API handler: Vitest's MSW server and the e2e stand-in API (e2e/mock-api) share them. */
export const handlers = [
  // Before metaHandlers: it overrides /meta when evaluation is switched on.
  ...evaluationHandlers,
  ...metaHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...quotaHandlers,
  ...growthPlanHandlers,
];
