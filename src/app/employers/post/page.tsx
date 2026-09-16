"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function PostJobPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    companyLogoUrl: "",
    companyWebsite: "",
    applyUrl: "",
    location: "Worldwide",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push("/auth/login?redirect=/employers/post");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await user.getIdToken();
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        remoteType: "REMOTE",
        applyUrl: formData.applyUrl,
        company: {
          name: formData.companyName,
          logoUrl: formData.companyLogoUrl || null,
          website: formData.companyWebsite || null,
        }
      };

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError("You need an active Employer Subscription to post jobs.");
        } else {
          setError(data.error || "Failed to post job");
        }
      } else {
        setSuccess(true);
        // Reset form
        setFormData({
          title: "", companyName: "", companyLogoUrl: "", companyWebsite: "",
          applyUrl: "", location: "Worldwide", description: ""
        });
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center pt-20"><div className="w-8 h-8 skeleton rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-600 mb-8">Your job will be instantly emailed to our subscribers and featured at the top of the board.</p>

        {success ? (
          <div className="glass-card p-8 text-center bg-white border-t-4 border-[#10b981]">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Job Posted Successfully!</h2>
            <p className="text-gray-600 mb-6">Your job is now live and alerts are being sent out.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setSuccess(false)} className="btn-secondary px-6 py-2">Post Another Job</button>
              <Link href="/" className="btn-primary bg-[#2563eb] text-white px-6 py-2 rounded">View Board</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 bg-white space-y-6 shadow-sm">
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex flex-col gap-2">
                <span className="font-semibold">{error}</span>
                {error.includes("Employer Subscription") && (
                  <Link href="/employers/pricing" className="text-sm underline font-medium">Get Unlimited Posting Plan →</Link>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Job Title <span className="text-red-500">*</span></label>
                <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior React Engineer" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Company Name <span className="text-red-500">*</span></label>
                <input required name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Stripe" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Application URL <span className="text-red-500">*</span></label>
              <input required type="url" name="applyUrl" value={formData.applyUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Location (Timezone/Region)</label>
                <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Worldwide, US Only, EST" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Company Logo URL (Optional)</label>
                <input type="url" name="companyLogoUrl" value={formData.companyLogoUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Company Website (Optional)</label>
                <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all" />
              </div>
            </div>



            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Job Description <span className="text-red-500">*</span></label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={8} placeholder="Describe the role, responsibilities, and requirements..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none resize-y transition-all" />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Posting Job..." : "Post Job Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
