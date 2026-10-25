import { useState, type ReactNode } from 'react';
import { AffinityBar } from '@/features/evidence/AffinityBar';
import { EvidenceChip } from '@/features/evidence/EvidenceChip';
import { EvidenceProvider } from '@/features/evidence/EvidenceProvider';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { QualityPill } from '@/features/evidence/QualityPill';
import { ExperimentCard } from '@/features/experiments/ExperimentCard';
import { CampaignCard } from '@/features/plans/components/CampaignCard';
import { InsightCard } from '@/features/plans/components/InsightCard';
import { PartnershipCard } from '@/features/plans/components/PartnershipCard';
import { UnlinkedMentions } from '@/features/plans/components/UnlinkedMentions';
import { Badge, StatusChip } from '@/shared/ui/Badge';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { ChoicePills } from '@/shared/ui/ChoicePills';
import { DataTable } from '@/shared/ui/DataTable';
import { Dialog, DialogClose } from '@/shared/ui/Dialog';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SelectField, TextareaField } from '@/shared/ui/Field';
import { Logo } from '@/shared/ui/Logo';
import { ProgressSteps } from '@/shared/ui/ProgressSteps';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { SkeletonCard } from '@/shared/ui/Skeleton';
import { Switch } from '@/shared/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/Tabs';
import { PasswordField, TextField } from '@/shared/ui/TextField';
import { useToast } from '@/shared/ui/toast-context';
import { sampleReport } from './fixtures';

/**
 * Dev-only component gallery (FE-3): every shared and report component, in light and dark side by side.
 * Mounted at /dev/ui only when import.meta.env.DEV. All content is synthetic.
 */
export function UiGallery() {
  return (
    <main id="main" className="min-h-dvh bg-bg">
      <header className="border-b border-border px-6 py-5">
        <Logo />
        <h1 className="mt-3 text-[28px] text-ink">Component gallery</h1>
        <p className="text-sm text-ink-muted">
          Magic Patterns design system re-implemented with our tokens. Synthetic content only.
        </p>
      </header>
      <div className="grid xl:grid-cols-2">
        <ThemePane theme="light" />
        <ThemePane theme="dark" />
      </div>
    </main>
  );
}

