"use client";

import { useCallback } from "react";

// ─── Types ───────────────────────────────────────────────

export interface FilterState {
  q: string;
  location: string;
  remoteType: string[];
  postedWithin: string;
  sortBy: string;
  framework: string[];
}

interface Facets {
  remoteType: Record<string, number>;
}

interface FilterSidebarProps {
  filters: FilterState;
  facets: Facets;
  onFilterChange: (filters: FilterState) => void;
  /** Called when user taps "Show X results" on mobile */
  onApply?: () => void;
  totalResults?: number;
  isSubscribed?: boolean;
}

// ─── Options ─────────────────────────────────────────────

const REMOTE_OPTIONS = [
  { value: "REMOTE", label: "Remote", icon: "🌍" },
  { value: "HYBRID", label: "Hybrid", icon: "🏢" },
  { value: "ONSITE", label: "On-site", icon: "📍" },
];



const FRAMEWORK_OPTIONS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "nextjs", label: "Next.js" },
  { value: "typescript", label: "TypeScript" },
  { value: "svelte", label: "Svelte" },
];

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1d", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
];

// ─── Component ───────────────────────────────────────────

export default function FilterSidebar({
  filters,
  facets,
  onFilterChange,
  onApply,
  totalResults,
  isSubscribed,
}: FilterSidebarProps) {
  const toggleArrayFilter = useCallback(
    (
      key: "remoteType" | "framework",
      value: string
    ) => {
      const current = filters[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFilterChange({ ...filters, [key]: updated });
    },
    [filters, onFilterChange]
  );

  const clearAll = useCallback(() => {
    onFilterChange({
      q: filters.q,
      location: "",
      remoteType: [],
      framework: [],
      postedWithin: "",
      sortBy: "newest",
    });
  }, [filters.q, onFilterChange]);

  const hasActiveFilters =
    filters.location ||
    filters.remoteType.length > 0 ||
    filters.framework.length > 0 ||
    filters.postedWithin;

  return (
    <div className="filter-sidebar-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium transition-colors hover:text-[var(--accent-secondary)] min-h-[44px] flex items-center px-2"
            style={{ color: "var(--accent-primary)" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Framework */}
      <div className="filter-section">
        <h3>Framework</h3>
        <div className="toggle-group">
          {FRAMEWORK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] ${
                filters.framework.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => toggleArrayFilter("framework", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Jobs Filter */}
      <div className="filter-section">
        <label className="filter-option min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.postedWithin === "7d"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                postedWithin: e.target.checked ? "7d" : "",
              })
            }
          />
          <span className="font-semibold" style={{ color: "var(--accent-primary)" }}>Posted in last 7 days</span>
        </label>
      </div>

      {/* Location */}
      <div className="filter-section">
        <h3>Location / Timezone</h3>
        <input
          className="input min-h-[44px]"
          type="text"
          placeholder="City, country, or timezone..."
          value={filters.location}
          onChange={(e) =>
            onFilterChange({ ...filters, location: e.target.value })
          }
        />
      </div>







      {/* Mobile: Show Results button */}
      {onApply && (
        <div className="mt-4 md:hidden">
          <button
            onClick={onApply}
            className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Default filter state factory ────────────────────────

export function createDefaultFilters(
  searchParams?: URLSearchParams
): FilterState {
  return {
    q: searchParams?.get("q") || "",
    location: searchParams?.get("location") || "",
    remoteType:
      searchParams?.get("remoteType")?.split(",").filter(Boolean) || [],
    framework:
      searchParams?.get("framework")?.split(",").filter(Boolean) || [],
    postedWithin: searchParams?.get("postedWithin") || "",
    sortBy: searchParams?.get("sortBy") || "newest",
  };
}
