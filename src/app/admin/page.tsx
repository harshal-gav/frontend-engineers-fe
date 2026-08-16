"use client";

import { useState, useEffect, useRef } from "react";
import AnsiToHtml from "ansi-to-html";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logs, setLogs] = useState<{type: string, message: string, htmlMessage?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [mode, setMode] = useState("api-only");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Configure ansi-to-html to ignore escape sequences it doesn't know, to prevent noisy text output
  const ansiConverter = new AnsiToHtml({ escapeXML: true });

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

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    // Optimistic UI update
    setJobs(jobs.filter(j => j.id !== jobId && j.sourceHash !== jobId));
    
    try {
      const res = await fetch(`/api/admin/jobs/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "admin123" }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete job");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete job");
      fetchJobs(); // Revert on failure
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    setLogs([]); // clear logs on new run
    
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "admin123", mode }),
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
              
              if (data.type === 'log') {
                // Convert ANSI to HTML
                data.htmlMessage = ansiConverter.toHtml(data.message) || "&nbsp;";
              }
              
              setLogs(prev => {
                const newLogs = [...prev, data];
                // Keep only the last 1000 logs to prevent browser memory issues
                return newLogs.length > 1000 ? newLogs.slice(newLogs.length - 1000) : newLogs;
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-sans">
        <form onSubmit={handleLogin} className="bg-[#111] p-10 rounded-2xl shadow-2xl border border-[#333] flex flex-col gap-6 w-96 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00ffcc] to-blue-500"></div>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00ffcc] to-blue-400 bg-clip-text text-transparent">FE Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Authenticate to access scraper</p>
          </div>
          <input
            type="password"
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-black/50 border border-gray-700 text-white outline-none focus:border-[#00ffcc] transition-colors text-center"
          />
          <button type="submit" className="w-full py-3 bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-bold rounded-lg transition-colors">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#050505] text-white font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-6 border-b border-[#222]">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ffcc] to-blue-500 flex items-center justify-center text-black text-sm">FE</span>
              Job Scraper Admin
            </h1>
            <p className="text-gray-400 mt-1">Manage remote job pipelines and view live logs.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-[#111] p-2 rounded-xl border border-[#333]">
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              disabled={loading}
              className="bg-black text-white p-2 rounded-lg border border-[#333] outline-none focus:border-[#00ffcc] cursor-pointer disabled:opacity-50"
            >
              <option value="api-only">Fast Scrape (APIs Only)</option>
              <option value="full">Deep Scrape (APIs + Companies)</option>
              <option value="dry-run">Dry Run (No Save)</option>
            </select>
            <button 
              onClick={handleScrape} 
              disabled={loading}
              className="py-2 px-6 bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>}
              {loading ? "Running..." : "Launch Scraper"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Terminal Box */}
          <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col h-[700px] border border-[#333] shadow-2xl relative">
            <div className="bg-[#151515] p-3 flex justify-between items-center border-b border-[#333]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-xs text-gray-500 font-mono">bash — npx tsx scraper/run-all.ts</span>
              <div className="w-10"></div> {/* spacer */}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto font-mono text-sm leading-relaxed bg-[#0a0a0a]">
              {logs.length === 0 && (
                <div className="text-gray-600 mt-4 text-center">
                  System ready. Select a mode and click Launch Scraper.
                </div>
              )}
              {logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`min-h-[1.5em] ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}
                >
                  {log.htmlMessage ? (
                    <span dangerouslySetInnerHTML={{ __html: log.htmlMessage }} />
                  ) : (
                    log.message
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            
            {/* Terminal reflection/glow effect */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
          </div>

          {/* Database Viewer */}
          <div className="bg-[#111] rounded-2xl p-6 h-[700px] flex flex-col border border-[#333] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Live Database</h2>
              <span className="bg-[#00ffcc]/10 text-[#00ffcc] px-3 py-1 rounded-full text-sm font-medium border border-[#00ffcc]/20">
                {jobs.length} Active Jobs
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto rounded-xl border border-[#222] bg-[#0a0a0a]">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-[#151515] text-gray-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4">Job Title & Company</th>
                    <th className="px-5 py-4 w-32">Location</th>
                    <th className="px-5 py-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {jobs.map((job, i) => (
                    <tr key={i} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white text-base max-w-[300px] truncate" title={job.title}>
                          {job.title}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {job.company?.name || job.company} • {new Date(job.postedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-300">
                        {job.location || 'Remote'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={job.applyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-gray-400 hover:text-white transition-colors"
                            title="View Job"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                          <button 
                            onClick={() => deleteJob(job.sourceHash || job.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete Job"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                          <span>No jobs found in database.</span>
                        </div>
                      </td>
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
