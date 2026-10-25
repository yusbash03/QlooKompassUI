import type {
  Campaign,
  Collaboration,
  Evidence,
  Experiment,
  Insight,
  UnlinkedMention,
} from '@/features/evidence/types';

/**
 * Synthetic report content for the /dev/ui gallery and component tests. Every name is fictional sample content
 * (design brief §1) — not real Qloo data. `prefix` keeps element ids unique when the gallery renders two copies.
 */
export function sampleReport(prefix = '') {
  const evidence: Evidence[] = [
    ev('ev_002', 'Sample Creator C', 'urn:entity:person', 0.89, 0.64, 'Strong', ['minimalist', 'thrift'], 'Insights'),
    ev(
      'ev_003',
      'Sample Brand B',
      'urn:entity:brand',
      0.91,
      0.72,
      'Strong',
      ['minimalist', 'streetwear', 'graphic tees'],
      'Search',
    ),
    ev('ev_004', 'Sample Store D', 'urn:entity:place', 0.74, 0.41, 'Moderate', ['concept store'], 'Insights'),
    ev('ev_005', 'Sample Show E', 'urn:entity:tv_show', 0.68, 0.79, 'Moderate', ['styling'], 'Insights'),
    ev('ev_007', 'minimalist', 'urn:tag', 0.87, 0.66, 'Strong', [], 'Tags'),
    ev('ev_011', 'upcycling', 'urn:tag', null, 0.34, 'Weak', [], 'Tags'),
  ];

  const insight: Insight = {
    id: `${prefix}ins_1`,
    title: 'Your customers’ tastes overlap with minimalist streetwear brands',
    finding:
      'People who like your reference brand show a strong affinity for minimalist streetwear and for brands with little or no visible logo.',
    whyItMatters:
      'Your current range leans on loud graphics. A cleaner line of tees could reach buyers who already shop this way.',
    evidenceKeys: ['ev_003', 'ev_007'],
    evidenceStrength: 'Strong',
    assumptions: ['Affinity reflects shared taste, not purchase intent.'],
    limitations: ['Only one reference brand was matched.'],
  };

  const partnership: Collaboration = {
    id: `${prefix}col_1`,
    partnerEvidenceKey: 'ev_003',
    partnerName: 'Sample Brand B',
    culturalConnection: 'Your reference brand; highest brand affinity with your audience (0.91).',
    format: 'Co-branded capsule of 50 tees',
    fitRationale:
      'Their minimalist approach and your graphic heritage meet in the middle — a capsule lets both audiences discover each other with low stock risk.',
    testIdea:
      'Pre-sell the capsule for 7 days via a shared Instagram post. Go ahead if at least 30 of 50 are reserved.',
    evidenceKeys: ['ev_003'],
    evidenceStrength: 'Strong',
    assumptions: [],
  };

  const campaign: Campaign = {
    id: `${prefix}cam_1`,
    title: 'Less logo, more Lagos',
    objective: 'Sales',
    targetHypothesis: 'A numbered minimalist drop will convert Instagram visitors better than the usual graphic range.',
    culturalInsight: 'Your audience overlaps strongly with minimalist, low-logo streetwear.',
    angle: 'Quiet design, loud city — clean tees shot against busy Lagos streets.',
    execution: [
      'Shoot a 6-look lookbook on Lagos streets',
      'Release 3 minimalist tee designs as a numbered drop of 40 each',
      'Run an Instagram story poll to pick a 4th colourway',
    ],
    successMetric: 'Instagram link-click → purchase rate',
    effortCategory: 'Medium',
    evidenceKeys: ['ev_003', 'ev_007'],
    evidenceStrength: 'Strong',
    assumptions: ['Lookbook production fits within the stated budget band.'],
  };

  const experiment = (status: Experiment['status'], n: number): Experiment => ({
    id: `${prefix}exp_${n}`,
    linkedRecommendationId: campaign.id,
    hypothesis: 'A numbered minimalist drop will convert Instagram visitors better than our usual graphic tees.',
    segment: 'Instagram followers aged 18–30 in Lagos',
    proposedCampaign: campaign.title,
    primaryMetric: 'Instagram link-click → purchase rate',
    measurementPeriodDays: 14,
    successThreshold: '+20% vs previous 14 days',
    thresholdIsProposedDefault: true,
    nextDecision: {
      ifSuccess: 'Make numbered drops a monthly format and extend to hoodies.',
      ifFailure: 'Keep the current range and test the capsule with Sample Brand B instead.',
    },
    status,
    observedResult: status === 'Concluded' ? '+26% vs previous 14 days' : null,
    resultNotes: status === 'Concluded' ? 'Drop sold out on day 9.' : null,
    startedAt: status === 'Proposed' ? null : new Date(Date.now() - 7 * 86_400_000).toISOString(),
    concludedAt: status === 'Concluded' ? new Date().toISOString() : null,
    version: '1',
  });

  const unlinked: UnlinkedMention[] = [
    { name: 'Sample Market K', note: 'AI suggestion — not retrieved from Qloo' },
    { name: 'Sample Collective L', note: 'AI suggestion — not retrieved from Qloo' },
  ];

  return {
    evidence,
    insight,
    partnership,
    campaign,
    experiments: [experiment('Proposed', 1), experiment('Running', 2), experiment('Concluded', 3)],
    unlinked,
  };
}

function ev(
  key: string,
  name: string,
  entityType: string,
  affinity: number | null,
  popularity: number | null,
  quality: Evidence['quality'],
  tags: string[],
  sourceOperation: Evidence['sourceOperation'],
): Evidence {
  return {
    key,
    qlooEntityId: `synthetic-${key}`,
    name,
    entityType,
    sourceOperation,
    sourceSignals: sourceOperation === 'Search' ? ['your reference'] : ['taste search'],
    affinity,
    popularity,
    tags,
    quality,
    qualityReasons:
      quality === 'Strong'
        ? ['resolved from your reference', `affinity ${affinity?.toFixed(2) ?? '—'}`, 'seen in 2 searches']
        : ['returned by one search only'],
    retrievedAt: '2026-10-22T13:06:00Z',
  };
}
