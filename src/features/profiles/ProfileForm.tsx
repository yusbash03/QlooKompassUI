import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FormProvider, useForm, type FieldErrors, type Path } from 'react-hook-form';
import { isAppError } from '@/shared/api/problem';
import { cn } from '@/shared/lib/cn';
import { applyFieldErrors } from '@/shared/lib/forms';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import {
  profileSchema,
  toRequest,
  type BusinessProfileRequest,
  type ProfileFormInput,
  type ProfileFormValues,
} from './profileSchema';
import { BrandStep, GoalStep, ProductsStep, ReferencesStep, ReviewStep } from './ProfileFormSteps';

export type SubmitIntent = 'save' | 'generate';

type FieldName = Path<ProfileFormInput>;

const STEPS: { title: string; fields: readonly FieldName[] }[] = [
  { title: 'Brand', fields: ['brandName', 'category', 'categoryOther', 'description', 'brandIdentity'] },
  { title: 'Products & market', fields: ['productsDescription', 'targetMarket', 'primaryLocation'] },
  { title: 'Goal & budget', fields: ['marketingObjective', 'objectiveNotes', 'budgetRange'] },
  { title: 'Cultural references', fields: ['referenceEntities'] },
  { title: 'Review', fields: [] },
];
const REVIEW_STEP = STEPS.length - 1;

