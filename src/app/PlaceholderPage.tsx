import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { EmptyState } from '@/shared/ui/EmptyState';

/** Stand-in for screens delivered by later slices (FE-02 build plan). */
export function PlaceholderPage({ title, slice }: { title: string; slice: string }) {
  return (
    <PageContainer>
      <PageHeader title={title} />
      <div className="mt-8">
        <EmptyState title="Coming soon">This screen arrives in slice {slice}.</EmptyState>
      </div>
    </PageContainer>
  );
}
