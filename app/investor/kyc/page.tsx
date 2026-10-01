"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, UploadCloud, ShieldCheck, Clock3 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadKycFile, submitKyc } from "@/lib/api/kyc";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { errorMessage } from "@/components/investor/common";
const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export default function KycPage() {
  const { user, refreshUser } = useAuth();
  const client = useQueryClient();
  const status = user?.kyc?.status ?? "NOT_SUBMITTED";
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [issue, setIssue] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [stage, setStage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const locked = status === "APPROVED" || status === "PENDING" || submitted;
  const mutation = useMutation({
    mutationFn: async () => {
      setStage("Uploading dummy documents…");
      const docs = await Promise.all(files.map((file) => uploadKycFile(file!)));
      setStage("Submitting for review…");
      await submitKyc(docs);
    },
    onSuccess: async () => {
      setSubmitted(true);
      setFiles([null, null]);
      toast.success("Documents submitted for review.");
      await Promise.allSettled([
        refreshUser(),
        client.invalidateQueries({ queryKey: ["me"] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error) => setIssue(errorMessage(error)),
  });
  function chooseFile(index: number, file: File | undefined) {
    setIssue("");
    setFiles((current) =>
      current.map((value, i) => (i === index ? null : value)),
    );
    if (!file) return;
    if (!allowed.includes(file.type)) {
      setIssue("Choose a JPG, PNG, WEBP or PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIssue("Each document must be 5 MB or smaller.");
      return;
    }
    if (file.size === 0) {
      setIssue("This file is empty. Choose another document.");
      return;
    }
    setFiles((current) =>
      current.map((value, i) => (i === index ? file : value)),
    );
  }
  const displayStatus = submitted ? "PENDING" : status;
  return (
    <div className="page-stack mx-auto max-w-4xl">
      <PageHeader
        title="Identity verification"
        subtitle="One simple check before you invest."
      />
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-700" />
            <h2 className="text-xl font-semibold">Know your customer</h2>
          </div>
          <StatusChip status={displayStatus} />
        </div>
        {displayStatus === "APPROVED" ? (
          <div className="mt-8 rounded-xl bg-emerald-50 p-6">
            <h3 className="text-xl font-semibold text-emerald-900">
              You’re verified and ready to invest.
            </h3>
            <p className="mt-2 text-sm text-emerald-800">
              Your identity documents have been approved.
            </p>
            <Link href="/properties" className="btn mt-5">
              Browse properties ↗
            </Link>
          </div>
        ) : displayStatus === "PENDING" ? (
          <div className="mt-8 rounded-xl bg-amber-50 p-6">
            <Clock3 className="mb-3 h-7 w-7 text-amber-800" />
            <h3 className="text-xl font-semibold text-amber-950">
              Your documents are under review.
            </h3>
            <p className="mt-2 text-sm text-amber-900">
              An administrator will review your submission. You can invest once
              it is approved.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/investor" className="btn-secondary">
                Back to dashboard
              </Link>
              <button
                className="btn-secondary"
                onClick={() =>
                  refreshUser()
                    .then(() => setSubmitted(false))
                    .catch((error) => toast.error(errorMessage(error)))
                }
              >
                Refresh status
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Upload a dummy identity document and selfie for review. This is an
              academic project: do not upload real personal or financial
              information.
            </p>
            {status === "REJECTED" && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p className="font-semibold">
                  Your previous submission needs an update
                </p>
                <p className="mt-1">
                  {user?.kyc?.reason ??
                    "Please replace your documents and submit again."}
                </p>
              </div>
            )}
          </>
        )}
        {user?.kyc?.docs?.length ? (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">
              {status === "REJECTED"
                ? "Previous documents · replacement required"
                : "Submitted documents"}
            </h3>
            <ul className="space-y-2">
              {user.kyc.docs.map((doc, index) => (
                <li key={`${doc.url}-${index}`}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-800 underline"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {doc.name}{" "}
                    <span className="sr-only">(opens in a new tab)</span>↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!locked && (
          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (mutation.isPending) return;
              setIssue("");
              if (files.some((file) => !file)) {
                setIssue(
                  "Choose a dummy identity document and a dummy selfie.",
                );
                return;
              }
              if (!declaration) {
                setIssue("Confirm that you are uploading dummy data only.");
                return;
              }
              mutation.mutate();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {["Dummy identity document", "Dummy selfie"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
                  >
                    <UploadCloud className="mb-4 h-7 w-7 text-slate-500" />
                    <label
                      htmlFor={`kyc-file-${index}`}
                      className="block font-semibold"
                    >
                      {label}
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, WEBP or PDF · maximum 5 MB
                    </p>
                    <input
                      id={`kyc-file-${index}`}
                      type="file"
                      accept={allowed.join(",")}
                      disabled={mutation.isPending}
                      className="mt-4 w-full min-w-0 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-emerald-800"
                      onChange={(e) => chooseFile(index, e.target.files?.[0])}
                    />
                    {files[index] && (
                      <div className="mt-3 flex items-start justify-between gap-2 text-xs">
                        <span className="break-all">
                          {files[index]!.name} ·{" "}
                          {Math.ceil(files[index]!.size / 1024)} KB
                        </span>
                        <button
                          type="button"
                          disabled={mutation.isPending}
                          className="font-semibold text-red-700"
                          onClick={() => {
                            setFiles((current) =>
                              current.map((file, i) =>
                                i === index ? null : file,
                              ),
                            );
                            const input = document.getElementById(
                              `kyc-file-${index}`,
                            ) as HTMLInputElement;
                            input.value = "";
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-emerald-700"
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                disabled={mutation.isPending}
              />
              <span>
                I confirm these are dummy documents for academic demonstration
                only.
              </span>
            </label>
            {issue && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
              >
                {issue}
              </p>
            )}
            <button type="submit" className="btn" disabled={mutation.isPending}>
              {mutation.isPending
                ? stage
                : status === "REJECTED"
                  ? "Resubmit for verification"
                  : "Submit for verification"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
