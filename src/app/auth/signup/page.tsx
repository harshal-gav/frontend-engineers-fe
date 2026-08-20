"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Frontend Validations
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create a user document in Firestore with default isPremium = false
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        isPremium: false,
        createdAt: new Date().toISOString()
      });

      router.push("/pricing"); // Redirect to pricing so they can subscribe!
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Changed layout/style for signup to look different from login */}
      <div className="glass-card max-w-2xl w-full p-8 border-t-4 border-t-[#00ffcc] bg-[#111] rounded-2xl flex flex-col md:flex-row gap-8 items-center">
        
        <div className="flex-1 text-center md:text-left hidden md:block">
          <h1 className="text-4xl font-extrabold text-white mb-4">Join <span className="text-[#00ffcc]">FrontendEng</span></h1>
          <p className="text-gray-400">Create an account to unlock premium remote frontend and fullstack JavaScript jobs, and direct ATS links.</p>
        </div>

        <div className="flex-1 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-6 text-center md:text-left md:hidden">Create Account</h2>
          
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 pr-10 text-white outline-none focus:border-[#00ffcc]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary mt-2 py-3 rounded text-black bg-[#00ffcc] font-bold disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-gray-400 text-center mt-6 text-sm">
            Already have an account? <Link href="/auth/login" className="text-[#00ffcc] hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
