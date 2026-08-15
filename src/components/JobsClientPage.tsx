"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import JobCard from "@/components/JobCard";
import FilterSidebar from "@/components/FilterSidebar";

interface FilterState {
  q: string;
  location: string;
  remoteType: string[];
  experienceLevel: string[];
  employmentType: string[];
  salaryMin: string;
  salaryMax: string;
  postedWithin: string;
  sortBy: string;
}

interface Facets {
  remoteType: Record<string, number>;
  experienceLevel: Record<string, number>;
  employmentType: Record<string, number>;
}

function JobCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
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

export default function JobsClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Auth & Subscription State from Firebase
  const { user, loading: authLoading, isSubscribed } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const [filters, setFilters] = useState<FilterState>(() => ({
    q: searchParams.get("q") || "",
    location: searchParams.get("location") || "",
    remoteType: searchParams.get("remoteType")?.split(",").filter(Boolean) || [],
    experienceLevel: searchParams.get("experienceLevel")?.split(",").filter(Boolean) || [],
    employmentType: searchParams.get("employmentType")?.split(",").filter(Boolean) || [],
    salaryMin: searchParams.get("salaryMin") || "",
    salaryMax: searchParams.get("salaryMax") || "",
    postedWithin: searchParams.get("postedWithin") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  }));

  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Load ALL jobs from static JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/data/jobs.json");
        if (res.ok) {
          const data = await res.json();
          // Strictly filter on the client side to guarantee only Remote Frontend jobs
          const strictlyFiltered = (data || []).filter((job: any) => {
            const isRemote = job.remoteType === 'REMOTE' || 
                            (job.location && /remote|anywhere/i.test(job.location));
                            
            const isRelevant = /\b(frontend|front-end|react|vue|angular|ui|ux|web|software|engineer|developer)\b/i.test(job.title) ||
                               (job.description && /\b(frontend|front-end|react|vue|angular|software)\b/i.test(job.description));
                               
            return isRemote && isRelevant;
          });
          setAllJobs(strictlyFiltered);
        }
      } catch (e) {
        console.error("Failed to load jobs JSON", e);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Filter & Paginate on client side whenever allJobs or filters or page changes
  useEffect(() => {
    if (!dataLoaded) return;
    
    if (allJobs.length === 0) {
      setJobs([]);
      setTotalJobs(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    let filtered = [...allJobs];

    if (filters.q) {
      const query = filters.q.toLowerCase();
      filtered = filtered.filter(j => 
        j.title?.toLowerCase().includes(query) || 
        j.description?.toLowerCase().includes(query)
      );
    }
    
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(j => 
        j.location?.toLowerCase().includes(loc) ||
        j.city?.toLowerCase().includes(loc) ||
        j.country?.toLowerCase().includes(loc)
      );
    }

    if (filters.remoteType.length > 0) {
      filtered = filtered.filter(j => filters.remoteType.includes(j.remoteType));
    }
    
    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(j => filters.experienceLevel.includes(j.experienceLevel));
    }
    
    if (filters.employmentType.length > 0) {
      filtered = filtered.filter(j => filters.employmentType.includes(j.employmentType));
    }
    
    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime());
    }

    setTotalJobs(filtered.length);
    
    // Pagination
    const limit = 20;
    const paginated = filtered.slice(0, page * limit);
    setJobs(paginated);
    setHasMore(paginated.length < filtered.length);
    
    setLoading(false);
  }, [allJobs, filters, page]);

  const syncFiltersToUrl = useCallback(
    (f: FilterState) => {
      const params = new URLSearchParams();
      if (f.q) params.set("q", f.q);
      if (f.location) params.set("location", f.location);
      if (f.remoteType.length) params.set("remoteType", f.remoteType.join(","));
      if (f.experienceLevel.length) params.set("experienceLevel", f.experienceLevel.join(","));
      if (f.employmentType.length) params.set("employmentType", f.employmentType.join(","));
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const loadMore = () => setPage(p => p + 1);

  return (
    <>
      {/* ─── Header ─────────────────────────── */}
      <header className="border-b border-[#333] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-sm bg-[#00ffcc]">
              FE
            </div>
            <span className="text-lg font-bold text-white">
              FrontendEngineers.com
            </span>
          </div>
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-20 h-8 skeleton rounded" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden sm:block text-[#00ffcc]">
                  {isSubscribed ? "Pro Member" : user.email}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm">
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2 hover:text-[#00ffcc] transition-colors">
                  Log In
                </Link>
                <Link href="/pricing" className="btn-primary text-sm bg-[#00ffcc] text-black font-semibold rounded px-4 py-2 hover:bg-[#00e6b8]">
                  Get Premium
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────── */}
      <section className="pt-12 pb-8 px-4 text-center bg-[#0a0a0a]">
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight text-white"
        >
          The Best <span className="text-[#00ffcc]">Remote Frontend</span> Jobs
        </h1>
        <p className="text-base max-w-xl mx-auto mb-8 text-gray-400">
          Curated roles for React, Vue, Angular, and UI/UX Engineers. Work from anywhere.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <div className="hero-search flex justify-center w-full max-w-2xl mx-auto mb-6 relative">
            <input
              type="text"
              placeholder="Search React, Senior, etc..."
              value={filters.q}
              onChange={(e) => handleFilterChange({ ...filters, q: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-full py-4 pl-6 pr-32 text-white outline-none focus:border-[#00ffcc] transition-colors"
            />
          </div>
        </form>
      </section>

      {/* ─── Main Content ───────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex-1 bg-[#0a0a0a]">
        <div className="flex gap-6">
          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {loading ? (
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

            {/* Paywall Overlay if not subscribed and viewing results */}
            <div className="relative">
              <div className="flex flex-col gap-3">
                {loading && jobs.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
                  : jobs.map((job, i) => (
                      <div key={job.id || i} className={`relative ${!isSubscribed && i > 2 ? "blur-sm pointer-events-none opacity-50" : ""}`}>
                        <JobCard job={job} index={i} />
                      </div>
                    ))}
              </div>
              
              {!isSubscribed && jobs.length > 3 && (
                <div className="absolute inset-x-0 bottom-0 top-[400px] flex items-center justify-center bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
                  <div className="text-center p-8 glass-card border border-[#333] bg-[#111]/90 rounded-2xl shadow-2xl">
                    <h3 className="text-2xl font-bold text-white mb-2">Unlock All Jobs</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">Get instant access to {totalJobs} remote frontend jobs, daily updates, and direct apply links.</p>
                    <Link href="/pricing" className="btn-primary bg-[#00ffcc] text-black font-bold py-3 px-8 rounded-full text-lg hover:scale-105 transition-transform inline-block">
                      Subscribe Now
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {!loading && jobs.length === 0 && (
              <div className="text-center py-20 text-white">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-sm text-gray-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}

            {isSubscribed && hasMore && !loading && (
              <div className="text-center mt-8">
                <button className="btn-secondary text-[#00ffcc] border border-[#00ffcc] px-6 py-2 rounded" onClick={loadMore}>
                  Load More Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer
        className="border-t py-8 text-center text-sm border-[#333] text-gray-500 bg-[#0a0a0a]"
      >
        <p>© 2024 FrontendEngineers.com. All rights reserved.</p>
      </footer>
    </>
  );
}
