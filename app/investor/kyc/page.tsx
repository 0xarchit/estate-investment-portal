"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import toast from "react-hot-toast";
import { ShieldCheck, Upload, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function KycPage() {
  const { user, refreshUser } = useAuth();
  const [docName, setDocName] = useState("Aadhaar Card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kycStatus = user?.kyc?.status || "NOT_SUBMITTED";

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("fre_token");
      const res = await fetch("/api/v1/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          docs: [
            {
              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              name: docName,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to submit KYC");
      }

      toast.success("KYC submitted successfully! Awaiting administrator review.");
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F2A4A]">KYC Identity Verification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Government-mandated identity verification required before making real estate investments.
        </p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Verification Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            {kycStatus === "APPROVED" && (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span className="text-lg font-bold text-[#10B981]">Verified / Approved</span>
              </>
            )}
            {kycStatus === "PENDING" && (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-lg font-bold text-amber-600">Pending Admin Review</span>
              </>
            )}
            {kycStatus === "REJECTED" && (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-lg font-bold text-red-600">Rejected</span>
              </>
            )}
            {kycStatus === "NOT_SUBMITTED" && (
              <>
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-lg font-bold text-slate-700">Not Submitted</span>
              </>
            )}
          </div>
          {user?.kyc?.reason && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              Reason: {user.kyc.reason}
            </p>
          )}
        </div>
      </div>

      {/* Submission Form */}
      {kycStatus !== "APPROVED" && (
        <form
          onSubmit={handleSubmitKyc}
          className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-6"
        >
          <h3 className="font-bold text-base text-[#0F2A4A]">Submit Identity Documents</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Document Type
            </label>
            <select
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
            >
              <option value="Aadhaar Card">Aadhaar Card (National ID)</option>
              <option value="PAN Card">PAN Card (Tax Identification)</option>
              <option value="Passport">Passport</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          <div className="p-6 border-2 border-dashed border-border rounded-xl text-center bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Proof of Identity Document</p>
            <p className="text-xs text-muted-foreground mt-1">
              Test mode: Pre-filled standard dummy identity file will be submitted.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || kycStatus === "PENDING"}
            className={`w-full py-3 rounded-lg text-white font-bold transition-colors ${
              isSubmitting || kycStatus === "PENDING"
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-[#0F2A4A] hover:bg-[#0F2A4A]/90"
            }`}
          >
            {isSubmitting
              ? "Submitting..."
              : kycStatus === "PENDING"
              ? "Awaiting Admin Review"
              : "Submit Documents for Verification"}
          </button>
        </form>
      )}
    </div>
  );
}

