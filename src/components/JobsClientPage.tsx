"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// Global cache for instant back-navigation
let globalJobsCache: Job[] | null = null;

// ─── Fuse.js config ──────────────────────────────────────

const FUSE_OPTIONS: IFuseOptions<Job> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "company.name", weight: 0.25 },
    { name: "description", weight: 0.2 },
    { name: "location", weight: 0.1 },

  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ─── Skeleton ────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="glass-card h-full p-4 sm:p-5 flex flex-col">
      <div className="flex items-start gap-3 sm:gap-4 flex-1">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 flex flex-col h-full">
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
  };
  for (const job of jobs) {
    if (job.remoteType) {
      facets.remoteType[job.remoteType] =
        (facets.remoteType[job.remoteType] || 0) + 1;
    }
  }
  return facets;
}

// ─── Sorting Helper ──────────────────────────────────────

function hasCareerLink(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes("career") || lower.includes("careers");
}

// ─── Main Component ──────────────────────────────────────

export default function JobsClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth & Subscription State
  const { user, loading: authLoading, isSubscribed, isEmployer } = useAuth();

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
  const [allJobs, setAllJobs] = useState<Job[]>(globalJobsCache || []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [dataLoaded, setDataLoaded] = useState(!!globalJobsCache);
  const [page, setPage] = useState(() => {
    const p = searchParams?.get("page");
    return p ? parseInt(p, 10) || 1 : 1;
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sync state with URL when searchParams change (e.g. back navigation)
  useEffect(() => {
    const p = searchParams?.get("page");
    const newPage = p ? parseInt(p, 10) || 1 : 1;
    setPage(newPage);

    // Also sync filters so that if they had filters and pressed back, they are restored
    setFilters(createDefaultFilters(searchParams));
  }, [searchParams]);

  // Load jobs from secure API
  useEffect(() => {
    // Don't fetch until auth state is resolved to avoid duplicate double-fetching
    if (authLoading) return;

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
          const jobsData: Job[] = data || [];
          globalJobsCache = jobsData;
          setAllJobs(jobsData);
        }
      } catch (e) {
        console.error("Failed to load jobs", e);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, [user, authLoading]);

  // Compute facets from all jobs
  const facets = useMemo(() => computeFacets(allJobs), [allJobs]);

  // Filter & paginate
  const { jobs, totalJobs, hasMore } = useMemo(() => {
    if (!dataLoaded) return { jobs: [], totalJobs: 0, hasMore: false };

    let filtered: Job[] = [...allJobs];

    // Robust substring search replacing Fuse.js
    if (filters.q && filters.q.length >= 2) {
      const qTokens = filters.q.toLowerCase().split(/\s+/).filter(t => t.length > 0);

      filtered = filtered.filter((j) => {
        const searchableText = [
          j.title,
          j.company?.name,
          j.description,
          j.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Ensure ALL typed words are found somewhere in the job
        return qTokens.every(token => searchableText.includes(token));
      });
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
          j.description?.toLowerCase().includes(loc)
      );
    }

    // Remote type
    if (filters.remoteType.length > 0) {
      filtered = filtered.filter((j) =>
        filters.remoteType.includes(j.remoteType)
      );
    }





    // Posted Within
    if (filters.postedWithin) {
      const now = Date.now();
      const map: Record<string, number> = {
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };
      const limitMs = map[filters.postedWithin];
      if (limitMs) {
        filtered = filtered.filter((j) => {
          if (!j.postedAt) return false;
          return now - new Date(j.postedAt).getTime() <= limitMs;
        });
      }
    }

    // Sort strictly by date (newest first), handling both string dates and Firestore Timestamp objects
    filtered.sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === "object" && val._seconds) return val._seconds * 1000;
        if (typeof val === "number") return val;
        return new Date(val).getTime() || 0;
      };
      
      const timeA = getTime(a.postedAt);
      const timeB = getTime(b.postedAt);
      return timeB - timeA;
    });

    // Space out companies: same company should not appear on 3 consecutive pages (36 slots gap)
    const PAGE_SIZE = 12;
    const GAP = PAGE_SIZE * 3; // 3 pages worth of jobs
    const spaced: Job[] = [];
    const deferred: Job[] = [];

    for (const job of filtered) {
      const companyId = (job.company?.name || job.company?.id || "unknown").toLowerCase();
      // Check if this company appeared in the last GAP slots
      let tooClose = false;
      const lookback = Math.max(0, spaced.length - GAP);
      for (let i = spaced.length - 1; i >= lookback; i--) {
        const prevCompany = (spaced[i].company?.name || spaced[i].company?.id || "unknown").toLowerCase();
        if (prevCompany === companyId) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) {
        deferred.push(job);
      } else {
        spaced.push(job);
      }
    }

    // Append deferred jobs at the end (they still show, just further down)
    const finalFiltered = [...spaced, ...deferred];

    const total = finalFiltered.length;
    const startIndex = (page - 1) * PAGE_SIZE;
    const paginated = finalFiltered.slice(startIndex, startIndex + PAGE_SIZE);

    return {
      jobs: paginated,
      totalJobs: total,
      hasMore: startIndex + PAGE_SIZE < total,
    };
  }, [allJobs, filters, page, dataLoaded]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.location !== "" ||
    filters.remoteType.length > 0 ||
    filters.framework.length > 0 ||
    filters.sortBy !== "newest" ||
    filters.postedWithin !== "";

  // URL sync
  const syncFiltersToUrl = useCallback(
    (f: FilterState, p: number) => {
      const params = new URLSearchParams();
      if (f.q) params.set("q", f.q);
      if (f.location) params.set("location", f.location);
      if (f.remoteType.length)
        params.set("remoteType", f.remoteType.join(","));
      if (f.framework.length)
        params.set("framework", f.framework.join(","));
      if (f.postedWithin) params.set("postedWithin", f.postedWithin);
      if (f.sortBy !== "newest") params.set("sortBy", f.sortBy);
      if (p > 1) params.set("page", p.toString());
      const query = params.toString();
      router.replace(query ? `?${query}` : "/", { scroll: false });
    },
    [router]
  );

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    syncFiltersToUrl(newFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncFiltersToUrl(filters, newPage);
  };

  // Active filter count for mobile badge
  const activeFilterCount = [
    filters.remoteType.length > 0,
    filters.framework.length > 0,
    !!filters.location,
    !!filters.postedWithin,
  ].filter(Boolean).length;

  const isLoading = !mounted || !dataLoaded;

  return (
    <>
      {/* ─── Header ─────────────────────────── */}
      <header className="border-b border-[#e2e2e6] bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-full">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm bg-[#2563eb] shrink-0">
              FE
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
              FrontendEngineers.com
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 relative max-w-full">
            {authLoading ? (
              <div className="w-20 h-8 skeleton rounded" />
            ) : user ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href={isEmployer ? "/employers/post" : "/employers/pricing"}
                  className="text-xs sm:text-sm bg-[#2563eb] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold shadow-md hover:bg-[#1d4ed8] hover:shadow-lg transition-all flex items-center justify-center shrink-0"
                >
                  Post a Job
                </Link>

                {!isSubscribed && (
                  <Link
                    href="/pricing"
                    className="text-xs sm:text-sm bg-[#d97706] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold shadow-md hover:bg-[#b45309] hover:shadow-lg transition-all flex items-center justify-center shrink-0"
                  >
                    ⭐ Get Pro
                  </Link>
                )}

                <div className="flex items-center gap-2 sm:gap-3 bg-transparent sm:bg-white/50 sm:border sm:border-[#e2e2e6] rounded-full sm:pl-3 sm:pr-1 sm:py-1 h-[32px] sm:h-[40px]">
                  {/* Pro Badge */}
                  {isSubscribed && (
                    <span className="text-[10px] sm:text-xs bg-[#d97706] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider leading-none">
                      Pro
                    </span>
                  )}

                  {/* Desktop: Email text */}
                  <span className="hidden sm:block text-sm font-semibold text-gray-900 max-w-[120px] truncate" title={user.email || ""}>
                    {user.email}
                  </span>

                  {/* Log Out Button */}
                  <button
                    onClick={handleLogout}
                    className="text-xs sm:text-sm bg-white text-gray-600 hover:bg-[#f5f5f7] hover:text-[#e11d48] px-3 py-1.5 sm:py-1.5 rounded-full transition-colors font-medium flex items-center justify-center border border-[#e2e2e6] sm:border-none shrink-0 h-full"
                    title="Log Out"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href="/employers/pricing"
                  className="text-xs sm:text-sm bg-[#2563eb] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold shadow-md hover:bg-[#1d4ed8] hover:shadow-lg transition-all flex items-center justify-center shrink-0"
                >
                  Post a Job
                </Link>
                <Link
                  href="/auth/login"
                  className="text-xs sm:text-sm font-medium text-gray-600 hover:text-[#2563eb] transition-colors flex items-center justify-center shrink-0 px-2 sm:px-3"
                >
                  Log In
                </Link>
                <Link
                  href="/pricing"
                  className="text-xs sm:text-sm bg-[#d97706] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold shadow-md hover:bg-[#b45309] hover:shadow-lg transition-all flex items-center justify-center shrink-0"
                >
                  ⭐ Get Pro
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────── */}
      <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 text-center bg-white flex flex-col items-center">
        <div className="inline-flex items-center justify-center gap-1.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-sm uppercase tracking-wider">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Aggregated from 100+ job boards & company career pages
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-5 leading-tight text-gray-900 w-full">
          Every Remote Frontend Job.{" "}
          <span className="text-[#2563eb]">One Place.</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto mb-4 text-gray-600">
          Stop wasting hours on LinkedIn, Indeed, AngelList, WeWorkRemotely, and 100 other sites. We aggregate every remote frontend job from across the internet - so you don't have to.
        </p>

        {/* Aggregation trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-6 text-[11px] sm:text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>LinkedIn Jobs</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>Company Career Pages</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>WeWorkRemotely</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>RemoteOK</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>100+ more</span>
        </div>

        {!isSubscribed && (
          <div className="flex flex-col items-center justify-center gap-2 mb-8 mt-2">
            <Link
              href="/pricing"
              className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
            >
              ⭐ Unlock Full Access - $9/mo
            </Link>
            <p className="text-xs text-gray-600 font-medium px-4 text-center">Pro unlocks search, filters, full descriptions, apply links & daily email alerts - so you apply before the crowd!</p>
          </div>
        )}

        {/* Search Bar */}
        {isSubscribed ? (
          <div className="hero-search flex flex-col items-center w-full max-w-2xl mx-auto mb-4 sm:mb-6 relative">
            <input
              type="text"
              placeholder="Search React, Senior, Discord..."
              value={filters.q}
              onChange={(e) =>
                handleFilterChange({ ...filters, q: e.target.value })
              }
              className="w-full bg-white border border-[#e2e2e6] rounded-full py-3 sm:py-4 pl-4 sm:pl-6 pr-4 sm:pr-6 text-sm sm:text-base text-gray-900 outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>
        ) : (
          <Link href="/pricing" className="block w-full max-w-2xl mx-auto mb-4 sm:mb-6">
            <div className="w-full bg-gray-50 border border-[#e2e2e6] rounded-full py-3 sm:py-4 pl-4 sm:pl-6 pr-4 sm:pr-6 text-sm sm:text-base text-gray-400 flex items-center gap-2 cursor-pointer hover:border-[#d97706] transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Search & filters are Pro features - Upgrade to unlock
            </div>
          </Link>
        )}


      </section>

      {/* ─── Main Content ───────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex-1 bg-white">
        <div className="flex gap-6">

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {!dataLoaded ? (
                  <span className="skeleton inline-block h-4 w-32" />
                ) : (
                  <>
                    <span className="font-semibold text-[#2563eb]">
                      {totalJobs.toLocaleString()}
                    </span>{" "}
                    jobs found
                  </>
                )}
              </p>
              {/* Filter toggle button - Pro only */}
              {isSubscribed && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="btn-secondary inline-flex items-center gap-2 min-h-[40px] px-3 text-sm"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-[#2563eb] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Job Cards — responsive grid */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {!dataLoaded
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <JobCardSkeleton key={i} />
                  ))
                  : jobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <JobCard
                        job={job}
                        index={index}
                      />

                    </React.Fragment>
                  ))}
              </div>
            </div>

            {/* Empty state */}
            {dataLoaded && jobs.length === 0 && (
              <div className="text-center py-16 sm:py-20 text-gray-900">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">
                  No jobs found
                </h3>
                <p className="text-sm text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}

            {/* Pagination */}
            {dataLoaded && totalJobs > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 border-t border-[#e2e2e6] pt-4 sm:pt-6 gap-3 sm:gap-4">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary w-full sm:w-auto px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2 order-first sm:order-none">
                  {(() => {
                    const limit = 12;
                    const totalPages = Math.ceil(totalJobs / limit);

                    let startPage = Math.max(1, page - 1);
                    let endPage = Math.min(totalPages, page + 1);

                    // Adjust to always show 3 pages if possible
                    if (endPage - startPage < 2) {
                      if (startPage === 1) {
                        endPage = Math.min(totalPages, 3);
                      } else if (endPage === totalPages) {
                        startPage = Math.max(1, totalPages - 2);
                      }
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${page === i
                            ? "bg-[#2563eb] text-white"
                            : "bg-white text-gray-600 hover:text-gray-900 border border-[#e2e2e6] hover:border-[#444]"
                            }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
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

      {/* ─── Mobile Bottom Sheet for Filters (Pro only) ── */}
      {isSubscribed && (
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
            isSubscribed={isSubscribed}
          />
        </BottomSheet>
      )}

    </>
  );
}
