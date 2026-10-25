import Link from "next/link";
import type { Job } from "@/lib/jobs";
import { formatLocation, timeAgo } from "@/lib/jobs";

/**
 * Server-rendered job list for landing pages.
 * Shows job title, company, tech tags, location, and posted date.
 * Kept as a server component for SEO - no client JS needed.
 */
export default function LandingJobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No matching jobs found right now. Check back soon — we add new positions daily.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {jobs.map((job) => {
        const location = formatLocation(job);
        const tags = job.aiTags?.stack?.slice(0, 4) || [];
        const slug = job.slug || job.id;

        return (
          <Link
            key={job.id}
            href={`/jobs/${slug}`}
            className="block p-4 sm:p-5 rounded-xl border border-[#e2e2e6] bg-white hover:border-[#2563eb] hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Company logo or initial */}
              {job.company?.logoUrl ? (
                <img
                  src={job.company.logoUrl}
                  alt={`${job.company.name} company logo`}
                  width={44}
                  height={44}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-contain bg-gray-50 border border-[#e2e2e6] flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}
                >
                  {(job.company?.name || "?")[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors text-sm sm:text-base truncate">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {job.company?.name || "Company"} • {location}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                    {timeAgo(job.postedAt)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
