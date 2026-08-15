"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid password");
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    setStatus("Scraping started... Please check your terminal for progress.");
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "admin123" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Scraping complete! Found ${data.total} jobs.`);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setStatus("Error triggering scraper.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <form onSubmit={handleLogin} className="glass-card p-8 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-[#00ffcc]">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-black/50 border border-gray-700 text-white outline-none focus:border-[#00ffcc]"
          />
          <button type="submit" className="btn-primary py-2 mt-2 bg-[#00ffcc] text-black font-semibold rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#00ffcc]">FrontendEngineers Admin</h1>
        <div className="glass-card p-6">
          <h2 className="text-xl mb-4">Remote Job Scraper</h2>
          <p className="text-gray-400 mb-6">
            Click the button below to start scraping Remote Frontend jobs. This will update the local <code>public/data/jobs.json</code> file.
            <br/><br/>
            <strong>Note:</strong> This scraper only runs locally. After scraping, commit and push your changes to Vercel to update the live site.
          </p>
          <button 
            onClick={handleScrape} 
            disabled={loading}
            className="btn-primary py-3 px-6 bg-[#00ffcc] text-black font-semibold rounded disabled:opacity-50"
          >
            {loading ? "Scraping in progress..." : "Run Scraper Now"}
          </button>
          
          {status && (
            <div className="mt-6 p-4 rounded bg-black/50 border border-gray-700 text-[#00ffcc]">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
