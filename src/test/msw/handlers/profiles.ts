import { http, HttpResponse } from 'msw';
import type { BusinessProfileDto, BusinessProfileRequest } from '@/features/profiles/profileSchema';
import { problem } from './auth';

/** Brand name that makes the fake server reject the brief with a field error on ProductsDescription. */
export const SERVER_REJECTED_BRAND = 'Server Rejects Me';

interface StoredProfile {
  dto: BusinessProfileDto;
  version: number;
}

/** In-memory fake of the profiles API; reset after each test by setup.ts. */
export const profilesState = {
  profiles: new Map<string, StoredProfile>(),
  requests: [] as { method: string; body: BusinessProfileRequest; ifMatch: string | null }[],
  nextId: 1,
};

export function resetProfilesState(): void {
  profilesState.profiles.clear();
  profilesState.requests = [];
  profilesState.nextId = 1;
}

const etagOf = (stored: StoredProfile) => `"${stored.version}"`;

function store(id: string, body: BusinessProfileRequest, version: number, createdAt: string): StoredProfile {
  const now = new Date().toISOString();
  const stored: StoredProfile = {
    version,
    dto: { ...body, id, createdAt, updatedAt: now, version: String(version) },
  };
  profilesState.profiles.set(id, stored);
  return stored;
}

export function seedProfile(overrides: Partial<BusinessProfileRequest> = {}): BusinessProfileDto {
  const id = `00000000-0000-4000-8000-${String(profilesState.nextId++).padStart(12, '0')}`;
  return store(
    id,
    {
      brandName: 'Eko Thread Co.',
      category: 'Streetwear',
      categoryOther: null,
      description: null,
      productsDescription: 'Graphic tees, hoodies and caps.',
      targetMarket: '18–30 in Lagos',
      primaryLocation: 'Lagos',
      marketingObjective: 'Sales',
      objectiveNotes: null,
      brandIdentity: null,
      referenceEntities: [{ name: 'Sample Brand B', kindHint: 'Brand' }],
      budgetRange: 'From100kTo500k',
      ...overrides,
    },
    1,
    '2026-10-20T10:00:00Z',
  ).dto;
}

/** Simulates another tab/device saving the brief, so the next PUT with the old ETag gets 412. */
export function editProfileElsewhere(id: string, changes: Partial<BusinessProfileRequest>): void {
  const stored = profilesState.profiles.get(id);
  if (!stored) throw new Error(`no profile ${id}`);
  store(id, { ...stored.dto, ...changes }, stored.version + 1, stored.dto.createdAt);
}

export const profileHandlers = [
  http.post('*/api/v1/business-profiles', async ({ request }) => {
    const body = (await request.json()) as BusinessProfileRequest;
    profilesState.requests.push({ method: 'POST', body, ifMatch: null });
    if (body.brandName === SERVER_REJECTED_BRAND) {
      return problem(400, 'validation_failed', { errors: { ProductsDescription: ['Server says this is too vague.'] } });
    }
    const id = `00000000-0000-4000-8000-${String(profilesState.nextId++).padStart(12, '0')}`;
    const stored = store(id, body, 1, new Date().toISOString());
    return HttpResponse.json(stored.dto, {
      status: 201,
      headers: { ETag: etagOf(stored), Location: `/api/v1/business-profiles/${id}` },
    });
  }),

  http.get('*/api/v1/business-profiles', () => {
    const items = [...profilesState.profiles.values()].map(({ dto }) => ({
      id: dto.id,
      brandName: dto.brandName,
      category: dto.category,
      primaryLocation: dto.primaryLocation ?? null,
      updatedAt: dto.updatedAt,
      planCount: 0,
      latestPlanStatus: null,
    }));
    return HttpResponse.json({ items, page: 1, pageSize: 20, totalCount: items.length });
  }),

  http.get('*/api/v1/business-profiles/:id', ({ params }) => {
    const stored = profilesState.profiles.get(String(params.id));
    if (!stored) return problem(404, 'not_found');
    return HttpResponse.json(stored.dto, { headers: { ETag: etagOf(stored) } });
  }),

  http.put('*/api/v1/business-profiles/:id', async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as BusinessProfileRequest;
    const ifMatch = request.headers.get('If-Match');
    profilesState.requests.push({ method: 'PUT', body, ifMatch });
    const stored = profilesState.profiles.get(id);
    if (!stored) return problem(404, 'not_found');
    if (!ifMatch) return problem(428, 'precondition_required');
    if (ifMatch !== etagOf(stored)) return problem(412, 'version_mismatch');
    const updated = store(id, body, stored.version + 1, stored.dto.createdAt);
    return HttpResponse.json(updated.dto, { headers: { ETag: etagOf(updated) } });
  }),
];
