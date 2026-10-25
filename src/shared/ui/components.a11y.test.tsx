import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { sampleReport } from '@/dev/fixtures';
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
import { expectNoAxeViolations } from '@/test/axe';
import { Badge, StatusChip } from './Badge';
import { Banner } from './Banner';
import { Button } from './Button';
import { ChoicePills } from './ChoicePills';
import { DataTable } from './DataTable';
import { Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { SelectField, TextareaField } from './Field';
import { ProgressSteps } from './ProgressSteps';
import { SegmentedControl } from './SegmentedControl';
import { SkeletonCard } from './Skeleton';
import { Switch } from './Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { PasswordField, TextField } from './TextField';
import { TooltipProvider } from './Tooltip';

const report = sampleReport();

function withProviders(ui: ReactElement) {
  return (
    <MemoryRouter>
      <TooltipProvider>
        <EvidenceProvider evidence={report.evidence}>{ui}</EvidenceProvider>
      </TooltipProvider>
    </MemoryRouter>
  );
}

const cases: [string, ReactElement][] = [
  [
    'Button variants',
    <div key="b">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
    </div>,
  ],
  ['TextField with error', <TextField key="t" label="Brand name" error="Enter your brand name." />],
  ['PasswordField', <PasswordField key="p" label="Password" />],
  [
    'TextareaField with counter',
    <TextareaField key="ta" label="What you sell" maxLength={1000} count={12} hint="Products" />,
  ],
  ['SelectField', <SelectField key="s" label="Category" placeholder="Select" options={[{ value: 'a', label: 'A' }]} />],
  [
    'ChoicePills',
    <ChoicePills
      key="c"
      legend="Budget"
      name="budget"
      selected="a"
      onChange={() => {}}
      options={[
        { value: 'a', label: 'Under ₦100k' },
        { value: 'b', label: 'Not sure' },
      ]}
    />,
  ],
  ['Switch', <Switch key="sw" label="Available offline" checked onCheckedChange={() => {}} />],
  [
    'Banners',
    <div key="bn">
      <Banner tone="sample">Sample plan · synthetic data</Banner>
      <Banner tone="mock">MOCK DATA</Banner>
      <Banner tone="offline">Offline</Banner>
      <Banner tone="limitations" title="Limitations">
        Thin data
      </Banner>
      <Banner tone="danger">Failed</Banner>
    </div>,
  ],
  [
    'Chips and pills',
    <div key="ch">
      <StatusChip status="Running" />
      <StatusChip status="Failed" />
      <Badge tone="medium">Medium effort</Badge>
      <ProvenanceLabel kind="evidence" />
      <ProvenanceLabel kind="ai" variant="pill" />
      <QualityPill quality="Moderate" />
    </div>,
  ],
  [
    'Evidence chips incl. missing key',
    <div key="ev">
      <EvidenceChip evidenceKey="ev_003" />
      <EvidenceChip evidenceKey="ev_404" />
    </div>,
  ],
  ['AffinityBar', <AffinityBar key="af" value={0.87} />],
  [
    'ProgressSteps',
    <ProgressSteps
      key="ps"
      label="Research progress"
      steps={[
        { id: '1', label: 'Reading your brief', state: 'done' },
        { id: '2', label: 'Searching Qloo data', state: 'active', detail: '4 of 9 requests complete' },
        { id: '3', label: 'Saving', state: 'pending' },
      ]}
    />,
  ],
  [
    'Tabs',
    <Tabs key="tb" defaultValue="a">
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">Overview</TabsTrigger>
        <TabsTrigger value="b">Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A</TabsContent>
      <TabsContent value="b">B</TabsContent>
    </Tabs>,
  ],
  ['EmptyState', <EmptyState key="es" title="No plans yet" action={<Button>Create</Button>} />],
  ['SkeletonCard', <SkeletonCard key="sk" />],
  [
    'DataTable',
    <DataTable
      key="dt"
      caption="Evidence"
      rows={report.evidence}
      rowKey={(r) => r.key}
      columns={[{ key: 'name', header: 'Name', cell: (r) => r.name }]}
    />,
  ],
  ['InsightCard', <InsightCard key="ic" insight={report.insight} />],
  ['PartnershipCard', <PartnershipCard key="pc" partnership={report.partnership} />],
  ['CampaignCard', <CampaignCard key="cc" campaign={report.campaign} />],
  [
    'ExperimentCards (all states)',
    <div key="ex">
      {report.experiments.map((e) => (
        <ExperimentCard key={e.id} experiment={e} onStart={() => {}} onRecordResult={() => {}} />
      ))}
    </div>,
  ],
  ['UnlinkedMentions', <UnlinkedMentions key="um" mentions={report.unlinked} />],
];

describe('component accessibility (axe)', () => {
  it.each(cases)('%s has no violations', async (_name, ui) => {
    const { container } = render(withProviders(ui));
    await expectNoAxeViolations(container);
  });

  it('open dialog has no violations', async () => {
    render(
      withProviders(
        <Dialog open onOpenChange={() => {}} title="Record result" actions={<Button>Save result</Button>}>
          <TextField label="Observed result" />
        </Dialog>,
      ),
    );
    await expectNoAxeViolations(document.body);
  });

  it('open evidence drawer has no violations', async () => {
    const user = userEvent.setup();
    render(withProviders(<EvidenceChip evidenceKey="ev_003" />));
    await user.click(screen.getByRole('button', { name: 'Open evidence ev_003 Sample Brand B' }));
    await screen.findByRole('dialog');
    await expectNoAxeViolations(document.body);
  });
});

describe('component behaviour', () => {
  it('evidence chip opens the drawer with what Qloo returned, and Escape closes it', async () => {
    const user = userEvent.setup();
    render(withProviders(<EvidenceChip evidenceKey="ev_003" />));
    await user.click(screen.getByRole('button', { name: /ev_003/ }));

    const drawer = await screen.findByRole('dialog', { name: 'Sample Brand B' });
    expect(within(drawer).getByText('Retrieved from Qloo')).toBeInTheDocument();
    expect(within(drawer).getByText('0.91')).toBeInTheDocument();
    expect(within(drawer).getByText('resolved from your reference')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Radix restores focus to the opener once the focus scope unmounts.
    await waitFor(() => expect(screen.getByRole('button', { name: /ev_003/ })).toHaveFocus());
  });

  it('drawer hides affinity when Qloo returned none', async () => {
    const user = userEvent.setup();
    render(withProviders(<EvidenceChip evidenceKey="ev_011" />));
    await user.click(screen.getByRole('button', { name: /ev_011/ }));
    const drawer = await screen.findByRole('dialog', { name: 'upcycling' });
    expect(within(drawer).queryByText('Affinity')).not.toBeInTheDocument();
    expect(within(drawer).getByText('Popularity')).toBeInTheDocument();
  });

  it('unknown evidence key renders a visible "missing evidence" chip and logs it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(withProviders(<EvidenceChip evidenceKey="ev_404" />));
    expect(screen.getByText('missing evidence')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('ev_404'));
    error.mockRestore();
  });

  it('quality pill explains itself to keyboard and screen-reader users', () => {
    render(withProviders(<QualityPill quality="Strong" />));
    expect(
      screen.getByRole('button', {
        name: 'Strong evidence. Heuristic based on how this was retrieved — not a probability.',
      }),
    ).toBeInTheDocument();
  });

  it('affinity bar renders nothing without a value — no invented scale', () => {
    const { container } = render(<AffinityBar value={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('segmented control moves selection with arrow keys', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState<'1' | '2' | '3'>('2');
      return (
        <SegmentedControl
          label="Number of campaigns"
          value={value}
          onChange={setValue}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
          ]}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: '2' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '3' })).toHaveFocus();
  });

  it('switch toggles aria-checked', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Available offline" checked={on} onCheckedChange={setOn} />;
    }
    render(<Harness />);
    const toggle = screen.getByRole('switch', { name: 'Available offline' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('experiment card offers the right action per status and highlights the matched rule', () => {
    const [proposed, running, concluded] = report.experiments;
    const { rerender } = render(
      withProviders(<ExperimentCard experiment={proposed!} onStart={() => {}} onRecordResult={() => {}} />),
    );
    expect(screen.getByRole('button', { name: /Start experiment/ })).toBeInTheDocument();
    expect(screen.getByText('Proposed default')).toBeInTheDocument();

    rerender(withProviders(<ExperimentCard experiment={running!} onStart={() => {}} onRecordResult={() => {}} />));
    expect(screen.getByRole('button', { name: /Record result/ })).toBeInTheDocument();
    expect(screen.getByText(/days left/)).toBeInTheDocument();

    rerender(withProviders(<ExperimentCard experiment={concluded!} matchedRule="success" />));
    expect(screen.queryByRole('button', { name: /Start|Record/ })).not.toBeInTheDocument();
    expect(screen.getByText('+26% vs previous 14 days')).toBeInTheDocument();
    expect(screen.getByText('Matches your result')).toBeInTheDocument();
  });
});
