import { WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { PageContainer } from '@/shared/layout/PageHeader';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { buttonClasses } from '@/shared/ui/button-classes';
import { EmptyState } from '@/shared/ui/EmptyState';

/** /offline — where to go without a connection (FE-01 §7). Offline, the app shell itself still loads from the SW. */
export function OfflinePage() {
  const online = useOnlineStatus();

  return (
    <PageContainer narrow>
      <div className="mt-8">
        {online ? (
          <EmptyState
            headingLevel="h1"
            title="You’re back online"
            action={
              <Link to="/app/plans" className={buttonClasses()}>
                Go to your plans
              </Link>
            }
          >
            Everything is available again.
          </EmptyState>
        ) : (
          <EmptyState
            headingLevel="h1"
            icon={WifiOff}
            title="You’re offline"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/app/plans" className={buttonClasses()}>
                  Open saved plans
                </Link>
                <Link to="/sample" className={buttonClasses({ variant: 'secondary' })}>
                  View the sample plan
                </Link>
              </div>
            }
          >
            Plans you made available offline can still be read. Generating a new plan needs a connection to our research
            service.
          </EmptyState>
        )}
      </div>
    </PageContainer>
  );
}
