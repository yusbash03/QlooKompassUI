import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/schema';

export const metaFixture: components['schemas']['MetaDto'] = {
  appName: 'Kulture Compass',
  version: '1.0.0',
  qlooMode: 'Mock',
  llmProvider: 'Mock',
  isMockMode: true,
  features: { evaluationMode: false, samplePlan: true, experimentTracking: true },
};

export const metaHandlers = [http.get('*/api/v1/meta', () => HttpResponse.json(metaFixture))];
