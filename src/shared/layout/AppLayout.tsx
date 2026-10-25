import { ChevronsUpDown, FileText, FlaskConical, Plus, Scale, UserRound, type LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { useCurrentUser } from '@/features/auth/auth-context';
import { useEvaluationEnabled } from '@/shared/api/useMeta';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Logo } from '@/shared/ui/Logo';
import { AccountMenu } from './AccountMenu';
import { MockModeBanner } from './MockModeBanner';
import { OfflineBanner } from './OfflineBanner';
import { TopBar } from './TopBar';

interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  dev?: boolean;
}

const baseItems: NavItem[] = [
  { to: '/app/plans', label: 'Plans', shortLabel: 'Plans', icon: FileText },
  { to: '/app/profiles/new', label: 'New brief', shortLabel: 'New', icon: Plus },
  { to: '/app/experiments', label: 'Experiments', shortLabel: 'Experiments', icon: FlaskConical },
];
const evaluationItem: NavItem = {
  to: '/app/evaluate',
  label: 'Evaluation',
  shortLabel: 'Eval',
  icon: Scale,
  dev: true,
};

/** Magic Patterns app shell: light sidebar ≥ 768px with the account switcher at the bottom; bottom tab bar on phones. */
export function AppLayout() {
  const user = useCurrentUser();
  const evaluationEnabled = useEvaluationEnabled();
  const items = evaluationEnabled ? [...baseItems, evaluationItem] : baseItems;
  const name = user.displayName ?? user.email.split('@')[0] ?? user.email;

  return (
    <div className="min-h-dvh w-full bg-bg md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface md:flex">
        <div className="px-5 py-5">
          <Link to="/app/plans" className="rounded-md" aria-label="Kulture Compass — plans">
            <Logo />
          </Link>
        </div>
        <nav aria-label="App" className="flex-1 px-3">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-(--radius-input) px-3 py-2 text-sm transition-colors duration-150',
                      isActive
                        ? 'bg-surface-muted font-medium text-ink'
                        : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon aria-hidden className={cn('size-4 shrink-0', isActive && 'text-primary')} />
                      {item.label}
                      {item.dev && (
                        <Badge tone="code" className="ml-auto">
                          dev
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3">
          <AccountMenu
            trigger={
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-(--radius-input) px-2 py-2 text-left transition-colors hover:bg-surface-muted data-[state=open]:bg-surface-muted"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-xs font-semibold text-bg uppercase"
                >
                  {name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="sr-only">Account menu: </span>
                  <span className="block truncate text-sm font-medium text-ink">{name}</span>
                  <span className="block truncate text-xs text-ink-muted">{user.email}</span>
                </span>
                <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-ink-muted" />
              </button>
            }
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <TopBar />
        <OfflineBanner />
        <MockModeBanner />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {baseItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                isActive ? 'font-medium text-primary' : 'text-ink-muted',
              )
            }
          >
            <item.icon aria-hidden className="size-5" />
            {item.shortLabel}
          </NavLink>
        ))}
        <AccountMenu
          trigger={
            <button type="button" className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-ink-muted">
              <UserRound aria-hidden className="size-5" />
              Account
            </button>
          }
        />
      </nav>
    </div>
  );
}
