"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { type Job, getEffectiveJobDescription } from "@/lib/jobs";
import UpgradeModal, { type UpgradeContext } from "@/components/UpgradeModal";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAuth } from "firebase/auth";

// ─── Config ──────────────────────────────────────────────

const REMOTE_CONFIG = {
  REMOTE: { label: "Remote", class: "badge-remote", icon: "🌍" },
  HYBRID: { label: "Hybrid", class: "badge-hybrid", icon: "🏢" },
  ONSITE: { label: "On-site", class: "badge-onsite", icon: "📍" },
} as const;

const LOGO_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #f43f5e, #ec4899)",
  "linear-gradient(135deg, #10b981, #14b8a6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
];

// ─── Component ───────────────────────────────────────────

interface JobDetailProps {
  job: Job;
  relatedJobs?: Job[];
}

export default function JobDetail({ job: initialJob, relatedJobs = [] }: JobDetailProps) {
  const { user, isSubscribed, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [job, setJob] = useState<Job>(initialJob);
  const [upgradeModalContext, setUpgradeModalContext] = useState<UpgradeContext | null>(null);

  // Report job modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("expired");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/jobs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.company?.name,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReportOpen(false);
          setReportSuccess(false);
          setReportDetails("");
        }, 2000);
      }
    } catch {
      // Gracefully handle
    } finally {
      setReportSubmitting(false);
    }
  };

  const paramsString = searchParams?.toString();
  const backHref = paramsString ? `/?${paramsString}` : "/";

  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;

  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_GRADIENTS.length;

  // Determine if the content should be locked (non-subscribed user)
  // Wait for auth to finish loading before showing the lock state
  const showLocked = !authLoading && !isSubscribed;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ─── Header / Back Nav ────────────────────── */}
      <header className="border-b border-[var(--border-card)] bg-[var(--bg-primary)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] transition-colors min-h-[44px] min-w-[44px] justify-center sm:justify-start"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Jobs</span>
          </Link>
        </div>
      </header>

      {/* ─── Job Content ──────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">
        {/* Company + Title - Title is always visible */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-gray-900 font-bold text-xl flex-shrink-0 overflow-hidden"
            style={{
              background: job.company?.logoUrl
                ? "var(--bg-secondary)"
                : LOGO_GRADIENTS[gradientIndex],
            }}
          >
            {job.company?.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={`${job.company.name || 'Company'} logo`}
                className="w-full h-full object-contain p-2"
                width={64}
                height={64}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.textContent =
                    (job.company?.name || "?")[0];
                }}
              />
            ) : (
              <span>{(job.company?.name || "?")[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Title is ALWAYS visible */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                {job.title}
              </h1>
            </div>
            {/* Company name - visible to all users */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            {job.company?.name}
            {job.company?.industry && (
              <span className="text-[var(--text-muted)]">
                {" "}
                · {job.company.industry}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Pro Upgrade CTA for Free Users ─────── */}
      {showLocked && (
        <div className="job-detail-locked-cta">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Unlock Full Job Details</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                See the full description and apply link for this job. 
                Pro members get full access to every job + daily email alerts.
              </p>
            </div>
            <button
              onClick={() => setUpgradeModalContext("details")}
              className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-colors text-base"
            >
              ⭐ Get Pro - $9/month
            </button>
            <p className="text-xs text-gray-500">Cancel anytime. Instant access.</p>
          </div>
        </div>
      )}

      {/* Badges - Remote is visible to all, specific location blurred for free users */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`badge ${remote.class}`}>
          {remote.icon} {remote.label}
        </span>

        {job.location && (
          <span className={`text-sm text-[var(--text-muted)] ${showLocked ? "job-locked-blur" : ""}`}>
            📍 {showLocked ? "Location, Country" : (job.location + (job.country ? `, ${job.country}` : ""))}
          </span>
        )}
      </div>


      {/* Apply Button (Desktop) - only for Pro users */}
      {!showLocked && job.applyUrl && (
        <div className="hidden sm:block mb-8">
          {user ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex min-h-[48px] px-8 text-base"
            >
              Apply Now →
            </a>
          ) : (
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
              className="btn-primary inline-flex min-h-[48px] px-8 text-base items-center justify-center"
            >
              Login to Apply →
            </Link>
          )}
        </div>
      )}

      {/* Description - blurred for free users */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        <div className={`prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ${showLocked ? "job-locked-blur" : ""}`}>
          {getEffectiveJobDescription(job)}
        </div>

        {/* Report Listing */}
        <div className="mt-8 pt-4 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Found an issue with this listing?</span>
          <button
            onClick={() => setIsReportOpen(true)}
            className="hover:text-red-400 underline transition-colors cursor-pointer"
          >
            Report job
          </button>
        </div>
      </div>

      {/* ─── Related Jobs Section ────────────────── */}
      {relatedJobs && relatedJobs.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[var(--border-card)]">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Similar Remote Frontend Roles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedJobs.map((relJob) => (
              <Link
                key={relJob.id}
                href={`/jobs/${relJob.slug || relJob.id}`}
                className="p-4 rounded-xl border border-[var(--border-card)] hover:border-[#2563eb] bg-[var(--bg-secondary)] hover:bg-white transition-all block group"
              >
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>{relJob.company?.name || "Company"}</span>
                  <span className="text-emerald-600 font-medium">100% Remote</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors line-clamp-1 mb-2">
                  {relJob.title}
                </h3>
                {relJob.aiTags?.stack && relJob.aiTags.stack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {relJob.aiTags.stack.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>

      {/* ─── Mobile Sticky Apply CTA ─────────────── */}
      {!showLocked && job.applyUrl && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:hidden z-30 border-t border-[var(--border-card)]"
          style={{
            background: "var(--bg-primary)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="px-4 py-3">
            {user ? (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center"
              >
                Apply Now →
              </a>
            ) : (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center"
              >
                Login to Apply →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─── Mobile Sticky Pro CTA for Free Users ── */}
      {showLocked && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:hidden z-30 border-t border-[var(--border-card)]"
          style={{
            background: "var(--bg-primary)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="px-4 py-3">
            <button
              onClick={() => setUpgradeModalContext("details")}
              className="bg-[#d97706] hover:bg-[#b45309] text-white w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              🔒 Unlock Full Details - $9/mo
            </button>
          </div>
        </div>
      )}

      {/* ─── Report Job Modal ────────────────────── */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReportOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10">
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
              aria-label="Close report modal"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Report this listing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Help us maintain high quality. What is the issue with this job?
            </p>

            {reportSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-medium text-center">
                ✓ Thank you. We will review and verify this job.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="expired">Job is closed / position filled</option>
                    <option value="broken_link">Apply link is broken / 404</option>
                    <option value="not_remote">Not a remote job (hybrid/onsite)</option>
                    <option value="inaccurate">Inaccurate salary or requirements</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Additional notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide details or updated link..."
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Upgrade Modal ── */}
      <UpgradeModal 
        isOpen={upgradeModalContext !== null} 
        onClose={() => setUpgradeModalContext(null)} 
        context={upgradeModalContext || "details"} 
      />
    </div>
  );
}
