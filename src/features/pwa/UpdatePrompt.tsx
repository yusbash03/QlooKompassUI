import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@/shared/ui/toast-context';

/** registerType 'prompt' (FE-01 §7): a new version waits until the user chooses to reload. */
export function UpdatePrompt() {
  const toast = useToast();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    setNeedRefresh(false);
    toast({
      message: 'A new version of Kulture Compass is available.',
      action: { label: 'Reload', onAction: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, setNeedRefresh, toast, updateServiceWorker]);

  return null;
}
