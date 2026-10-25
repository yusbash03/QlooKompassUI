import { ArrowRight, ClipboardList, Database, FileCheck2, Info, Search, Smartphone, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { buttonClasses } from '@/shared/ui/button-classes';
import { Textile } from '@/shared/ui/Textile';

// Re-implemented from the Magic Patterns landing (Design/magic-patterns/landing.html) with our tokens.
// All brand/evidence names are fictional sample content (design brief §1).

const steps = [
  {
    icon: ClipboardList,
    title: 'Describe your brand and goal',
    body: 'Tell us what you sell, who buys it, what you want to grow and roughly what you can spend. About ten minutes.',
  },
  {
    icon: Search,
    title: 'We research cultural data with Qloo',
    body: 'We look up the brands, creators, places and shows your customers already love — and what else they share a taste for.',
  },
  {
    icon: FileCheck2,
    title: 'Get a plan with evidence, then test it',
    body: 'Insights, partnership ideas, campaigns and experiments — each one linked to the data behind it.',
  },
];

const audiences = [
  {
    title: 'Streetwear labels',
    body: 'Find the brands and creators your 18–30 customers already follow, and the drops worth collaborating on.',
    image: '/images/landing/audience-streetwear.jpg',
    alt: 'Folded charcoal hoodie, white graphic tee and cream cap',
  },
  {
    title: 'Fashion designers',
    body: 'Ground a new collection or capsule in what your clients care about beyond clothing.',
    image: '/images/landing/audience-designers.jpg',
    alt: 'Hand-dyed indigo fabric swatches and a measuring tape on a work table',
  },
  {
    title: 'Lifestyle & concept stores',
    body: 'Choose which labels to stock, which pop-ups to host and which partners bring the right people through the door.',
    image: '/images/landing/audience-stores.jpg',
    alt: 'A small boutique clothing rail with shirts and a shelf of folded tees',
  },
];

const loop = [
  { title: 'Plan', body: 'Pick a recommendation backed by evidence you can open and check.' },
  {
    title: 'Launch experiment',
    body: 'Start a 14-day test with a hypothesis, metric and success threshold set up front.',
  },
  { title: 'Measure', body: 'Record what actually happened next to the threshold you agreed.' },
  { title: 'Decide', body: 'Follow the decision rule — scale it if it works, change course if it doesn’t.' },
];

const sectionHeading = 'text-[28px] leading-tight tracking-tight text-ink md:text-[36px]';

export function LandingPage() {
  return (
    <>
      <Hero />

      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-20 border-t border-border bg-surface"
      >
        <div className="mx-auto grid max-w-(--container-page) gap-12 px-4 py-20 md:px-8 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-24">
          <div>
            <h2 id="how-heading" className={sectionHeading}>
              From brief to plan in three steps
            </h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              Most plans are ready in under two minutes. You can leave the page while we work.
            </p>
          </div>
          <ol className="relative space-y-10">
            <span aria-hidden className="absolute top-6 bottom-6 left-5 w-px bg-border" />
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="relative grid grid-cols-[40px_1fr] gap-5">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border bg-bg font-heading text-sm font-semibold text-ink">
                  {index + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="flex items-center gap-2 text-lg text-ink">
                    {title}
                    <Icon aria-hidden className="size-4 text-ink-muted" />
                  </h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <EvidenceSection />

      <section id="who" aria-labelledby="who-heading" className="scroll-mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-(--container-page) px-4 py-20 md:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 id="who-heading" className={sectionHeading}>
              Built for independent clothing brands
            </h2>
            <p className="text-ink-muted">Lagos, Abuja and beyond.</p>
          </div>
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {audiences.map((audience) => (
              <li key={audience.title} className="flex flex-col">
                <img
                  src={audience.image}
                  alt={audience.alt}
                  width={800}
                  height={597}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-(--radius-card) object-cover"
                />
                <h3 className="mt-5 text-lg text-ink">{audience.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-muted">{audience.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="results-heading" className="border-t border-border">
        <div className="mx-auto max-w-(--container-page) px-4 py-20 md:px-8 lg:py-24">
          <div className="max-w-2xl">
            <h2 id="results-heading" className={sectionHeading}>
              From plan to results
            </h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              A plan is only useful if you act on it. Every recommendation comes with an experiment you can run and
              measure — so next month’s plan starts from what you learned.
            </p>
          </div>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-8">
            <span
              aria-hidden
              className="absolute top-2 left-[7px] hidden h-px w-[calc(100%-14px)] bg-border md:block"
            />
            <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-border md:hidden" />
            {loop.map((stage, index) => (
              <li key={stage.title} className="relative pl-8 md:pl-0">
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-0.5 left-0 size-[15px] rounded-full border-2 md:static md:block',
                    index === 0 ? 'border-primary bg-primary' : 'border-ink-muted bg-bg',
                  )}
                />
                <h3 className="text-lg text-ink md:mt-5">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{stage.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="install" aria-labelledby="install-heading" className="scroll-mt-20 px-4 pb-20 md:px-8 lg:pb-24">
        <div className="mx-auto flex max-w-(--container-page) flex-col items-start gap-6 rounded-(--radius-card) bg-inverse px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-[#14122B]">
              <Smartphone aria-hidden className="size-5" />
            </span>
            <div>
              <h2 id="install-heading" className="text-[22px] leading-tight text-inverse-ink">
                Works on your phone — saved plans even offline.
              </h2>
              <p className="mt-1.5 text-sm text-inverse-ink-muted">
                Install Kulture Compass from your browser. No app store needed.
              </p>
            </div>
          </div>
          <Link to="/sign-up" className={cn(buttonClasses(), 'shrink-0')}>
            Get started free
          </Link>
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <Textile />
      <div className="relative mx-auto grid max-w-(--container-page) items-center gap-12 px-4 pt-14 pb-20 md:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-20 lg:pb-28">
        <div className="max-w-xl">
          <h1
            id="hero-heading"
            className="text-[36px] leading-[1.08] tracking-tight text-balance text-ink md:text-[48px] lg:text-[56px]"
          >
            Know your customers’ culture. Grow your clothing brand.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Turn your brand brief into a growth plan backed by real cultural data — insights, partnership ideas,
            campaigns and experiments you can measure.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/sign-up" className={cn(buttonClasses({ size: 'lg' }), 'rounded-(--radius-input)')}>
              Get started free
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              to="/sample"
              className={cn(buttonClasses({ variant: 'secondary', size: 'lg' }), 'rounded-(--radius-input)')}
            >
              See a sample plan
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-muted">For streetwear labels, designers and concept stores in Nigeria.</p>
        </div>

        <div className="relative">
          <div className="ml-auto w-full max-w-[460px]">
            <img
              src="/images/landing/hero-flatlay.jpg"
              alt="Flat-lay of folded graphic tees, a terracotta cap, an indigo adire textile and a canvas tote"
              width={805}
              height={1000}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/5] w-full rounded-[20px] object-cover"
            />
          </div>
          <div className="relative -mt-28 ml-2 sm:ml-6 lg:absolute lg:bottom-[-36px] lg:left-[-48px] lg:mt-0 lg:ml-0">
            <PlanPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Tilted, non-interactive preview of a plan report (illustration — fictional sample content). */
function PlanPreview() {
  return (
    <div
      role="img"
      aria-label="Preview of a growth plan report with a retrieved-data finding and an AI-generated interpretation"
      className="w-full max-w-[420px] -rotate-3 rounded-(--radius-card) border border-border bg-surface shadow-[0_24px_48px_-24px_rgba(20,18,43,0.35)] motion-reduce:rotate-0"
    >
      <div aria-hidden>
        <div className="border-b border-border px-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">Growth plan</p>
            <span className="rounded-full bg-evidence-bg px-2 py-0.5 text-[11px] font-medium text-evidence">
              Completed
            </span>
          </div>
          <p className="mt-1 font-heading text-lg font-semibold text-ink">Eko Thread Co.</p>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="pb-2 text-ink-muted">Overview</span>
            <span className="border-b-2 border-primary pb-2 font-medium text-ink">Insights</span>
            <span className="pb-2 text-ink-muted">Partnerships</span>
            <span className="pb-2 text-ink-muted">Campaigns</span>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm leading-snug font-medium text-ink">
            Your customers’ tastes overlap with minimalist streetwear brands
          </p>
          <div className="rounded-(--radius-input) bg-evidence-bg p-3">
            <PanelHeader title="What the data shows" provenance="evidence" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <SampleChip k="ev_003" name="Sample Brand B" />
              <SampleChip k="ev_007" name="minimalist" />
            </div>
          </div>
          <div className="rounded-(--radius-input) bg-ai-bg p-3">
            <PanelHeader title="Why it matters for your brand" provenance="ai" />
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              A pared-back graphic tee line could reach buyers who already shop clean, low-logo streetwear.
            </p>
          </div>
          <StrongPill />
        </div>
      </div>
    </div>
  );
}

function EvidenceSection() {
  return (
    <section id="evidence" aria-labelledby="evidence-heading" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-(--container-page) items-center gap-12 px-4 py-20 md:px-8 lg:grid-cols-[1fr_1.25fr] lg:gap-16 lg:py-24">
        <div>
          <h2 id="evidence-heading" className={sectionHeading}>
            Evidence, not guesswork
          </h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Every recommendation is split in two: what the data actually returned, and what our AI thinks it means for
            your brand. You can always tell which is which — and open the source behind any claim.
          </p>
          <dl className="mt-8 space-y-4">
            <LegendRow dot="bg-evidence" term="Teal">
              is data retrieved from Qloo, with a key you can trace.
            </LegendRow>
            <LegendRow dot="bg-ai" term="Violet">
              is AI interpretation — useful, but an opinion.
            </LegendRow>
          </dl>
        </div>
        <figure>
          <div className="grid overflow-hidden rounded-(--radius-card) border border-border bg-surface md:grid-cols-2">
            <div className="border-b border-border p-6 md:border-r md:border-b-0">
              <ProvenanceText kind="evidence" />
              <h3 className="mt-3 text-lg text-ink">What the data shows</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                People who like your reference brand also show a strong affinity for minimalist streetwear and thrift
                culture.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <SampleChip k="ev_003" name="Sample Brand B" />
                <SampleChip k="ev_007" name="minimalist" />
                <SampleChip k="ev_006" name="thrift culture" />
              </div>
              <div className="mt-5">
                <StrongPill />
              </div>
            </div>
            <div className="bg-ai-bg p-6">
              <ProvenanceText kind="ai" />
              <h3 className="mt-3 text-lg text-ink">Why it matters for your brand</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                A small run of low-logo graphic tees, styled with vintage pieces, could speak to buyers who already
                value restraint and re-wear. Test it as a 50-piece capsule before committing stock.
              </p>
            </div>
          </div>
          <figcaption className="mt-4 flex items-start gap-2 rounded-(--radius-input) bg-warning-bg px-4 py-3 text-sm text-warning-ink">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            Shared tastes are signals, not guaranteed sales.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function LegendRow({ dot, term, children }: { dot: string; term: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', dot)} />
      <dt className="sr-only">{term}</dt>
      <dd className="text-sm leading-relaxed text-ink">
        <span className="font-medium">{term}</span> {children}
      </dd>
    </div>
  );
}

function ProvenanceText({ kind }: { kind: 'evidence' | 'ai' }) {
  return kind === 'evidence' ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-evidence">
      <Database aria-hidden className="size-3.5" />
      Retrieved from Qloo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ai">
      <Sparkles aria-hidden className="size-3.5" />
      AI-generated
    </span>
  );
}

function PanelHeader({ title, provenance }: { title: string; provenance: 'evidence' | 'ai' }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-ink">{title}</p>
      <ProvenanceText kind={provenance} />
    </div>
  );
}

function StrongPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-strong px-2.5 py-0.5 text-xs font-medium text-strong">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      Strong evidence
    </span>
  );
}

/** Static evidence chip for illustrations (no drawer on the landing page). */
function SampleChip({ k, name }: { k: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-evidence bg-surface px-2.5 py-1 text-xs whitespace-nowrap text-ink">
      <span className="font-mono text-[11px] text-evidence">{k}</span>
      <span aria-hidden className="text-ink-muted">
        ·
      </span>
      <span>{name}</span>
    </span>
  );
}
