import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/schema';

export const quotaFixture: components['schemas']['QuotaDto'] = {
  dailyLimit: 10,
  usedToday: 3,
  remainingToday: 7,
  resetsAt: '2026-10-26T00:00:00Z',
};

/** Remaining generations today; the fake growth-plans API spends from it. Reset after each test. */
export const quotaState = { remainingToday: quotaFixture.remainingToday };

export function resetQuotaState(): void {
  quotaState.remainingToday = quotaFixture.remainingToday;
}

export const quotaHandlers = [
  http.get('*/api/v1/me/quota', () =>
    HttpResponse.json({
      ...quotaFixture,
      remainingToday: quotaState.remainingToday,
      usedToday: quotaFixture.dailyLimit - quotaState.remainingToday,
    }),
  ),
];
