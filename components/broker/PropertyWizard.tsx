'use client';

/**
 * P5 owns this file.
 * Reusable 5-step property wizard — used by both /new and /[id]/edit pages.
 * Steps: Basics → Location → Financials → Media & Docs → Review & Submit
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  createProperty,
  patchProperty,
  submitProperty,
  uploadFile,
  getPropertyById,
  type BrokerProperty,
  type PropertyStatus,
} from '@/lib/api/broker';
import {
  type PropertyFormInput,
} from '@/lib/validators/property';
import { FormField, Input } from '@/components/auth/FormField';

// ── Types ──────────────────────────────────────────────────────────────────

export interface WizardProps {
  mode: 'create' | 'edit';
  propertyId?: string;
}

interface MediaFile {
  url: string;
  publicId: string;
  name: string;
}

interface WizardState {
  id: string | null; // null until first save
  images: MediaFile[];
  documents: MediaFile[];
}

const STEPS = ['Basics', 'Location', 'Financials', 'Media & Docs', 'Review'];
type StepIndex = 0 | 1 | 2 | 3 | 4;

const LOCKED_STATUSES: PropertyStatus[] = ['LIVE', 'FUNDED', 'HOLDING', 'SOLD'];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// ── Progress indicator ─────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  i < step
                    ? 'bg-[#10B981] text-white'
                    : i === step
                    ? 'bg-[#0F2A4A] text-white'
                    : 'bg-gray-200 text-[#6B7280]',
                ].join(' ')}
              >
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={[
                  'hidden text-[10px] font-medium sm:block',
                  i === step ? 'text-[#0F2A4A]' : 'text-[#6B7280]',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'mx-1 h-0.5 flex-1',
                  i < step ? 'bg-[#10B981]' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Basics ─────────────────────────────────────────────────────────

function StepBasics({ locked }: { locked: boolean }) {
  const { register, formState: { errors } } = useFormContext<PropertyFormInput>();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827]">Property basics</h2>
      <FormField label="Title" error={errors.title?.message} required>
        <Input {...register('title')} disabled={locked} error={!!errors.title} placeholder="e.g. 2BHK Apartment, Sector 150 Noida" />
      </FormField>
      <FormField label="Description" error={errors.description?.message} required>
        <textarea
          {...register('description')}
          disabled={locked}
          rows={4}
          placeholder="Describe the property…"
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-[#111827] outline-none',
            'focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] resize-none',
            errors.description ? 'border-[#DC2626]' : 'border-gray-200',
            locked ? 'bg-gray-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
        {errors.description && (
          <p className="text-xs text-[#DC2626]">{errors.description.message}</p>
        )}
      </FormField>
      <FormField label="Property type" error={errors.type?.message} required>
        <select
          {...register('type')}
          disabled={locked}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#10B981]"
        >
          <option value="">Select type…</option>
          {['APARTMENT', 'VILLA', 'COMMERCIAL', 'PLOT', 'WAREHOUSE'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Area (sq ft)" error={errors.areaSqft?.message} required>
        <Input
          type="number"
          min={1}
          {...register('areaSqft')}
          disabled={locked}
          error={!!errors.areaSqft}
          placeholder="1200"
        />
      </FormField>
    </div>
  );
}

// ── Step 2: Location ───────────────────────────────────────────────────────

function StepLocation({ locked }: { locked: boolean }) {
  const { register, formState: { errors } } = useFormContext<PropertyFormInput>();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827]">Location</h2>
      <FormField label="Address" error={errors.address?.message} required>
        <Input {...register('address')} disabled={locked} error={!!errors.address} placeholder="Plot 42, Sector 150" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" error={errors.city?.message} required>
          <Input {...register('city')} disabled={locked} error={!!errors.city} placeholder="Noida" />
        </FormField>
        <FormField label="State" error={errors.state?.message} required>
          <Input {...register('state')} disabled={locked} error={!!errors.state} placeholder="Uttar Pradesh" />
        </FormField>
      </div>
      <FormField label="Pincode" error={errors.pincode?.message} required>
        <Input
          {...register('pincode')}
          disabled={locked}
          maxLength={6}
          error={!!errors.pincode}
          placeholder="201301"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Latitude (optional)" error={errors.lat?.message}>
          <Input type="number" step="any" {...register('lat')} disabled={locked} placeholder="28.5355" />
        </FormField>
        <FormField label="Longitude (optional)" error={errors.lng?.message}>
          <Input type="number" step="any" {...register('lng')} disabled={locked} placeholder="77.3910" />
        </FormField>
      </div>
    </div>
  );
}

// ── Step 3: Financials ─────────────────────────────────────────────────────

function StepFinancials({ locked }: { locked: boolean }) {
  const { register, watch, formState: { errors } } = useFormContext<PropertyFormInput>();
  const valuation = Number(watch('valuationRupees')) || 0;
  const totalUnits = Number(watch('totalUnits')) || 0;

  const pricePerUnit = totalUnits > 0 ? valuation / totalUnits : 0;
  const isWholeRupee = totalUnits > 0 && valuation % totalUnits === 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827]">Financials</h2>
      {locked && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            Financial fields are locked because this property is live or beyond.
          </p>
        </div>
      )}
      <FormField label="Valuation (₹)" error={errors.valuationRupees?.message} required>
        <Input
          type="number"
          min={1}
          {...register('valuationRupees')}
          disabled={locked}
          error={!!errors.valuationRupees}
          placeholder="10000000"
        />
      </FormField>
      <FormField label="Total units" error={errors.totalUnits?.message} required>
        <Input
          type="number"
          min={1}
          {...register('totalUnits')}
          disabled={locked}
          error={!!errors.totalUnits}
          placeholder="1000"
        />
      </FormField>

      {/* Auto-calculated price per unit */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium text-[#6B7280]">Price per unit (auto-calculated)</p>
        <p className={`mt-0.5 text-sm font-semibold ${!isWholeRupee && totalUnits > 0 ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
          {totalUnits > 0
            ? isWholeRupee
              ? `₹${pricePerUnit.toLocaleString('en-IN')}`
              : `₹${pricePerUnit.toFixed(2)} — Choose units so price per unit is a whole rupee`
            : '—'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Min units per investor" error={errors.minUnits?.message} required>
          <Input type="number" min={1} {...register('minUnits')} disabled={locked} error={!!errors.minUnits} placeholder="1" />
        </FormField>
        <FormField
          label="Max units per investor"
          error={errors.maxUnitsPerInvestor?.message}
          required
          hint="49% ownership limit recommended"
        >
          <Input type="number" min={1} {...register('maxUnitsPerInvestor')} disabled={locked} error={!!errors.maxUnitsPerInvestor} placeholder="490" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Expected appreciation %" error={errors.expectedAppreciationPct?.message} required>
          <Input type="number" step="0.1" min={0} max={100} {...register('expectedAppreciationPct')} disabled={locked} error={!!errors.expectedAppreciationPct} placeholder="12" />
        </FormField>
        <FormField label="Rental yield %" error={errors.rentalYieldPct?.message} required>
          <Input type="number" step="0.1" min={0} max={100} {...register('rentalYieldPct')} disabled={locked} error={!!errors.rentalYieldPct} placeholder="4.5" />
        </FormField>
        <FormField label="Holding period (months)" error={errors.holdingPeriodMonths?.message} required>
          <Input type="number" min={1} {...register('holdingPeriodMonths')} disabled={locked} error={!!errors.holdingPeriodMonths} placeholder="36" />
        </FormField>
      </div>
    </div>
  );
}

// ── Step 4: Media & Docs ───────────────────────────────────────────────────

function StepMedia({
  images,
  documents,
  onAddImage,
  onRemoveImage,
  onAddDoc,
  onRemoveDoc,
}: {
  images: MediaFile[];
  documents: MediaFile[];
  onAddImage: (f: MediaFile) => void;
  onRemoveImage: (idx: number) => void;
  onAddDoc: (f: MediaFile) => void;
  onRemoveDoc: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState<Record<string, number>>({});

  const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_DOC = ['application/pdf', ...ALLOWED_IMAGE];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFiles = async (files: FileList | null, type: 'image' | 'doc') => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (type === 'image' && !ALLOWED_IMAGE.includes(file.type)) {
        toast.error(`${file.name}: only JPG/PNG/WebP allowed`);
        continue;
      }
      if (type === 'doc' && !ALLOWED_DOC.includes(file.type)) {
        toast.error(`${file.name}: only JPG/PNG/WebP/PDF allowed`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: exceeds 5 MB`);
        continue;
      }
      const key = `${file.name}-${Date.now()}`;
      setUploading((prev) => ({ ...prev, [key]: 0 }));
      try {
        const result = await uploadFile(file);
        if (type === 'image') onAddImage(result);
        else onAddDoc(result);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  const isUploading = Object.keys(uploading).length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#111827]">Media &amp; Documents</h2>

      {/* Images */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-[#111827]">
            Images{' '}
            <span className={images.length < 3 ? 'text-[#DC2626]' : 'text-[#10B981]'}>
              ({images.length}/3 minimum)
            </span>
          </p>
          <label className="cursor-pointer rounded-lg border border-dashed border-[#10B981] px-3 py-1.5 text-xs font-medium text-[#10B981] hover:bg-emerald-50">
            <Upload size={12} className="mr-1 inline" />
            Upload images
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files, 'image')}
            />
          </label>
        </div>
        {images.length === 0 && !isUploading && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-[#6B7280]">
            <Upload size={24} className="mb-2 opacity-40" />
            Drag & drop or click to upload at least 3 images
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.publicId} className="group relative aspect-video overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {isUploading && (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100">
              <Loader2 size={20} className="animate-spin text-[#10B981]" />
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-[#111827]">
            Documents <span className="text-[#6B7280]">({documents.length})</span>
          </p>
          <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-gray-50">
            <Upload size={12} className="mr-1 inline" />
            Upload docs
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files, 'doc')}
            />
          </label>
        </div>
        {documents.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {documents.map((doc, i) => (
              <li key={doc.publicId} className="flex items-center justify-between px-3 py-2 text-sm">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline">
                  {doc.name}
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveDoc(i)}
                  className="ml-2 text-[#6B7280] hover:text-[#DC2626]"
                  aria-label="Remove document"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Step 5: Review ─────────────────────────────────────────────────────────

function StepReview({
  data,
  images,
  documents,
}: {
  data: PropertyFormInput;
  images: MediaFile[];
  documents: MediaFile[];
}) {
  const rows: Array<[string, string | number]> = [
    ['Title', data.title ?? ''],
    ['Type', data.type ?? ''],
    ['Area', `${data.areaSqft} sq ft`],
    ['Address', `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`],
    ['Valuation', `₹${Number(data.valuationRupees).toLocaleString('en-IN')}`],
    ['Total units', data.totalUnits ?? ''],
    ['Min units / Max units', `${data.minUnits} / ${data.maxUnitsPerInvestor}`],
    ['Expected appreciation', `${data.expectedAppreciationPct}%`],
    ['Rental yield', `${data.rentalYieldPct}%`],
    ['Holding period', `${data.holdingPeriodMonths} months`],
    ['Images', images.length.toString()],
    ['Documents', documents.length.toString()],
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827]">Review &amp; Submit</h2>
      <p className="text-sm text-[#6B7280]">
        Double-check everything before submitting for admin approval.
      </p>
      <dl className="divide-y rounded-2xl bg-gray-50 ring-1 ring-black/5">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-[#6B7280]">{label}</dt>
            <dd className="text-right font-medium text-[#111827]">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Wizard root ────────────────────────────────────────────────────────────

export function PropertyWizard({ mode, propertyId }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [wizardState, setWizardState] = useState<WizardState>({
    id: propertyId ?? null,
    images: [],
    documents: [],
  });
  const [loadingProperty, setLoadingProperty] = useState(mode === 'edit');
  const [isLocked, setIsLocked] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Single RHF instance spanning all steps
  const methods = useForm<PropertyFormInput>({
    defaultValues: {
      images: [],
      documents: [],
    },
  });

  const { getValues, trigger, reset } = methods;

  // Load existing property in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !propertyId) return;
    getPropertyById(propertyId)
      .then((p) => {
        const locked = LOCKED_STATUSES.includes(p.status);
        setIsLocked(locked);
        setRejectionReason(p.rejectionReason);
        setWizardState({ id: p._id, images: p.images, documents: p.documents });
        reset({
          title: p.title,
          description: p.description,
          type: p.type,
          areaSqft: p.areaSqft,
          address: p.address,
          city: p.city,
          state: p.state,
          pincode: p.pincode,
          lat: p.geo?.lat ?? ('' as unknown as number),
          lng: p.geo?.lng ?? ('' as unknown as number),
          valuationRupees: p.valuation / 100,
          totalUnits: p.totalUnits,
          minUnits: p.minUnits,
          maxUnitsPerInvestor: p.maxUnitsPerInvestor,
          expectedAppreciationPct: p.expectedAppreciationPct,
          rentalYieldPct: p.rentalYieldPct,
          holdingPeriodMonths: p.holdingPeriodMonths,
          images: p.images,
          documents: p.documents,
        });
      })
      .catch(() => toast.error('Failed to load property'))
      .finally(() => setLoadingProperty(false));
  }, [mode, propertyId, reset]);

  // Build the API payload from current form values
  const buildPayload = useCallback(() => {
    const d = getValues();
    const lat = Number(d.lat);
    const lng = Number(d.lng);
    return {
      title: d.title,
      description: d.description,
      type: d.type,
      areaSqft: Number(d.areaSqft),
      address: d.address,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
      geo: lat && lng ? { lat, lng } : undefined,
      // Convert rupees to paise
      valuation: Math.round(Number(d.valuationRupees) * 100),
      totalUnits: Number(d.totalUnits),
      minUnits: Number(d.minUnits),
      maxUnitsPerInvestor: Number(d.maxUnitsPerInvestor),
      expectedAppreciationPct: Number(d.expectedAppreciationPct),
      rentalYieldPct: Number(d.rentalYieldPct),
      holdingPeriodMonths: Number(d.holdingPeriodMonths),
      images: wizardState.images,
      documents: wizardState.documents,
    };
  }, [getValues, wizardState.images, wizardState.documents]);

  const saveAsDraft = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    try {
      const payload = buildPayload();
      let saved: BrokerProperty;
      if (wizardState.id) {
        saved = await patchProperty(wizardState.id, payload);
      } else {
        saved = await createProperty(payload);
        setWizardState((s) => ({ ...s, id: saved._id }));
      }
      toast.success('Saved as draft');
      return saved._id;
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Save failed');
      return null;
    } finally {
      setSaving(false);
    }
  }, [buildPayload, wizardState.id]);

  // Per-step fields for RHF trigger validation
  const STEP_FIELDS: Array<Array<keyof PropertyFormInput>> = [
    ['title', 'description', 'type', 'areaSqft'],
    ['address', 'city', 'state', 'pincode'],
    ['valuationRupees', 'totalUnits', 'minUnits', 'maxUnitsPerInvestor', 'expectedAppreciationPct', 'rentalYieldPct', 'holdingPeriodMonths'],
    [],
    [],
  ];

  const goNext = async () => {
    // Validate current step fields
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const ok = await trigger(fields);
      if (!ok) return;
    }

    // Media step: require ≥ 3 images
    if (step === 3 && wizardState.images.length < 3) {
      toast.error('Upload at least 3 images to continue');
      return;
    }

    // Auto-save as draft on each step advance
    await saveAsDraft();
    setStep((s) => Math.min(4, s + 1) as StepIndex);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1) as StepIndex);

  const handleFinalSubmit = async () => {
    if (wizardState.images.length < 3) {
      toast.error('Upload at least 3 images before submitting');
      return;
    }
    setSubmitting(true);
    try {
      // Save latest changes first
      const id = await saveAsDraft();
      const targetId = id ?? wizardState.id;
      if (!targetId) {
        toast.error('No property ID — save failed');
        return;
      }
      await submitProperty(targetId);
      setSubmitted(true);
    } catch (e: unknown) {
      const details = (e as { details?: string[] })?.details;
      if (details?.length) {
        toast.error(details.join(' • '));
      } else {
        toast.error((e as { message?: string })?.message ?? 'Submit failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#10B981]" size={32} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CheckCircle className="h-16 w-16 text-[#10B981]" />
        <h2 className="text-xl font-bold text-[#111827]">Submitted for approval!</h2>
        <p className="text-sm text-[#6B7280]">
          An admin will review your listing. You'll be notified of the outcome.
        </p>
        <button
          onClick={() => router.push('/broker/properties')}
          className="rounded-lg bg-[#0F2A4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0F2A4A]/90"
        >
          Back to My Properties
        </button>
      </div>
    );
  }

  const formValues = getValues();

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-2xl">
        {/* Rejection banner */}
        {rejectionReason && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">Property was rejected</p>
              <p className="text-sm text-red-700">{rejectionReason}</p>
            </div>
          </div>
        )}

        <ProgressBar step={step} />

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {/* Step content */}
          {step === 0 && <StepBasics locked={isLocked} />}
          {step === 1 && <StepLocation locked={isLocked} />}
          {step === 2 && <StepFinancials locked={isLocked} />}
          {step === 3 && (
            <StepMedia
              images={wizardState.images}
              documents={wizardState.documents}
              onAddImage={(f) =>
                setWizardState((s) => ({ ...s, images: [...s.images, f] }))
              }
              onRemoveImage={(i) =>
                setWizardState((s) => ({
                  ...s,
                  images: s.images.filter((_, idx) => idx !== i),
                }))
              }
              onAddDoc={(f) =>
                setWizardState((s) => ({ ...s, documents: [...s.documents, f] }))
              }
              onRemoveDoc={(i) =>
                setWizardState((s) => ({
                  ...s,
                  documents: s.documents.filter((_, idx) => idx !== i),
                }))
              }
            />
          )}
          {step === 4 && (
            <StepReview
              data={formValues}
              images={wizardState.images}
              documents={wizardState.documents}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium text-[#111827] hover:bg-gray-50 disabled:opacity-40"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {/* Save as draft */}
              <button
                type="button"
                onClick={saveAsDraft}
                disabled={saving}
                className="rounded-lg border border-[#0F2A4A] px-4 py-2.5 text-sm font-medium text-[#0F2A4A] hover:bg-[#0F2A4A]/5 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={saving}
                  className="rounded-lg bg-[#0F2A4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F2A4A]/90 disabled:opacity-60"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting || wizardState.images.length < 3}
                  className="rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
