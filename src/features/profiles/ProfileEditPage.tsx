import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { isAppError } from '@/shared/api/problem';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogClose } from '@/shared/ui/Dialog';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { useProfile, useUpdateProfile } from './api';
import { ProfileForm, type SubmitIntent } from './ProfileForm';
import { fromDto, type BusinessProfileRequest } from './profileSchema';

export function ProfileEditPage() {
  const { profileId = '' } = useParams();
  const navigate = useNavigate();
  const query = useProfile(profileId);
  const update = useUpdateProfile(profileId);
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Remount the form only when the user explicitly reloads — not after their own successful save.
  const [formGeneration, setFormGeneration] = useState(0);

  if (query.isPending) return <FullPageStatus label="Loading your brief…" />;
  // Error states sit in the same page frame as the form.
  if (query.isError) {
    if (isAppError(query.error) && query.error.code === 'not_found') {
      return (
        <PageContainer narrow>
          <ErrorState title="Brief not found">
            This brief doesn&apos;t exist or belongs to another account.{' '}
            <Link to="/app/plans" className="font-medium text-primary hover:underline">
              Back to your plans
            </Link>
            .
          </ErrorState>
        </PageContainer>
      );
    }
    return (
      <PageContainer narrow>
        <ErrorState title="We couldn't load this brief" error={query.error} onRetry={() => void query.refetch()} />
      </PageContainer>
    );
  }

  const { profile, etag } = query.data;

  const onSubmit = async (body: BusinessProfileRequest, intent: SubmitIntent) => {
    setSavedAt(null);
    try {
      await update.mutateAsync({ body, etag });
    } catch (error) {
      if (isAppError(error) && (error.code === 'version_mismatch' || error.status === 412)) {
        setConflict(true);
        return;
      }
      throw error;
    }
    if (intent === 'generate') navigate(`/app/profiles/${profileId}/generate`);
    else setSavedAt(Date.now());
  };

  const reloadLatest = async () => {
    setReloading(true);
    await query.refetch();
    setReloading(false);
    setConflict(false);
    setFormGeneration((g) => g + 1);
  };

  return (
    <PageContainer narrow>
      <PageHeader title="Edit brief" description={profile.brandName} />
      {savedAt && (
        <Banner
          tone="info"
          title="Changes saved."
          className="mt-6"
          action={
            <Link to={`/app/profiles/${profileId}/generate`} className="text-sm font-medium text-primary">
              Generate a plan
            </Link>
          }
        />
      )}
      <div className="mt-8">
        <ProfileForm key={formGeneration} initialValues={fromDto(profile)} onSubmit={onSubmit} editing />
      </div>

      <Dialog
        open={conflict}
        onOpenChange={setConflict}
        title="This brief changed elsewhere — reload?"
        description="Someone (or another tab) saved this brief after you opened it. Reload to get the latest version; your unsaved edits on this page will be replaced."
        actions={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Keep editing</Button>
            </DialogClose>
            <Button onClick={() => void reloadLatest()} loading={reloading}>
              Reload latest
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}
