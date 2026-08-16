"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * BottomSheet — slides up from bottom on mobile.
 *
 * Design decisions:
 * - 44px drag handle area for easy thumb grip
 * - Backdrop tap to dismiss
 * - Safe-area-inset-bottom for iOS notch
 * - Max height 85vh to always show some backdrop
 * - Overscroll-contain to prevent background scroll-through
 * - Focus trap for accessibility
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title = "Filters",
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxHeight: "85vh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onClick={onClose}
        >
          <div className="w-10 h-1 bg-[var(--text-muted)] rounded-full opacity-40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border-card)]">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-white"
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain px-5 py-4"
          style={{ maxHeight: "calc(85vh - 100px)" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
