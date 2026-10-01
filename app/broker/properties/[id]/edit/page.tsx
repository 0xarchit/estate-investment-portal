'use client';

import { useParams } from 'next/navigation';
import { PropertyWizard } from '@/components/broker/PropertyWizard';

export default function EditPropertyPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Edit listing</h1>
        <p className="text-sm text-[#6B7280]">
          Update your property details and re-submit for approval.
        </p>
      </div>
      <PropertyWizard mode="edit" propertyId={id} />
    </div>
  );
}
