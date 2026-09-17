"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export type UpgradeContext = "search" | "filters" | "details" | "apply" | "alerts" | "save";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: UpgradeContext;
}

export default function UpgradeModal({ isOpen, onClose, context }: UpgradeModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      trackEvent("upgrade_modal_opened", { context });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, context]);

  if (!mounted || !isOpen) return null;

  const contentMap: Record<UpgradeContext, { title: string; desc: string }> = {
    search: {
      title: "Unlock advanced search",
      desc: "Unlock advanced search to find the exact remote frontend roles you're looking for.",
    },
    filters: {
      title: "Find exactly the jobs you want",
      desc: "Unlock advanced filters to narrow down by technology, experience, and remote type.",
    },
    details: {
      title: "Unlock full job details",
      desc: "Get complete job descriptions and requirements with Pro.",
    },
    apply: {
      title: "Unlock direct application access",
      desc: "Get direct links to company career pages and apply faster.",
    },
    alerts: {
      title: "Get matching jobs delivered to you",
      desc: "We'll send daily emails with fresh jobs that match your preferences.",
    },
    save: {
      title: "Save jobs for later",
      desc: "Keep track of jobs you want to apply to with Pro.",
    },
  };

  const { title, desc } = contentMap[context];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-[#fffbeb] text-[#d97706] rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-[#fef3c7]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
            {desc}
          </p>

          <div className="bg-[#f8fafc] rounded-xl p-4 text-left mb-6 border border-[#e2e8f0]">
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>React / TypeScript / Next.js filtering</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Experience-level filtering</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Faster job discovery</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="w-full bg-[#d97706] hover:bg-[#b45309] text-white px-6 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
            ⭐ Get Pro — $9/month
          </button>
          
          <p className="mt-4 text-xs text-gray-500">
            Cancel anytime. No commitments.
          </p>
        </div>
      </div>
    </div>
  );
}
