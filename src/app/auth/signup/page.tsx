"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user doc if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          isPremium: false,
          createdAt: new Date().toISOString()
        });
        router.push("/pricing"); // Redirect to pricing for new users
      } else {
        router.push("/"); // Redirect to home for existing users logging in via signup page
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        const ua = navigator.userAgent;
        const isInAppBrowser = /LinkedInApp|Instagram|FBAV|FBAN/i.test(ua);
        
        if (isInAppBrowser) {
          setError("Google Sign-In is blocked inside this app. Please tap the menu (•••) and select 'Open in System Browser' (Safari/Chrome) to sign up.");
        } else {
          const { signInWithRedirect } = await import("firebase/auth");
          signInWithRedirect(auth, provider);
        }
      } else {
        setError(err.message || "Failed to sign up with Google");
      }
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
              className="w-full btn-primary mt-2 py-3 rounded text-black bg-[#00ffcc] font-bold disabled:opacity-50 transition-colors hover:bg-[#00e6b8]"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 h-px bg-[#333]"></div>
            <span className="text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-[#333]"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded bg-white text-black font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-gray-400 text-center mt-6 text-sm">
            Already have an account? <Link href="/auth/login" className="text-[#00ffcc] hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
