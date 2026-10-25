import * as RadixTabs from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

/** Underlined tab list (plan header). Scrolls horizontally on narrow screens instead of wrapping. */
export function TabsList({ className, ...rest }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('-mb-px flex [scrollbar-width:none] gap-7 overflow-x-auto text-sm font-semibold', className)}
      {...rest}
    />
  );
}

export function TabsTrigger({ className, ...rest }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'border-b-2 border-transparent pb-3 whitespace-nowrap text-ink-muted transition-colors hover:text-ink',
        'data-[state=active]:border-primary data-[state=active]:text-ink',
        className,
      )}
      {...rest}
    />
  );
}
