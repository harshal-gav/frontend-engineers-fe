"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import JobCard from "@/components/JobCard";
import type { Job } from "@/lib/jobs";
import { trackEvent } from "@/lib/analytics";

export default function DashboardPage() {
  const { user, loading, isSubscribed } = useAuth();
  const router = useRouter();
  
  const [prefs, setPrefs] = useState<any>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      trackEvent("dashboard_viewed");
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        const [prefsRes, jobsRes] = await Promise.all([
          fetch("/api/user/preferences", { headers }),
          fetch("/api/jobs", { headers })
        ]);

        if (prefsRes.ok) {
          const p = await prefsRes.json();
          setPrefs(p);
          
          // Update lastLoginAt to now, so next visit shows new jobs correctly
          // We only do this once on mount
          fetch("/api/user/preferences", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ lastLoginAt: new Date().toISOString() })
          });
        }
        
        if (jobsRes.ok) {
          setAllJobs(await jobsRes.json());
        }
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading || isLoading || !user) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading your dashboard...</div>;
  }

  const savedJobIds = prefs?.saved_jobs || [];
  const savedJobs = allJobs.filter(j => savedJobIds.includes(j.id));
  
  // Calculate new jobs since last visit (fallback to 24h ago if no lastLoginAt)
  const lastLogin = prefs?.lastLoginAt ? new Date(prefs.lastLoginAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newJobs = allJobs.filter(j => j.postedAt && new Date(j.postedAt) > lastLogin);

  const alert = prefs?.job_alerts;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b border-[#e2e2e6] bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900 text-lg hover:text-[#2563eb]">
            ← Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{user.email}</span>
            <button onClick={() => {}} className="text-sm text-red-500 hover:underline">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Job Search Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Pro Status */}
          <div className="glass-card p-6 bg-white rounded-2xl border border-[#e2e2e6] shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Account Status
            </h2>
            {isSubscribed ? (
              <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl border border-amber-200">
                <p className="font-bold mb-1">⭐ Pro Member</p>
                <p className="text-sm text-amber-600">You have full access to all features.</p>
              </div>
            ) : (
              <div className="bg-gray-50 text-gray-700 px-4 py-3 rounded-xl border border-gray-200">
                <p className="font-bold mb-1">Free Plan</p>
                <p className="text-sm text-gray-600 mb-3">Unlock the full FrontendEngineers experience.</p>
                <Link href="/pricing" className="block text-center w-full bg-[#d97706] hover:bg-[#b45309] text-white px-4 py-2 rounded-lg font-bold transition-colors">
                  Upgrade to Pro — $9/mo
                </Link>
              </div>
            )}
          </div>

          {/* Job Alerts */}
          <div className="glass-card p-6 bg-white rounded-2xl border border-[#e2e2e6] shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              Daily Job Alerts
            </h2>
            {alert ? (
              <div className="text-sm text-gray-700">
                <p className="mb-2">We send you daily alerts matching:</p>
                <div className="bg-gray-100 px-3 py-2 rounded-md font-mono text-xs mb-3">
                  {alert.query || "Frontend"} • {alert.experience || "Any"} • {alert.location || "Any Remote"}
                </div>
                <button onClick={() => {}} className="text-[#2563eb] hover:underline font-medium">Edit alert settings</button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p className="mb-3">Get matching jobs delivered straight to your inbox daily.</p>
                <button className="w-full border border-[#2563eb] text-[#2563eb] px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                  Create Job Alert
                </button>
              </div>
            )}
          </div>

          {/* New Since Last Visit */}
          <div className="glass-card p-6 bg-white rounded-2xl border border-[#e2e2e6] shadow-sm flex flex-col justify-center text-center">
             <div className="text-4xl font-black text-gray-900 mb-1">{newJobs.length}</div>
             <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">New Frontend Jobs</p>
             <p className="text-xs text-gray-400 mt-1">Since your last visit</p>
             <Link href="/?sort=recent" className="mt-4 text-[#2563eb] font-bold text-sm hover:underline">View new jobs →</Link>
          </div>

        </div>

        {/* Saved Jobs */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b border-gray-200 pb-2">Your Saved Jobs</h2>
        
        {savedJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No saved jobs yet</h3>
            <p className="text-gray-500 mb-4">Keep track of jobs you're interested in by saving them.</p>
            <Link href="/" className="bg-[#2563eb] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">Browse Jobs</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedJobs.map(job => (
              <JobCard key={job.id} job={job} onSave={() => {}} isSaved={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
