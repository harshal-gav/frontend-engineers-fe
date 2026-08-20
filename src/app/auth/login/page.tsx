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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 border border-[#333] bg-[#111] rounded-2xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h1>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 text-white outline-none focus:border-[#00ffcc]"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 pr-10 text-white outline-none focus:border-[#00ffcc]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-4 py-3 rounded text-black bg-[#00ffcc] font-bold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Don't have an account? <Link href="/auth/signup" className="text-[#00ffcc] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
