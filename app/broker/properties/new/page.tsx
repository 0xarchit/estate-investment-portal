'use client';

import { PropertyWizard } from '@/components/broker/PropertyWizard';

export default function NewPropertyPage() {
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">New listing</h1>
        <p className="text-sm text-[#6B7280]">
          Complete all steps and submit for admin approval.
        </p>
      </div>
      <PropertyWizard mode="create" />
    </div>
  );
}
