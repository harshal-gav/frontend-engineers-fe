"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const redirectUrl = searchParams?.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-[#2563eb]">
          FE
        </div>
        <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          FrontendEngineers.com
        </span>
      </Link>

      <div className="glass-card max-w-md w-full p-8 border border-[#e2e2e6] bg-white rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h1>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#e2e2e6] rounded p-3 text-gray-900 outline-none focus:border-[#2563eb]"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#e2e2e6] rounded p-3 pr-10 text-gray-900 outline-none focus:border-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-4 py-3 rounded text-white bg-[#2563eb] font-bold disabled:opacity-50 transition-colors hover:bg-[#3b82f6]"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-gray-600 text-center mt-6">
          Don't have an account? <Link href={`/auth/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="text-[#2563eb] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
