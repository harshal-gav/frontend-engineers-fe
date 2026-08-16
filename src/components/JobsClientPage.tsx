"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { IFuseOptions } from "fuse.js";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import JobCard from "@/components/JobCard";
import FilterSidebar, {
  createDefaultFilters,
  type FilterState,
} from "@/components/FilterSidebar";
import BottomSheet from "@/components/BottomSheet";
import type { Job } from "@/lib/jobs";

// ─── Fuse.js config ──────────────────────────────────────

const FUSE_OPTIONS: IFuseOptions<Job> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "company.name", weight: 0.25 },
    { name: "description", weight: 0.2 },
    { name: "location", weight: 0.1 },
    { name: "department", weight: 0.05 },
  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ─── Skeleton ────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-3/4 skeleton mb-2" />
          <div className="h-4 w-1/3 skeleton mb-3" />
          <div className="flex gap-2">
            <div className="h-6 w-20 skeleton rounded-full" />
            <div className="h-6 w-24 skeleton rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Facets computation ──────────────────────────────────

function computeFacets(jobs: Job[]) {
  const facets = {
    remoteType: {} as Record<string, number>,
    experienceLevel: {} as Record<string, number>,
    employmentType: {} as Record<string, number>,
  };
  for (const job of jobs) {
    if (job.remoteType) {
      facets.remoteType[job.remoteType] =
        (facets.remoteType[job.remoteType] || 0) + 1;
    }
    if (job.experienceLevel) {
      facets.experienceLevel[job.experienceLevel] =
        (facets.experienceLevel[job.experienceLevel] || 0) + 1;
    }
    if (job.employmentType) {
      facets.employmentType[job.employmentType] =
        (facets.employmentType[job.employmentType] || 0) + 1;
    }
  }
  return facets;
}

// ─── Main Component ──────────────────────────────────────

