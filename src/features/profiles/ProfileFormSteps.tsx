import { useFormContext, useWatch } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { ChoicePills } from '@/shared/ui/ChoicePills';
import { SelectField, TextareaField } from '@/shared/ui/Field';
import { TextField } from '@/shared/ui/TextField';
import { BUDGETS, CATEGORIES, labelOf, LOCATION_SUGGESTIONS, OBJECTIVES, REFERENCE_KINDS } from './profile-options';
import type { ProfileFormInput, ProfileFormValues } from './profileSchema';
import { ReferenceEntitiesField } from './ReferenceEntitiesField';

function useProfileForm() {
  return useFormContext<ProfileFormInput, unknown, ProfileFormValues>();
}

export function BrandStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useProfileForm();
  const [category, brandIdentity] = useWatch({ control, name: ['category', 'brandIdentity'] });

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="Brand name"
        placeholder="e.g. Eko Thread Co."
        autoComplete="organization"
        error={errors.brandName?.message}
        {...register('brandName')}
      />
      <SelectField
        label="Category"
        placeholder="Select a category"
        options={CATEGORIES}
        controlClassName="sm:max-w-xs"
        error={errors.category?.message}
        {...register('category')}
      />
      {category === 'Other' && (
        <TextField
          label="Your category"
          placeholder="e.g. Textiles"
          error={errors.categoryOther?.message}
          {...register('categoryOther')}
        />
      )}
      <TextField
        label="Short description"
        optional
        hint="One line about what your brand is."
        placeholder="e.g. Lagos streetwear label selling graphic tees, hoodies and caps"
        maxLength={1000}
        error={errors.description?.message}
        {...register('description')}
      />
      <TextareaField
        label="Brand identity"
        optional
        hint="Your tone and aesthetic in a few words."
        placeholder="e.g. Bold graphics, city pride, a little irreverent"
        maxLength={500}
        count={brandIdentity.length}
        error={errors.brandIdentity?.message}
        {...register('brandIdentity')}
      />
    </div>
  );
}

export function ProductsStep() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useProfileForm();
  const [productsDescription, primaryLocation] = useWatch({
    control,
    name: ['productsDescription', 'primaryLocation'],
  });

  return (
    <div className="flex flex-col gap-6">
      <TextareaField
        label="What you sell"
        hint="Products, price range and how you sell them."
        placeholder="e.g. Graphic tees, hoodies and caps in small runs, sold on Instagram"
        maxLength={1000}
        count={productsDescription.length}
        error={errors.productsDescription?.message}
        {...register('productsDescription')}
      />
      <TextField
        label="Target customers"
        optional
        hint="Who buys from you today, or who you want to reach."
        placeholder="e.g. 18–30s who shop on Instagram"
        error={errors.targetMarket?.message}
        {...register('targetMarket')}
      />
      <div className="flex flex-col gap-2.5">
        <TextField
          label="Main location"
          optional
          placeholder="e.g. Lagos"
          error={errors.primaryLocation?.message}
          {...register('primaryLocation')}
        />
        <div role="group" aria-label="Location suggestions" className="flex flex-wrap gap-2">
          {LOCATION_SUGGESTIONS.map((city) => {
            const selected = primaryLocation === city;
            return (
              <button
                key={city}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue('primaryLocation', city, { shouldDirty: true, shouldValidate: true })}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-ink hover:bg-surface-muted',
                )}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GoalStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useProfileForm();
  const [objective, objectiveNotes, budgetRange] = useWatch({
    control,
    name: ['marketingObjective', 'objectiveNotes', 'budgetRange'],
  });
  const objectiveError = errors.marketingObjective?.message;

  return (
    <div className="flex flex-col gap-7">
      <fieldset aria-describedby={objectiveError ? 'objective-error' : undefined}>
        <legend className={cn('mb-2.5 text-sm font-medium', objectiveError ? 'text-danger' : 'text-ink')}>
          Marketing goal
        </legend>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer gap-3 rounded-(--radius-card) border p-4 transition-colors',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                objective === value
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface hover:bg-surface-muted',
              )}
            >
              <input type="radio" value={value} className="sr-only" {...register('marketingObjective')} />
              <Icon
                aria-hidden
                className={cn('mt-0.5 size-5 shrink-0', objective === value ? 'text-primary' : 'text-ink-muted')}
              />
              <span>
                <span className="block font-heading font-semibold text-ink">{label}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
              </span>
            </label>
          ))}
        </div>
        {objectiveError && (
          <p id="objective-error" className="mt-2 text-xs text-danger">
            {objectiveError}
          </p>
        )}
      </fieldset>
      <TextareaField
        label="Notes"
        optional
        hint="Launch dates, constraints or anything we should know."
        placeholder="e.g. Want more online orders from 18–30s before December."
        maxLength={300}
        count={objectiveNotes.length}
        error={errors.objectiveNotes?.message}
        {...register('objectiveNotes')}
      />
      <ChoicePills
        legend="Budget band (optional)"
        options={BUDGETS}
        selected={budgetRange}
        hint="Roughly what you can spend on marketing in Naira. Choose “Not sure” if you don’t know."
        error={errors.budgetRange?.message}
        {...register('budgetRange')}
      />
    </div>
  );
}

export function ReferencesStep() {
  return <ReferenceEntitiesField />;
}

export function ReviewStep({ onEdit }: { onEdit: (step: number) => void }) {
  const { control } = useProfileForm();
  const v = useWatch({ control });

  const join = (...parts: (string | undefined)[]) => parts.filter((p) => p && p.length > 0).join(' · ');
  const sections = [
    {
      step: 0,
      title: 'Brand',
      summary: join(v.brandName, v.category === 'Other' ? v.categoryOther : labelOf(CATEGORIES, v.category ?? '')),
      detail: join(v.description, v.brandIdentity),
    },
    {
      step: 1,
      title: 'Products & market',
      summary: v.productsDescription ?? '',
      detail: join(v.targetMarket, v.primaryLocation),
    },
    {
      step: 2,
      title: 'Goal & budget',
      summary: join(labelOf(OBJECTIVES, v.marketingObjective ?? ''), labelOf(BUDGETS, v.budgetRange ?? '')),
      detail: v.objectiveNotes ?? '',
    },
    {
      step: 3,
      title: 'Cultural references',
      summary: (v.referenceEntities ?? [])
        .map((r) => `${r.name ?? ''} (${labelOf(REFERENCE_KINDS, r.kindHint ?? 'Unknown')})`)
        .join(', '),
      detail: '',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <section
          key={section.title}
          aria-labelledby={`review-${section.step}`}
          className="flex justify-between gap-4 rounded-(--radius-card) border border-border bg-surface px-5 py-4"
        >
          <div className="min-w-0">
            <h3
              id={`review-${section.step}`}
              className="font-sans text-xs font-medium tracking-wide text-ink-muted uppercase"
            >
              {section.title}
            </h3>
            <p
              className={cn(
                'mt-1 text-sm leading-relaxed break-words',
                section.summary ? 'text-ink' : 'text-ink-muted italic',
              )}
            >
              {section.summary || 'Not provided'}
            </p>
            {section.detail && <p className="mt-0.5 text-sm break-words text-ink-muted">{section.detail}</p>}
          </div>
          <button
            type="button"
            onClick={() => onEdit(section.step)}
            aria-label={`Edit ${section.title}`}
            className="shrink-0 self-start rounded-sm text-sm font-medium text-primary hover:underline"
          >
            Edit
          </button>
        </section>
      ))}
    </div>
  );
}
