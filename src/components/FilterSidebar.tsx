"use client";

import { useCallback } from "react";

// ─── Types ───────────────────────────────────────────────

export interface FilterState {
  q: string;
  location: string;
  remoteType: string[];
  experienceLevel: string[];
  employmentType: string[];
  salaryMin: string;
  salaryMax: string;
  postedWithin: string;
  sortBy: string;
  framework: string[];
}

interface Facets {
  remoteType: Record<string, number>;
  experienceLevel: Record<string, number>;
  employmentType: Record<string, number>;
}

interface FilterSidebarProps {
  filters: FilterState;
  facets: Facets;
  onFilterChange: (filters: FilterState) => void;
  /** Called when user taps "Show X results" on mobile */
  onApply?: () => void;
  totalResults?: number;
}

// ─── Options ─────────────────────────────────────────────

const REMOTE_OPTIONS = [
  { value: "REMOTE", label: "Remote", icon: "🌍" },
  { value: "HYBRID", label: "Hybrid", icon: "🏢" },
  { value: "ONSITE", label: "On-site", icon: "📍" },
];

const EXPERIENCE_OPTIONS = [
  { value: "ENTRY", label: "Entry Level" },
  { value: "MID", label: "Mid Level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead / Executive" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
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
  { value: "salary_high", label: "Salary: High → Low" },
  { value: "salary_low", label: "Salary: Low → High" },
];

// ─── Component ───────────────────────────────────────────

export default function FilterSidebar({
  filters,
  facets,
  onFilterChange,
  onApply,
  totalResults,
}: FilterSidebarProps) {
  const toggleArrayFilter = useCallback(
    (
      key: "remoteType" | "experienceLevel" | "employmentType" | "framework",
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
      experienceLevel: [],
      employmentType: [],
      framework: [],
      salaryMin: "",
      salaryMax: "",
      postedWithin: "",
      sortBy: "newest",
    });
  }, [filters.q, onFilterChange]);

  const hasActiveFilters =
    filters.location ||
    filters.remoteType.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.employmentType.length > 0 ||
    filters.framework.length > 0 ||
    filters.salaryMin ||
    filters.salaryMax ||
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



      {/* Experience Level */}
      <div className="filter-section">
        <h3>Seniority</h3>
        {EXPERIENCE_OPTIONS.map((opt) => (
          <label key={opt.value} className="filter-option min-h-[44px]">
            <input
              type="checkbox"
              checked={filters.experienceLevel.includes(opt.value)}
              onChange={() =>
                toggleArrayFilter("experienceLevel", opt.value)
              }
            />
            <span>{opt.label}</span>
            {facets.experienceLevel[opt.value] !== undefined && (
              <span className="filter-count">
                {facets.experienceLevel[opt.value]}
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Employment Type */}
      <div className="filter-section">
        <h3>Employment Type</h3>
        {EMPLOYMENT_OPTIONS.map((opt) => (
          <label key={opt.value} className="filter-option min-h-[44px]">
            <input
              type="checkbox"
              checked={filters.employmentType.includes(opt.value)}
              onChange={() =>
                toggleArrayFilter("employmentType", opt.value)
              }
            />
            <span>{opt.label}</span>
            {facets.employmentType[opt.value] !== undefined && (
              <span className="filter-count">
                {facets.employmentType[opt.value]}
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Salary Range */}
      <div className="filter-section">
        <h3>Salary Range (USD)</h3>
        <div className="flex gap-2">
          <input
            className="input min-h-[44px]"
            type="number"
            placeholder="Min"
            value={filters.salaryMin}
            onChange={(e) =>
              onFilterChange({ ...filters, salaryMin: e.target.value })
            }
          />
          <span
            className="flex items-center"
            style={{ color: "var(--text-muted)" }}
          >
            –
          </span>
          <input
            className="input min-h-[44px]"
            type="number"
            placeholder="Max"
            value={filters.salaryMax}
            onChange={(e) =>
              onFilterChange({ ...filters, salaryMax: e.target.value })
            }
          />
        </div>
      </div>

      {/* Posted Within */}
      <div className="filter-section">
        <h3>Posted Within</h3>
        <div className="toggle-group">
          {POSTED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] ${
                filters.postedWithin === opt.value ? "active" : ""
              }`}
              onClick={() =>
                onFilterChange({ ...filters, postedWithin: opt.value })
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="filter-section">
        <h3>Sort By</h3>
        <select
          className="input min-h-[44px]"
          value={filters.sortBy}
          onChange={(e) =>
            onFilterChange({ ...filters, sortBy: e.target.value })
          }
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: Show Results button */}
      {onApply && (
        <div className="mt-4 md:hidden">
          <button
            onClick={onApply}
            className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl"
          >
            Show{" "}
            {totalResults !== undefined
              ? `1000+ results`
              : "results"}
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
    experienceLevel:
      searchParams
        ?.get("experienceLevel")
        ?.split(",")
        .filter(Boolean) || [],
    employmentType:
      searchParams?.get("employmentType")?.split(",").filter(Boolean) ||
      [],
    framework:
      searchParams?.get("framework")?.split(",").filter(Boolean) || [],
    salaryMin: searchParams?.get("salaryMin") || "",
    salaryMax: searchParams?.get("salaryMax") || "",
    postedWithin: searchParams?.get("postedWithin") || "",
    sortBy: searchParams?.get("sortBy") || "newest",
  };
}