/** Step holding a field; accepts form paths ("referenceEntities.0.name") and server keys ("ReferenceEntities[0].Name"). */
function stepOf(field: string): number {
  const first = field.split(/[.[]/)[0] ?? '';
  const root = first.charAt(0).toLowerCase() + first.slice(1);
  const index = STEPS.findIndex((s) => s.fields.some((f) => f === root));
  return index === -1 ? REVIEW_STEP : index;
}

function firstErrorStep(errors: FieldErrors<ProfileFormInput>): number {
  const steps = Object.keys(errors).map(stepOf);
  return steps.length > 0 ? Math.min(...steps) : REVIEW_STEP;
}

interface ProfileFormProps {
  initialValues: ProfileFormInput;
  /** Throws AppError on failure; validation problems are mapped onto fields here, everything else becomes a banner. */
  onSubmit: (request: BusinessProfileRequest, intent: SubmitIntent) => Promise<void>;
  /** Called with the latest values when the form unmounts (in-memory draft for new briefs). */
  onDraft?: (values: ProfileFormInput) => void;
  /** Existing briefs: every step is reachable from the stepper straight away. */
  editing?: boolean;
}

/** Five-step brand brief (FE-01 §5, design brief §4.4). Only steps 1–3 have required fields. */
export function ProfileForm({ initialValues, onSubmit, onDraft, editing = false }: ProfileFormProps) {
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
    // No validation on blur: a message appearing/disappearing on blur shifts the layout during the mousedown on
    // "Continue", so the mouseup misses the button and the click is lost. Errors show on Continue/submit instead…
    mode: 'onSubmit',
  });
  const { handleSubmit, trigger, setError, getValues, subscribe, getFieldState } = form;

  // …and a field that is showing an error is re-checked on every change, so fixing it clears the message at once.
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ name, type }) => {
          // RHF reports internal names as plain strings; they are always paths of this form.
          const field = name as FieldName | undefined;
          if (type === 'change' && field && getFieldState(field).error) void trigger(field);
        },
      }),
    [subscribe, getFieldState, trigger],
  );
  const online = useOnlineStatus();

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(editing ? REVIEW_STEP : 0);
  const [formError, setFormError] = useState<string | null>(null);
  const [stepBlocked, setStepBlocked] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<SubmitIntent | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const onDraftRef = useRef(onDraft);
  useEffect(() => {
    onDraftRef.current = onDraft;
  });
  useEffect(() => () => onDraftRef.current?.(getValues()), [getValues]);

  // Move focus to the new step's heading so keyboard and screen-reader users land at the start of it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const goTo = (next: number) => {
    setStepBlocked(false);
    setStep(next);
    setFurthest((f) => Math.max(f, next));
  };

  const next = async () => {
    const fields = STEPS[step]?.fields ?? [];
    if (fields.length === 0 || (await trigger([...fields]))) goTo(step + 1);
    else setStepBlocked(true);
  };

  const onFormSubmit = (event: FormEvent) => {
    // Enter in a field means "Continue" — saving only ever happens from the explicit Review buttons.
    event.preventDefault();
    if (step < REVIEW_STEP) void next();
  };

  const submit = (intent: SubmitIntent) =>
    handleSubmit(
      async (values) => {
        setFormError(null);
        setPendingIntent(intent);
        try {
          await onSubmit(toRequest(values), intent);
        } catch (error) {
          if (isAppError(error) && error.code === 'validation_failed') {
            const known = [
              ...STEPS.flatMap((s) => s.fields),
              ...values.referenceEntities.map((_, i) => `referenceEntities.${i}.name` as FieldName),
            ];
            const unmatched = applyFieldErrors(setError, error.fieldErrors, known);
            const mapped = Object.keys(error.fieldErrors).map(stepOf);
            setFormError(
              unmatched.length > 0
                ? unmatched.join(' ')
                : 'Some answers need fixing — we’ve taken you to the first one.',
            );
            goTo(Math.min(REVIEW_STEP, ...mapped));
            return;
          }
          setFormError(errorMessage(error));
        } finally {
          setPendingIntent(null);
        }
      },
      (errors) => goTo(firstErrorStep(errors)),
    )();

  const current = STEPS[step] ?? STEPS[0]!;

  return (
    <FormProvider {...form}>
      <form onSubmit={onFormSubmit} noValidate className="flex flex-col">
        <Stepper step={step} furthest={furthest} onSelect={goTo} />

        {(formError || stepBlocked) && (
          <Banner tone="danger" className="mt-8">
            {formError ?? 'Some fields need attention before you can continue.'}
          </Banner>
        )}

        <section aria-labelledby="step-heading" className="mt-8">
          <h2 id="step-heading" ref={heading} tabIndex={-1} className="text-[22px] text-ink outline-none">
            {current.title}
            {step === 3 && <span className="ml-2 font-sans text-sm font-normal text-ink-muted">(optional)</span>}
          </h2>
          <div className="mt-6">
            {step === 0 && <BrandStep />}
            {step === 1 && <ProductsStep />}
            {step === 2 && <GoalStep />}
            {step === 3 && <ReferencesStep />}
            {step === REVIEW_STEP && <ReviewStep onEdit={goTo} />}
          </div>
        </section>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => goTo(step - 1)}>
              <ArrowLeft aria-hidden className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < REVIEW_STEP ? (
            <Button type="submit">
              Continue
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => void submit('save')}
                  loading={pendingIntent === 'save'}
                  disabled={!online || pendingIntent !== null}
                >
                  Save brief
                </Button>
                <Button
                  onClick={() => void submit('generate')}
                  loading={pendingIntent === 'generate'}
                  disabled={!online || pendingIntent !== null}
                >
                  Save &amp; generate plan
                </Button>
              </div>
              {!online && <p className="text-sm text-ink-muted">Saving needs an internet connection.</p>}
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function errorMessage(error: unknown): string {
  if (isAppError(error)) {
    if (error.isNetwork) return "We couldn't reach Kulture Compass. Your answers are still here — try again.";
    if (error.code === 'payload_too_large')
      return 'This brief is too long to save. Shorten some answers and try again.';
    if (error.code === 'rate_limited') return 'Too many requests. Please wait a minute and try again.';
    if (error.traceId) return `We couldn't save your brief. Please try again. (Reference: ${error.traceId})`;
  }
  return "We couldn't save your brief. Please try again.";
}

function Stepper({ step, furthest, onSelect }: { step: number; furthest: number; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Brief steps">
      <div className="sm:hidden" aria-hidden>
        <p className="text-sm font-medium text-ink">
          Step {step + 1} of {STEPS.length} · <span className="text-ink-muted">{STEPS[step]?.title}</span>
        </p>
        <div className="mt-2 h-1 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="sr-only sm:not-sr-only sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
        {STEPS.map((s, index) => {
          const current = index === step;
          const done = index < step;
          const reachable = index <= furthest;
          return (
            <li key={s.title} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pr-1 text-sm disabled:cursor-default',
                  current ? 'font-medium text-ink' : 'text-ink-muted',
                  reachable && !current && 'hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                    current && 'bg-primary text-primary-ink',
                    done && 'bg-ink text-bg',
                    !current && !done && 'border border-border text-ink-muted',
                  )}
                >
                  {done ? <Check aria-hidden className="size-3.5" /> : index + 1}
                </span>
                {s.title}
                {done && <span className="sr-only"> (completed)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
