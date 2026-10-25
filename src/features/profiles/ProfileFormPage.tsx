import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth/auth-context';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { useCreateProfile } from './api';
import { draftStore } from './draftStore';
import { ProfileForm, type SubmitIntent } from './ProfileForm';
import { emptyProfile, type BusinessProfileRequest, type ProfileFormInput } from './profileSchema';

export interface PlansFlashState {
  flash: string;
}

export function ProfileFormPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const create = useCreateProfile();
  const [restoredDraft, setRestoredDraft] = useState(() => draftStore.get(user.id));
  const [formKey, setFormKey] = useState(0);
  const saved = useRef(false);

  const onSubmit = async (body: BusinessProfileRequest, intent: SubmitIntent) => {
    const { profile } = await create.mutateAsync(body);
    saved.current = true;
    draftStore.clear(user.id);
    if (intent === 'generate') {
      navigate(`/app/profiles/${profile.id}/generate`);
    } else {
      navigate('/app/plans', { state: { flash: `“${profile.brandName}” brief saved.` } satisfies PlansFlashState });
    }
  };

  const activeForm = useRef(formKey);
  // Bound per form instance: when "Start over" swaps in a fresh form, the old one unmounts and must not re-save its values.
  const draftHandler = (instance: number) => (values: ProfileFormInput) => {
    if (!saved.current && instance === activeForm.current) draftStore.set(user.id, values);
  };

  const startOver = () => {
    draftStore.clear(user.id);
    setRestoredDraft(undefined);
    activeForm.current = formKey + 1;
    setFormKey(formKey + 1);
  };

  return (
    <PageContainer narrow>
      <PageHeader
        title="New brand brief"
        description="About ten minutes. You can edit it any time before generating."
      />
      {restoredDraft && (
        <Banner
          tone="info"
          className="mt-6"
          action={
            <Button variant="ghost" size="sm" onClick={startOver}>
              Start over
            </Button>
          }
        >
          We kept your unsaved answers from earlier in this session.
        </Banner>
      )}
      <div className="mt-8">
        <ProfileForm
          key={formKey}
          initialValues={restoredDraft ?? emptyProfile}
          onSubmit={onSubmit}
          onDraft={draftHandler(formKey)}
        />
      </div>
    </PageContainer>
  );
}