function ThemePane({ theme }: { theme: 'light' | 'dark' }) {
  const report = sampleReport(`${theme}-`);
  return (
    <section data-theme={theme} aria-label={`${theme} theme`} className="min-w-0 border-border p-6 xl:border-r">
      <EvidenceProvider
        evidence={report.evidence}
        usedIn={(key, close) =>
          key === 'ev_003'
            ? [
                { label: 'Insight · tastes overlap with minimalist streetwear', onSelect: close },
                { label: 'Partnership · Sample Brand B', onSelect: close },
              ]
            : []
        }
      >
        <h2 className="mb-6 text-[22px] text-ink capitalize">{theme}</h2>
        <div className="flex flex-col gap-10">
          <Group title="Buttons">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button>Generate growth plan</Button>
              <Button size="lg">Large</Button>
              <Button variant="secondary">Save brief</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive">Delete plan</Button>
              <Button loading>Saving…</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Group>

          <Group title="Provenance, strength, status">
            <div className="flex flex-wrap items-center gap-2">
              <ProvenanceLabel kind="evidence" variant="pill" />
              <ProvenanceLabel kind="ai" variant="pill" />
              <ProvenanceLabel kind="evidence" />
              <ProvenanceLabel kind="ai" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <QualityPill quality="Strong" />
              <QualityPill quality="Moderate" />
              <QualityPill quality="Weak" />
              <Badge tone="low">Low effort</Badge>
              <Badge tone="medium">Medium effort</Badge>
              <Badge tone="outline">Proposed default</Badge>
              <Badge tone="code">dev</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status="Queued" />
              <StatusChip status="Running" />
              <StatusChip status="Completed" />
              <StatusChip status="CompletedWithLimitations" />
              <StatusChip status="Failed" />
            </div>
          </Group>

          <Group title="Evidence chips & affinity">
            <div className="flex flex-wrap gap-2">
              <EvidenceChip evidenceKey="ev_003" />
              <EvidenceChip evidenceKey="ev_002" showType />
              <EvidenceChip evidenceKey="ev_007" />
              <EvidenceChip evidenceKey="ev_999" />
            </div>
            <AffinityBar value={0.87} />
            <p className="text-xs text-ink-muted">AffinityBar renders nothing when Qloo returned no value:</p>
            <AffinityBar value={null} />
          </Group>

          <Group title="Banners">
            <Banner tone="sample">Sample plan · synthetic data</Banner>
            <Banner tone="mock">MOCK DATA — not real Qloo intelligence</Banner>
            <Banner tone="offline">You&apos;re offline. Showing your saved copy.</Banner>
            <Banner tone="limitations" title="Limitations">
              Little data was found for Lagos stores, so local pop-up venues were left out.
            </Banner>
            <Banner
              tone="danger"
              action={
                <Button size="sm" variant="secondary">
                  Retry
                </Button>
              }
            >
              Couldn&apos;t reach the research service.
            </Banner>
            <Banner tone="info">“Eko Thread Co.” brief saved.</Banner>
          </Group>

          <Group title="Form fields">
            <FormFields theme={theme} />
          </Group>

          <Group title="Progress stepper">
            <ProgressSteps
              label="Research progress"
              steps={[
                {
                  id: 'a',
                  label: 'Reading your brief',
                  state: 'done',
                  detail: 'Brand, market, goal and references read',
                },
                { id: 'b', label: 'Searching Qloo data', state: 'active', detail: '4 of 9 Qloo requests complete' },
                { id: 'c', label: 'Verifying every claim', state: 'failed', detail: 'Not enough data returned' },
                { id: 'd', label: 'Saving', state: 'pending' },
              ]}
            />
          </Group>

          <Group title="Tabs">
            <Tabs defaultValue="overview">
              <div className="border-b border-border">
                <TabsList aria-label="Plan sections">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="overview" className="pt-4 text-sm text-ink-muted">
                Overview panel
              </TabsContent>
              <TabsContent value="insights" className="pt-4 text-sm text-ink-muted">
                Insights panel
              </TabsContent>
              <TabsContent value="evidence" className="pt-4 text-sm text-ink-muted">
                Evidence panel
              </TabsContent>
            </Tabs>
          </Group>

          <Group title="Report cards">
            <InsightCard insight={report.insight} />
            <PartnershipCard partnership={report.partnership} />
            <CampaignCard campaign={report.campaign} />
            <UnlinkedMentions mentions={report.unlinked} />
          </Group>

          <Group title="Experiment cards">
            {report.experiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                onStart={() => {}}
                onRecordResult={() => {}}
                matchedRule={experiment.status === 'Concluded' ? 'success' : undefined}
              />
            ))}
          </Group>

          <Group title="Data table">
            <DataTable
              caption="Evidence"
              rows={report.evidence}
              rowKey={(row) => row.key}
              columns={[
                {
                  key: 'key',
                  header: 'Key',
                  cell: (row) => <span className="font-mono text-xs text-evidence">{row.key}</span>,
                },
                { key: 'name', header: 'Name', cell: (row) => row.name },
                {
                  key: 'affinity',
                  header: 'Affinity',
                  cell: (row) => <span className="font-mono text-xs">{row.affinity?.toFixed(2) ?? '—'}</span>,
                },
                { key: 'quality', header: 'Strength', cell: (row) => <QualityPill quality={row.quality} /> },
              ]}
            />
          </Group>

          <Group title="Empty · skeleton · overlays">
            <EmptyState title="No plans yet" action={<Button>Create your brand brief</Button>}>
              Describe your brand and goal. Your first growth plan takes about a minute.
            </EmptyState>
            <SkeletonCard />
            <Overlays />
          </Group>
        </div>
      </EvidenceProvider>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-sans text-xs font-medium tracking-wide text-ink-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

function FormFields({ theme }: { theme: string }) {
  const [offline, setOffline] = useState(true);
  const [campaigns, setCampaigns] = useState<'1' | '2' | '3'>('2');
  const [budget, setBudget] = useState('From100kTo500k');
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField label="Brand name" defaultValue="Eko Thread Co." />
      <TextField label="Target customers" error="Tell us who you sell to." />
      <SelectField
        label="Category"
        placeholder="Select a category"
        defaultValue="Streetwear"
        options={[
          { value: 'Streetwear', label: 'Streetwear' },
          { value: 'Fashion', label: 'Fashion' },
        ]}
      />
      <PasswordField label="Password" />
      <TextareaField
        label="What you sell"
        hint="Products, price range and how you sell them."
        maxLength={1000}
        count={45}
        defaultValue="Graphic tees, hoodies and caps in small runs."
        className="md:col-span-2"
      />
      <ChoicePills
        legend="Budget band"
        name={`${theme}-budget`}
        options={[
          { value: 'Under100k', label: 'Under ₦100k' },
          { value: 'From100kTo500k', label: '₦100k–₦500k' },
          { value: 'NotSure', label: 'Not sure' },
        ]}
        selected={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
      <div className="flex flex-col gap-4">
        <Switch label="Available offline" checked={offline} onCheckedChange={setOffline} />
        <SegmentedControl
          label="Number of campaigns"
          hideLabel={false}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
          ]}
          value={campaigns}
          onChange={setCampaigns}
        />
      </div>
    </div>
  );
}

function Overlays() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        Open dialog
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({ message: 'A new version is available', action: { label: 'Reload', onAction: () => {} } })
        }
      >
        Show toast
      </Button>
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Record result"
        description="Threshold: +20% vs previous 14 days"
        actions={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => setDialogOpen(false)}>Save result</Button>
          </>
        }
      >
        <TextField label="Observed result" placeholder="e.g. +26% vs previous 14 days" />
      </Dialog>
    </div>
  );
}
