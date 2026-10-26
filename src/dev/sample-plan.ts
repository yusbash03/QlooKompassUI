import type { components } from '../shared/api/schema';

type Schemas = components['schemas'];
type GrowthPlan = Schemas['GrowthPlanDto'];
type Evidence = Schemas['EvidenceDto'];

/**
 * A complete synthetic growth plan (fictional sample content — design brief §1; never real Qloo data). Used by the
 * component gallery, tests, the MSW fake API and the e2e stand-in API. Self-contained (type-only imports) so plain
 * Node can load it too.
 */
export function samplePlan(overrides: Partial<GrowthPlan> = {}): GrowthPlan {
  const evidence: Evidence[] = [
    ev('ev_001', 'streetwear', 'urn:tag', 0.93, 0.88, 'Strong', 'Tags', ['taste search']),
    ev('ev_002', 'Sample Creator C', 'urn:entity:person', 0.89, 0.64, 'Strong', 'Insights', ['your reference']),
    ev('ev_003', 'Sample Brand B', 'urn:entity:brand', 0.91, 0.72, 'Strong', 'Search', ['your reference']),
    ev('ev_004', 'Sample Store D', 'urn:entity:place', 0.74, 0.41, 'Moderate', 'Insights', ['taste search']),
    ev('ev_005', 'Sample Show E', 'urn:entity:tv_show', 0.68, 0.79, 'Moderate', 'Insights', ['taste search']),
    ev('ev_006', 'thrift culture', 'urn:tag', 0.86, 0.58, 'Strong', 'Tags', ['taste search']),
    ev('ev_007', 'minimalist', 'urn:tag', 0.87, 0.66, 'Strong', 'Tags', ['taste search']),
    ev('ev_008', 'Sample Brand F', 'urn:entity:brand', 0.71, 0.52, 'Moderate', 'Insights', ['taste search']),
    ev('ev_009', 'Sample Creator G', 'urn:entity:person', 0.66, 0.47, 'Moderate', 'Insights', ['taste search']),
    ev('ev_010', 'vintage denim', 'urn:tag', 0.58, 0.61, 'Weak', 'Tags', ['taste search']),
    ev('ev_011', 'upcycling', 'urn:tag', null, 0.34, 'Weak', 'Tags', ['tag lookup']),
    ev('ev_012', 'Sample Store J', 'urn:entity:place', null, null, 'Weak', 'Search', ['tag lookup']),
  ];

  const plan: GrowthPlan = {
    id: '00000000-0000-4000-8000-0000000000e1',
    businessProfileId: '00000000-0000-4000-8000-0000000000b1',
    brandName: 'Eko Thread Co.',
    status: 'Completed',
    stage: 'Done',
    error: null,
    isMock: true,
    isSample: true,
    qlooMode: 'Mock',
    llmProvider: 'Mock',
    llmModel: null,
    schemaVersion: '1.0',
    promptVersion: 'synth-v1',
    briefSnapshot: {
      brandName: 'Eko Thread Co.',
      category: 'Streetwear',
      productsDescription: 'Graphic tees, hoodies and caps in small runs, sold on Instagram.',
      targetMarket: '18–30s in Lagos who shop on Instagram',
      primaryLocation: 'Lagos',
      marketingObjective: 'Sales',
      budgetRange: 'From100kTo500k',
      referenceEntities: [{ name: 'Sample Brand B', kindHint: 'Brand' }],
    },
    summary: {
      headline: 'Lead with minimalist graphic tees for 18–30 online shoppers in Lagos',
      overview:
        'Your customers share a clear taste for clean, low-logo streetwear and for thrift and re-wear culture. That points to a tighter, more minimal tee range sold as small numbered drops, introduced through one creator who already bridges both tastes. Start with a 14-day test on Instagram before committing more stock or budget to partnerships.',
    },
    evidence,
    insights: [
      {
        id: 'ins_1',
        title: 'Your customers’ tastes overlap with minimalist streetwear brands',
        finding:
          'People who like your reference brand show a strong affinity for minimalist streetwear and for brands with little or no visible logo.',
        whyItMatters:
          'Your current range leans on loud graphics. A cleaner line of tees could reach buyers who already shop this way, without abandoning your graphic identity.',
        evidenceKeys: ['ev_003', 'ev_007'],
        evidenceStrength: 'Strong',
        assumptions: ['Affinity reflects shared taste, not purchase intent.'],
        limitations: ['Only one reference brand was matched.'],
      },
      {
        id: 'ins_2',
        title: 'Thrift and re-wear culture is a shared value, not a niche',
        finding:
          'Thrift culture appears with high affinity across your references; vintage denim shows a weaker, indirect link.',
        whyItMatters:
          'Messaging about durability and styling pieces many ways may resonate more than “new drop” urgency alone.',
        evidenceKeys: ['ev_006', 'ev_010'],
        evidenceStrength: 'Strong',
        assumptions: ['Customers value re-wear over novelty.'],
        limitations: [],
      },
      {
        id: 'ins_3',
        title: 'Sample Creator C is the clearest bridge to your audience',
        finding:
          'Sample Creator C has high affinity with your audience and appears in searches for both minimalist and thrift themes.',
        whyItMatters:
          'One creator who already speaks to both tastes is a cheaper, more credible first partner than several broad-reach accounts.',
        evidenceKeys: ['ev_002', 'ev_009'],
        evidenceStrength: 'Strong',
        assumptions: ['Sample Creator C is open to small-brand collaborations.'],
        limitations: [],
      },
      {
        id: 'ins_4',
        title: 'Sample Show E is a shared styling reference',
        finding: 'Sample Show E is moderately associated with your audience and is widely watched.',
        whyItMatters:
          'Light references to the show’s styling could make lookbook content feel familiar without licensing anything.',
        evidenceKeys: ['ev_005'],
        evidenceStrength: 'Moderate',
        assumptions: [],
        limitations: ['Association is moderate; treat as inspiration only.'],
      },
      {
        id: 'ins_5',
        title: 'Local retail signals are thin outside Sample Store D',
        finding: 'Only one Lagos store returned a usable affinity score; a second returned no affinity data.',
        whyItMatters:
          'Treat physical retail as a later step. Prove demand online first, then approach Sample Store D with results.',
        evidenceKeys: ['ev_004', 'ev_012'],
        evidenceStrength: 'Weak',
        assumptions: [],
        limitations: ['Store coverage in Lagos is limited.'],
      },
    ],
    collaborations: [
      {
        id: 'col_1',
        partnerEvidenceKey: 'ev_003',
        partnerName: 'Sample Brand B',
        culturalConnection: 'Your reference brand; highest brand affinity with your audience (0.91).',
        format: 'Co-branded capsule of 50 tees',
        fitRationale:
          'Their minimalist approach and your graphic heritage meet in the middle — a capsule lets both audiences discover each other with low stock risk.',
        testIdea:
          'Pre-sell the capsule for 7 days via a shared Instagram post. Go ahead if at least 30 of 50 pieces are reserved.',
        evidenceKeys: ['ev_003'],
        evidenceStrength: 'Strong',
        assumptions: [],
      },
      {
        id: 'col_2',
        partnerEvidenceKey: 'ev_002',
        partnerName: 'Sample Creator C',
        culturalConnection: 'High affinity (0.89) and present in both minimalist and thrift searches.',
        format: 'Styling series — 3 Instagram Reels wearing pieces three ways',
        fitRationale: 'Re-wear styling plays to the thrift-culture signal while showing off a minimal range.',
        testIdea: 'Use a unique discount code per Reel and compare code redemptions over 14 days.',
        evidenceKeys: ['ev_002'],
        evidenceStrength: 'Strong',
        assumptions: [],
      },
      {
        id: 'col_3',
        partnerEvidenceKey: 'ev_004',
        partnerName: 'Sample Store D',
        culturalConnection: 'Only Lagos store with a usable affinity score (0.74).',
        format: 'Weekend pop-up rail for 2 weekends',
        fitRationale: 'A small, time-boxed physical presence where your audience already shops.',
        testIdea: 'Approach after the online test. Track units sold per weekend against your online weekly average.',
        evidenceKeys: ['ev_004'],
        evidenceStrength: 'Moderate',
        assumptions: [],
      },
    ],
    campaigns: [
      {
        id: 'cam_1',
        title: 'Less logo, more Lagos',
        objective: 'Sales',
        targetHypothesis:
          'A numbered minimalist drop will convert Instagram visitors better than the usual graphic range.',
        culturalInsight: 'Your audience overlaps strongly with minimalist, low-logo streetwear.',
        angle: 'Quiet design, loud city — clean tees shot against busy Lagos streets.',
        execution: [
          'Shoot a 6-look lookbook on Lagos streets',
          'Release 3 minimalist tee designs as a numbered drop of 40 each',
          'Run an Instagram story poll to pick a 4th colourway',
          'Send an early-access link to your email list 24 hours before launch',
        ],
        successMetric: 'Instagram link-click → purchase rate',
        effortCategory: 'Medium',
        evidenceKeys: ['ev_003', 'ev_007'],
        evidenceStrength: 'Strong',
        assumptions: ['Lookbook production fits within the stated budget band.'],
      },
      {
        id: 'cam_2',
        title: 'Wear it again',
        objective: 'Engagement',
        targetHypothesis: 'Re-wear styling content earns more saves than product-only posts.',
        culturalInsight: 'Thrift and re-wear culture is a shared value for your audience.',
        angle: 'One tee, three ways — styled with thrifted pieces customers already own.',
        execution: [
          'Brief Sample Creator C on a 3-Reel styling series',
          'Post one Reel per week with a unique discount code',
          'Repost customer re-wear photos to stories',
        ],
        successMetric: 'Saves per Reel',
        effortCategory: 'Low',
        evidenceKeys: ['ev_006', 'ev_002'],
        evidenceStrength: 'Strong',
        assumptions: ['Customers will share re-wear photos.'],
      },
    ],
    experiments: [
      {
        id: 'exp_1',
        linkedRecommendationId: 'cam_1',
        hypothesis: 'A numbered minimalist drop will convert Instagram visitors better than our usual graphic tees.',
        segment: 'Instagram followers aged 18–30 in Lagos',
        proposedCampaign: 'Less logo, more Lagos',
        primaryMetric: 'Instagram link-click → purchase rate',
        measurementPeriodDays: 14,
        successThreshold: '+20% vs previous 14 days',
        thresholdIsProposedDefault: true,
        nextDecision: {
          ifSuccess: 'Make numbered drops a monthly format and extend to hoodies.',
          ifFailure: 'Keep the current range and test the capsule with Sample Brand B instead.',
        },
        status: 'Proposed',
        observedResult: null,
        resultNotes: null,
        startedAt: null,
        concludedAt: null,
        version: '1',
      },
      {
        id: 'exp_2',
        linkedRecommendationId: 'cam_2',
        hypothesis: 'Re-wear styling Reels get more saves than product-only posts.',
        segment: 'Existing Instagram followers',
        proposedCampaign: 'Wear it again',
        primaryMetric: 'Saves per Reel',
        measurementPeriodDays: 14,
        successThreshold: '1.5× average saves of last 10 posts',
        thresholdIsProposedDefault: false,
        nextDecision: {
          ifSuccess: 'Commit to a monthly styling series with Sample Creator C.',
          ifFailure: 'Return to product posts and try a different creator.',
        },
        status: 'Proposed',
        observedResult: null,
        resultNotes: null,
        startedAt: null,
        concludedAt: null,
        version: '1',
      },
    ],
    unlinkedMentions: [
      { name: 'Sample Market K', note: 'AI suggestion — not retrieved from Qloo' },
      { name: 'Sample Collective L', note: 'AI suggestion — not retrieved from Qloo' },
    ],
    limitations: [
      'Little data was found for Lagos stores, so local pop-up venues were left out.',
      'Two of your references could not be matched in Qloo and were not used.',
    ],
    stats: { qlooCalls: 9, llmCalls: 3, evidenceByQuality: { Strong: 5, Moderate: 4, Weak: 3 } },
    createdAt: '2026-10-24T10:00:00Z',
    completedAt: '2026-10-24T10:01:12Z',
  };
  return { ...plan, ...overrides };
}

function ev(
  key: string,
  name: string,
  entityType: string,
  affinity: number | null,
  popularity: number | null,
  quality: Evidence['quality'],
  sourceOperation: Evidence['sourceOperation'],
  sourceSignals: string[],
): Evidence {
  return {
    key,
    qlooEntityId: `synthetic-${key}`,
    name,
    entityType,
    sourceOperation,
    sourceSignals,
    affinity,
    popularity,
    tags: [],
    quality,
    qualityReasons:
      quality === 'Strong'
        ? [
            'resolved from your reference or a strong taste signal',
            affinity != null ? `affinity ${affinity.toFixed(2)}` : 'no affinity returned',
          ]
        : quality === 'Moderate'
          ? ['returned by one taste search']
          : ['weak or missing affinity'],
    retrievedAt: '2026-10-24T10:00:40Z',
  };
}