export default function JobsClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth & Subscription State
  const { user, loading: authLoading, isSubscribed } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // State
  const [filters, setFilters] = useState<FilterState>(() =>
    createDefaultFilters(searchParams)
  );
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Load jobs from secure API
  useEffect(() => {
    const loadData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch("/api/jobs", { headers });
        if (res.ok) {
          const data = await res.json();
          setAllJobs(data || []);
        }
      } catch (e) {
        console.error("Failed to load jobs", e);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, [user]);

  // Lazy load Fuse.js index to improve initial page load performance
  const [fuse, setFuse] = useState<any>(null);

  useEffect(() => {
    if (allJobs.length > 0 && isSubscribed) {
      import("fuse.js").then((FuseModule) => {
        const Fuse = FuseModule.default;
        setFuse(new Fuse(allJobs, FUSE_OPTIONS));
      });
    }
  }, [allJobs, isSubscribed]);

  // Compute facets from all jobs
  const facets = useMemo(() => computeFacets(allJobs), [allJobs]);

  // Filter & paginate
  const { jobs, totalJobs, hasMore } = useMemo(() => {
    if (!dataLoaded) return { jobs: [], totalJobs: 0, hasMore: false };

    let filtered: Job[];

    // Use Fuse.js for text search, regular filtering for structured filters
    if (filters.q && filters.q.length >= 2 && fuse) {
      filtered = fuse.search(filters.q).map((result: any) => result.item);
    } else {
      filtered = [...allJobs];
    }

    // Framework filter (searches title + description)
    if (filters.framework.length > 0) {
      filtered = filtered.filter((j) => {
        const text =
          `${j.title} ${j.description || ""}`.toLowerCase();
        return filters.framework.some((fw) =>
          text.includes(fw.toLowerCase())
        );
      });
    }

    // Location filter
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.location?.toLowerCase().includes(loc) ||
          j.city?.toLowerCase().includes(loc) ||
          j.country?.toLowerCase().includes(loc) ||
          j.description?.toLowerCase().includes(loc)
      );
    }

    // Remote type
    if (filters.remoteType.length > 0) {
      filtered = filtered.filter((j) =>
        filters.remoteType.includes(j.remoteType)
      );
    }

    // Experience level
    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(
        (j) =>
          j.experienceLevel &&
          filters.experienceLevel.includes(j.experienceLevel)
      );
    }

    // Employment type
    if (filters.employmentType.length > 0) {
      filtered = filtered.filter((j) =>
        filters.employmentType.includes(j.employmentType)
      );
    }

    // Salary range
    if (filters.salaryMin) {
      const min = parseInt(filters.salaryMin);
      filtered = filtered.filter(
        (j) => j.salaryMin && j.salaryMin >= min
      );
    }
    if (filters.salaryMax) {
      const max = parseInt(filters.salaryMax);
      filtered = filtered.filter(
        (j) => j.salaryMax && j.salaryMax <= max
      );
    }

    // Sort
    if (filters.sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.postedAt || 0).getTime() -
          new Date(a.postedAt || 0).getTime()
      );
    } else if (filters.sortBy === "salary_high") {
      filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    } else if (filters.sortBy === "salary_low") {
      filtered.sort((a, b) => (a.salaryMin || 999999) - (b.salaryMin || 999999));
    }

    const total = filtered.length;
    const limit = 12;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      jobs: paginated,
      totalJobs: total,
      hasMore: startIndex + limit < total,
    };
  }, [allJobs, fuse, filters, page, dataLoaded]);

  // Check if any filters are active (beyond search query)
  const hasActiveFilters =
    filters.q !== "" ||
    filters.location !== "" ||
    filters.remoteType.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.employmentType.length > 0 ||
    filters.framework.length > 0 ||
    filters.salaryMin !== "" ||
    filters.salaryMax !== "" ||
    filters.sortBy !== "newest";

  // URL sync
  const syncFiltersToUrl = useCallback(
    (f: FilterState) => {
      const params = new URLSearchParams();
      if (f.q) params.set("q", f.q);
      if (f.location) params.set("location", f.location);
      if (f.remoteType.length)
        params.set("remoteType", f.remoteType.join(","));
      if (f.experienceLevel.length)
        params.set("experienceLevel", f.experienceLevel.join(","));
      if (f.employmentType.length)
        params.set("employmentType", f.employmentType.join(","));
      if (f.framework.length)
        params.set("framework", f.framework.join(","));
      if (f.salaryMin) params.set("salaryMin", f.salaryMin);
      if (f.salaryMax) params.set("salaryMax", f.salaryMax);
      if (f.sortBy !== "newest") params.set("sortBy", f.sortBy);
      const query = params.toString();
      router.replace(query ? `?${query}` : "/", { scroll: false });
    },
    [router]
  );

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    syncFiltersToUrl(newFilters);
  };

  // Active filter count for mobile badge
  const activeFilterCount = [
    filters.remoteType.length > 0,
    filters.experienceLevel.length > 0,
    filters.employmentType.length > 0,
    filters.framework.length > 0,
    !!filters.location,
    !!filters.salaryMin || !!filters.salaryMax,
    !!filters.postedWithin,
  ].filter(Boolean).length;

  const isLoading = loading || !dataLoaded;

  return (
    <>
      {/* ─── Header ─────────────────────────── */}
      <header className="border-b border-[#333] bg-[#0a0a0a] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-sm bg-[#00ffcc]">
              FE
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              <span className="hidden sm:inline">
                FrontendEngineers.com
              </span>
              <span className="sm:hidden">FrontendEng</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {authLoading ? (
              <div className="w-20 h-8 skeleton rounded" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-sm font-medium hidden sm:block text-[#00ffcc]">
                  {isSubscribed ? "Pro Member" : user.email}
                </span>
                {!isSubscribed && (
                  <Link
                    href="/pricing"
                    className="btn-primary text-sm bg-[#00ffcc] text-black font-semibold rounded px-3 sm:px-4 py-2 hover:bg-[#00e6b8] min-h-[44px] flex items-center"
                  >
                    <span className="hidden sm:inline">Subscribe Now</span>
                    <span className="sm:hidden">Pro</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm min-h-[44px] px-3 sm:px-4"
                >
                  <span className="hidden sm:inline">Log Out</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="btn-secondary text-sm px-3 sm:px-4 py-2 hover:text-[#00ffcc] transition-colors min-h-[44px] flex items-center"
                >
                  Log In
                </Link>
                <Link
                  href="/pricing"
                  className="btn-primary text-sm bg-[#00ffcc] text-black font-semibold rounded px-3 sm:px-4 py-2 hover:bg-[#00e6b8] min-h-[44px] flex items-center"
                >
                  Get Pro
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────── */}
      <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 text-center bg-[#0a0a0a]">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight text-white">
          The Best{" "}
          <span className="text-[#00ffcc]">Remote Frontend</span> Jobs
        </h1>
        <p className="text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-8 text-gray-400">
          Curated roles for React, Vue, Angular, and UI/UX Engineers. Work
          from anywhere.
        </p>

        {/* Search Bar */}
        <div className="hero-search flex justify-center w-full max-w-2xl mx-auto mb-4 sm:mb-6 relative">
          <input
            type="text"
            placeholder={
              isSubscribed
                ? "Search React, Senior, Discord..."
                : "Subscribe to unlock search & filters..."
            }
            disabled={!isSubscribed}
            value={filters.q}
            onChange={(e) =>
              handleFilterChange({ ...filters, q: e.target.value })
            }
            className="w-full bg-[#111] border border-[#333] rounded-full py-3 sm:py-4 pl-4 sm:pl-6 pr-4 sm:pr-6 text-sm sm:text-base text-white outline-none focus:border-[#00ffcc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Mobile: Filter toggle button */}
        {isSubscribed && (
          <button
            onClick={() => setShowFilters(true)}
            className="md:hidden btn-secondary inline-flex items-center gap-2 min-h-[44px] px-4 text-sm"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[var(--accent-primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </section>

      {/* ─── Main Content ───────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex-1 bg-[#0a0a0a]">
        <div className="flex gap-6">
          {/* Desktop Sidebar — hidden on mobile */}
          {isSubscribed && (
            <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0">
              <div className="filter-sidebar">
                <FilterSidebar
                  filters={filters}
                  facets={facets}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {!dataLoaded ? (
                  <span className="skeleton inline-block h-4 w-32" />
                ) : (
                  <>
                    <span className="font-semibold text-[#00ffcc]">
                      {totalJobs.toLocaleString()}
                    </span>{" "}
                    jobs found
                  </>
                )}
              </p>
            </div>

            {/* Job Cards — responsive grid */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {!dataLoaded
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <JobCardSkeleton key={i} />
                    ))
                  : jobs.map((job, i) => {
                      // Paywall: non-subscribers see first 5 free, rest are teasers
                      const isTeaser =
                        !isSubscribed &&
                        (hasActiveFilters || page > 1 || i >= 5);

                      return (
                        <JobCard
                          key={job.id || i}
                          job={job}
                          index={i}
                          isTeaser={isTeaser}
                        />
                      );
                    })}
              </div>

              {/* Paywall overlay */}
              {!isSubscribed && jobs.length > 3 && (
                <div className="absolute inset-x-0 bottom-0 top-[200px] sm:top-[400px] flex items-end sm:items-center justify-center bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pb-8 sm:pb-0 z-10">
                  <div className="text-center p-5 sm:p-8 glass-card border border-[#333] bg-[#111]/95 rounded-2xl shadow-2xl mx-4 max-w-lg w-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      Unlock All Jobs
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6 max-w-md mx-auto">
                      Get instant access to {totalJobs} remote frontend
                      jobs, daily updates, and direct apply links.
                    </p>
                    <Link
                      href="/pricing"
                      className="btn-primary w-full sm:w-auto bg-[#00ffcc] text-black font-bold py-3 px-8 rounded-full text-base sm:text-lg hover:scale-105 transition-transform inline-block min-h-[48px]"
                    >
                      Subscribe Now
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Empty state */}
            {dataLoaded && jobs.length === 0 && (
              <div className="text-center py-16 sm:py-20 text-white">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">
                  No jobs found
                </h3>
                <p className="text-sm text-gray-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}

            {/* Pagination */}
            {dataLoaded && totalJobs > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 border-t border-[#333] pt-4 sm:pt-6 gap-3 sm:gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary w-full sm:w-auto px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 text-sm order-first sm:order-none">
                  Page{" "}
                  <strong className="text-white">{page}</strong> of{" "}
                  {Math.ceil(totalJobs / 12)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="btn-secondary w-full sm:w-auto px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Mobile Bottom Sheet for Filters ── */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <FilterSidebar
          filters={filters}
          facets={facets}
          onFilterChange={handleFilterChange}
          onApply={() => setShowFilters(false)}
          totalResults={totalJobs}
        />
      </BottomSheet>

      {/* ─── Footer ──────────────────────────── */}
      <footer className="border-t py-6 sm:py-8 border-[#333] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
          <p>© 2026 FrontendEngineers.com. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="hover:text-[#00ffcc] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#00ffcc] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
