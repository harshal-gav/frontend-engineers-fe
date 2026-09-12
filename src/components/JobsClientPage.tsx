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
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [mounted, setMounted] = useState(false);
  

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
          j.city,
          j.country,
          j.experienceLevel,
          j.employmentType,
          j.department,
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

    // Sort
    if (filters.sortBy === "salary_high") {
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
  }, [allJobs, filters, page, dataLoaded]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.location !== "" ||
    filters.remoteType.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.employmentType.length > 0 ||
    filters.framework.length > 0 ||
    filters.salaryMin !== "" ||
    filters.salaryMax !== "" ||
    filters.sortBy !== "newest" ||
    filters.postedWithin !== "";

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
      if (f.postedWithin) params.set("postedWithin", f.postedWithin);
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
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Link
                  href={isEmployer ? "/employers/post" : "/employers/pricing"}
                  className="text-xs sm:text-sm bg-[#2563eb] text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-[#1d4ed8] hover:shadow-lg transition-all flex items-center shrink-0"
                >
                  Post a Job
                </Link>
                
                {!isSubscribed && (
                  <Link
                    href="/pricing"
                    className="btn-primary text-xs sm:text-sm bg-[#2563eb] text-white font-semibold rounded px-3 sm:px-4 py-1.5 hover:bg-[#3b82f6] flex items-center shrink-0"
                  >
                    <span>⭐ Get Pro Membership</span>
                  </Link>
                )}
                
                <div className="flex items-center gap-1.5 sm:gap-3 bg-transparent sm:bg-white/50 sm:border sm:border-[#e2e2e6] rounded-full sm:pl-3 sm:pr-1 sm:py-1">
                  {/* Pro Badge */}
                  {isSubscribed && (
                    <span className="text-[10px] sm:text-xs bg-[#d97706] text-black px-1.5 sm:px-2 py-0.5 sm:py-0.5 rounded-md sm:rounded-full font-bold uppercase tracking-wider leading-none">
                      Pro
                    </span>
                  )}
                  
                  {/* Desktop: Email text */}
                  <span className="hidden sm:block text-sm font-semibold text-gray-900 max-w-[150px] truncate" title={user.email || ""}>
                    {user.email}
                  </span>

                  {/* Log Out Button */}
                  <button 
                    onClick={handleLogout} 
                    className="text-xs bg-white text-gray-600 hover:bg-[#f5f5f7] hover:text-[#e11d48] px-3 py-1 sm:py-1.5 rounded-full transition-colors font-medium flex items-center justify-center border border-[#e2e2e6] shrink-0"
                    title="Log Out"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/employers/pricing"
                  className="text-sm px-3 sm:px-4 py-2 text-gray-600 font-semibold hover:text-[#2563eb] transition-colors min-h-[44px] flex items-center"
                >
                  Post a Job
                </Link>
                <Link
                  href="/auth/login"
                  className="btn-secondary text-sm px-3 sm:px-4 py-2 hover:text-[#2563eb] transition-colors min-h-[44px] flex items-center"
                >
                  Log In
                </Link>
                <Link
                  href="/pricing"
                  className="btn-primary text-sm bg-[#2563eb] text-white font-semibold rounded px-3 sm:px-4 py-2 hover:bg-[#3b82f6] min-h-[44px] flex items-center"
                >
                  ⭐ Pro Membership
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────── */}
      <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 text-center bg-white">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-5 leading-tight text-gray-900">
            The Best{" "}
            <span className="text-[#2563eb]">Remote Frontend Jobs</span>
            <span className="block mt-2 text-lg sm:text-xl lg:text-2xl text-gray-700 font-bold">
              Work from anywhere, earn in dollars, and spend in local currency.
            </span>
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto mb-6 text-gray-600">
            Curated 100% remote roles for React, Vue, Angular, Svelte, Next.js, UI/UX, and TypeScript Engineers. Pro members get 7-day early access, apply before the crowd.
          </p>

          {!isSubscribed && (
            <div className="flex flex-col items-center justify-center gap-2 mb-8 mt-2">
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto btn-primary bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                ⭐ Get Pro Membership
              </Link>
              <p className="text-xs text-gray-600 font-medium px-4 text-center">Unlock early access and daily new job alerts before the crowd. Apply before anyone else with Pro.</p>
            </div>
          )}

        {/* Search Bar */}
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


      </section>

      {/* ─── Main Content ───────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex-1 bg-white">
        <div className="flex gap-6">
          {/* Desktop Sidebar — hidden on mobile */}
          <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0">
            <div className="filter-sidebar">
              <FilterSidebar
                filters={filters}
                facets={facets}
                onFilterChange={handleFilterChange}
                isSubscribed={isSubscribed}
              />
            </div>
          </aside>

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
              {/* Mobile: Filter toggle button */}
              <button
                onClick={() => setShowFilters(true)}
                className="md:hidden btn-secondary inline-flex items-center gap-2 min-h-[40px] px-3 text-sm"
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
            </div>

            {/* Job Cards — responsive grid */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                          onClick={() => setPage(i)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                            page === i
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
          isSubscribed={isSubscribed}
        />
      </BottomSheet>

    </>
  );
}
