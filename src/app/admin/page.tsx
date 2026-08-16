"use client";

import { useState, useEffect, useRef } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logs, setLogs] = useState<{type: string, message: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
      fetchJobs();
    } else {
      alert("Invalid password");
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "admin123" }),
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (e) {
      console.error("Failed to load jobs", e);
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    setLogs([{ type: 'log', message: 'Connecting to scraper stream...' }]);
    
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "admin123" }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start scraper. (Are you on production?)");
      }

      if (!res.body) {
        throw new Error("No readable stream available.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              setLogs(prev => {
                const newLogs = [...prev, data];
                // Keep only the last 300 logs to prevent browser crashes
                return newLogs.length > 300 ? newLogs.slice(newLogs.length - 300) : newLogs;
              });
              if (data.type === 'done') {
                setLoading(false);
                fetchJobs(); // Refresh jobs table
              }
            } catch (err) {}
          }
        }
      }
    } catch (e: any) {
      setLogs(prev => [...prev, { type: 'error', message: e.message || "Failed to stream logs" }]);
      setLoading(false);
    }
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#00ffcc]">FrontendEngineers Admin</h1>
          <button 
            onClick={handleScrape} 
            disabled={loading}
            className="btn-primary py-2 px-6 bg-[#00ffcc] text-black font-semibold rounded disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>}
            {loading ? "Scraping in progress..." : "Run Scraper Now"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Terminal Box */}
          <div className="glass-card p-0 overflow-hidden flex flex-col h-[600px] border border-[#333]">
            <div className="bg-[#111] p-3 border-b border-[#333] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-400 font-mono ml-2">Live Scraper Logs</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-black font-mono text-sm space-y-1">
              {logs.length === 0 && <div className="text-gray-500 italic">Waiting for scraper to start...</div>}
              {logs.map((log, i) => (
                <div key={i} className={log.type === 'error' ? 'text-red-400' : log.message.includes('---') ? 'text-[#00ffcc]' : 'text-gray-300'}>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Database Viewer */}
          <div className="glass-card p-6 h-[600px] flex flex-col border border-[#333]">
            <h2 className="text-xl mb-4 font-semibold text-white">Current Database ({jobs.length} jobs)</h2>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-[#111] text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Job Title</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr key={i} className="border-b border-[#222] hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={job.title}>
                        {job.title}
                      </td>
                      <td className="px-4 py-3">{job.location || 'Remote'}</td>
                      <td className="px-4 py-3">
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-[#00ffcc] hover:underline">
                          Link
                        </a>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">No jobs found in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
