import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Download, LogOut, Monitor, Moon, Sun, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTheme, type ThemePreference } from '@/app/theme';
import { useAuth } from '@/features/auth/auth-context';
import { useRemoveAllOfflineCopies } from '@/features/offline/useOfflineCopies';
import { isIos, isStandalone, promptInstall, useInstallState } from '@/features/pwa/install-store';
import { IosInstallInstructions } from '@/features/pwa/IosInstallInstructions';
import { useToast } from '@/shared/ui/toast-context';

const itemClasses =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink outline-none data-highlighted:bg-surface-muted';

const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
];

function isTheme(value: string): value is ThemePreference {
  return themes.some((t) => t.value === value);
}

/**
 * Account menu opened from the sidebar user button (desktop) or the "Account" tab (phones), Magic Patterns style.
 * "Install app" appears when the browser offers installing, or on iOS (manual steps) — never once installed.
 */
export function AccountMenu({ trigger, side = 'top' }: { trigger: ReactNode; side?: 'top' | 'right' }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const removeOffline = useRemoveAllOfflineCopies();
  const toast = useToast();
  const { canPrompt } = useInstallState();
  const [iosHelp, setIosHelp] = useState(false);
  const installable = !isStandalone() && (canPrompt || isIos());

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side={side}
            align="start"
            sideOffset={8}
            className="z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-(--radius-card) border border-border bg-surface p-1.5 shadow-[0_8px_24px_rgba(20,18,43,0.12)]"
          >
            <DropdownMenu.RadioGroup value={theme} onValueChange={(value) => isTheme(value) && setTheme(value)}>
              {themes.map(({ value, label, icon: Icon }) => (
                <DropdownMenu.RadioItem key={value} value={value} className={itemClasses}>
                  <Icon aria-hidden className="size-4 text-ink-muted" />
                  <span className="flex-1">{label}</span>
                  <DropdownMenu.ItemIndicator>
                    <Check aria-hidden className="size-4 text-primary" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              className={itemClasses}
              onSelect={() =>
                removeOffline.mutate(undefined, {
                  onSuccess: () => toast({ message: 'Offline copies removed from this device' }),
                })
              }
            >
              <Trash2 aria-hidden className="size-4 text-ink-muted" />
              Remove offline copies
            </DropdownMenu.Item>
            {installable && (
              <DropdownMenu.Item
                className={itemClasses}
                onSelect={() => (canPrompt ? void promptInstall() : setIosHelp(true))}
              >
                <Download aria-hidden className="size-4 text-ink-muted" />
                Install app
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item className={itemClasses} onSelect={() => void handleSignOut()}>
              <LogOut aria-hidden className="size-4 text-ink-muted" />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <IosInstallInstructions open={iosHelp} onOpenChange={setIosHelp} />
    </>
  );
}
