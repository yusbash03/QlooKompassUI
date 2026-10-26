import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useCurrentUser } from '@/features/auth/auth-context';
import type { Experiment } from '@/features/evidence/types';
import { isAppError } from '@/shared/api/problem';
import { queryKeys } from '@/shared/api/queryKeys';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogClose } from '@/shared/ui/Dialog';
import { useToast } from '@/shared/ui/toast-context';
import { useUpdateExperiment } from './api';
import { experimentLabel } from './experiment-format';
import { outcomeStore, useMatchedRule } from './outcome-store';
import { RecordResultDialog, type RecordedResult } from './RecordResultDialog';

interface ExperimentActionsProps {
  planId: string;
  experiment: Experiment;
  children: (props: {
    onStart?: () => void;
    onRecordResult?: () => void;
    matchedRule?: 'success' | 'failure';
    busy: boolean;
  }) => ReactNode;
}

/**
 * Wires "Start experiment" and "Record result" (FE-6b) for any experiment card — on the plan and in the hub.
 * Offline, the actions are hidden: changes need a connection.
 */
export function ExperimentActions({ planId, experiment, children }: ExperimentActionsProps) {
  const update = useUpdateExperiment();
  const queryClient = useQueryClient();
  const keys = queryKeys.user(useCurrentUser().id);
  const online = useOnlineStatus();
  const toast = useToast();
  const matchedRule = useMatchedRule(planId, experiment.id);
  const [recording, setRecording] = useState(false);
  const [conflict, setConflict] = useState(false);
  const label = experimentLabel(experiment.id);

  const handleError = (error: unknown) => {
    if (isAppError(error) && (error.code === 'version_mismatch' || error.status === 412)) {
      setRecording(false);
      setConflict(true);
      return;
    }
    toast({
      message:
        isAppError(error) && error.isNetwork
          ? 'Couldn’t reach the server — try again.'
          : 'Couldn’t update this experiment.',
    });
  };

  const start = () =>
    update.mutate(
      { planId, experiment, body: { status: 'Running' } },
      { onSuccess: () => toast({ message: `${label} started` }), onError: handleError },
    );

  const save = (result: RecordedResult) =>
    update.mutate(
      {
        planId,
        experiment,
        body: { status: result.status, observedResult: result.observedResult, resultNotes: result.resultNotes },
      },
      {
        onSuccess: () => {
          if (result.matched) outcomeStore.set(planId, experiment.id, result.matched);
          setRecording(false);
          toast({ message: result.status === 'Concluded' ? `${label} concluded` : `${label} abandoned` });
        },
        onError: handleError,
      },
    );

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: keys.plan(planId) });
    await queryClient.invalidateQueries({ queryKey: [...keys.all, 'experiments'] });
    setConflict(false);
  };

  return (
    <>
      {children({
        onStart: online ? start : undefined,
        onRecordResult: online ? () => setRecording(true) : undefined,
        matchedRule,
        busy: update.isPending,
      })}
      {recording && (
        <RecordResultDialog
          experiment={experiment}
          open={recording}
          onOpenChange={setRecording}
          onSave={save}
          saving={update.isPending}
        />
      )}
      <Dialog
        open={conflict}
        onOpenChange={setConflict}
        title="This experiment changed elsewhere — reload?"
        description="Someone (or another tab) updated this experiment after you opened it. Reload to see its latest state before changing it."
        actions={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => void reload()}>Reload</Button>
          </>
        }
      />
    </>
  );
}
