"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function JobAlertForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alertForm, setAlertForm] = useState({
    query: "",
    location: "Worldwide",
    frequency: "Daily"
  });

  useEffect(() => {
    // If user is logged in, fetch existing alert
    if (user) {
      user.getIdToken().then(token => {
        fetch("/api/user/preferences", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.job_alerts) {
            setAlertForm(data.job_alerts);
          }
        })
        .catch(console.error);
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Prompt them to login, we could save alertForm to localStorage
      localStorage.setItem("pendingJobAlert", JSON.stringify(alertForm));
      router.push("/auth/signup?redirect=/dashboard");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ job_alerts: alertForm })
      });
      trackEvent("alert_created", alertForm);
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e2e6] shadow-sm p-6 sm:p-8 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-2 text-[#2563eb]">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        <h2 className="text-xl font-bold text-gray-900">Get new remote frontend jobs in your inbox</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">Tell us what you're looking for and we'll send matching jobs to you.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keywords / Technology</label>
          <input 
            type="text" 
            placeholder="e.g. React, Next.js, Senior" 
            value={alertForm.query}
            onChange={(e) => setAlertForm({...alertForm, query: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select 
              value={alertForm.location}
              onChange={(e) => setAlertForm({...alertForm, location: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-[#2563eb] outline-none bg-white"
            >
              <option>Worldwide</option>
              <option>US Only</option>
              <option>Europe</option>
              <option>Asia</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {loading ? "Saving..." : success ? "✅ Alert Saved!" : "🔔 Create Free Job Alert"}
        </button>
      </form>
    </div>
  );
}
