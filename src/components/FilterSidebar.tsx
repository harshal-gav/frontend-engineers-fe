"use client";

import { useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────

export interface FilterState {
  q: string;
  location: string;
  remoteType: string[];
  postedWithin: string;
  sortBy: string;
  framework: string[];
  // New AI-powered filters
  remoteScope: string[];
  seniority: string[];
  employmentType: string[];
  excludeKeywords: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  filters: Omit<FilterState, 'q'>;
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
  /** Saved filter presets for PRO users */
  savedPresets?: SavedPreset[];
  onSavePreset?: (name: string) => void;
  onLoadPreset?: (preset: SavedPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  onUpgradeClick?: () => void;
}

// ─── Options ─────────────────────────────────────────────

const FRAMEWORK_OPTIONS = [
  { value: "react", label: "React", icon: "⚛️" },
  { value: "vue", label: "Vue", icon: "💚" },
  { value: "angular", label: "Angular", icon: "🅰️" },
  { value: "nextjs", label: "Next.js", icon: "▲" },
  { value: "typescript", label: "TypeScript", icon: "🔷" },
  { value: "svelte", label: "Svelte", icon: "🔥" },
  { value: "remix", label: "Remix", icon: "💿" },
  { value: "nuxtjs", label: "Nuxt", icon: "💚" },
  { value: "gatsby", label: "Gatsby", icon: "🟣" },
  { value: "astro", label: "Astro", icon: "🚀" },
  { value: "tailwind", label: "Tailwind", icon: "🎨" },
  { value: "graphql", label: "GraphQL", icon: "◈" },
  { value: "redux", label: "Redux", icon: "🔄" },
];

const REMOTE_SCOPE_OPTIONS = [
  { value: "GLOBAL", label: "🌍 Global Remote", desc: "Work from anywhere" },
  { value: "REGION", label: "🌐 Region-Specific", desc: "LATAM, EMEA, etc." },
  { value: "COUNTRY", label: "📍 Country-Specific", desc: "US only, UK only, etc." },
];

const SENIORITY_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
  { value: "principal", label: "Principal" },
  { value: "manager", label: "Manager" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "fulltime", label: "Full-Time", icon: "💼" },
  { value: "contract", label: "Contract", icon: "📝" },
  { value: "parttime", label: "Part-Time", icon: "⏰" },
  { value: "b2b", label: "B2B", icon: "🤝" },
  { value: "internship", label: "Internship", icon: "🎓" },
];

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1d", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

// ─── Component ───────────────────────────────────────────

export default function FilterSidebar({
  filters,
  facets,
  onFilterChange,
  onApply,
  totalResults,
  isSubscribed,
  savedPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onUpgradeClick,
}: FilterSidebarProps) {
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);

  const toggleArrayFilter = useCallback(
    (
      key: "remoteType" | "framework" | "remoteScope" | "seniority" | "employmentType",
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
      remoteScope: [],
      seniority: [],
      employmentType: [],
      excludeKeywords: "",
    });
  }, [filters.q, onFilterChange]);

  const hasActiveFilters =
    filters.location ||
    filters.remoteType.length > 0 ||
    filters.framework.length > 0 ||
    filters.postedWithin ||
    filters.remoteScope.length > 0 ||
    filters.seniority.length > 0 ||
    filters.employmentType.length > 0 ||
    filters.excludeKeywords;

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    onSavePreset?.(presetName.trim());
    setPresetName("");
    setShowPresetInput(false);
  };

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

      {/* Saved Presets */}
      {(savedPresets && savedPresets.length > 0) && (
        <div className="filter-section">
          <h3>⚡ Quick Filters</h3>
          <div className="flex flex-col gap-1.5">
            {savedPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1">
                <button
                  className="toggle-pill active flex-1 text-left min-h-[36px] text-xs"
                  onClick={() => onLoadPreset?.(preset)}
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => onDeletePreset?.(preset.id)}
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity min-h-[36px] px-1.5"
                  title="Delete preset"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Preset */}
      <div className="filter-section">
        {!showPresetInput ? (
          <button
            onClick={() => {
              if (!isSubscribed) {
                onUpgradeClick?.();
                return;
              }
              setShowPresetInput(true);
            }}
            className="text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1.5"
            style={{ color: "var(--accent-primary)" }}
          >
            {isSubscribed ? "💾 Save current filters as preset" : "💾 Save filters (PRO)"}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <input
              className="input min-h-[36px] text-xs flex-1"
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              className="btn-primary min-h-[36px] text-xs px-3 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => setShowPresetInput(false)}
              className="text-xs opacity-50 hover:opacity-100 min-h-[36px] px-1.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Framework / Tech Stack */}
      <div className="filter-section">
        <h3>🛠️ Tech Stack</h3>
        <div className="toggle-group">
          {FRAMEWORK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] ${
                filters.framework.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => toggleArrayFilter("framework", opt.value)}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remote Scope */}
      <div className="filter-section">
        <h3>🌍 Remote Eligibility</h3>
        <div className="flex flex-col gap-1.5">
          {REMOTE_SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] text-left ${
                filters.remoteScope.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => toggleArrayFilter("remoteScope", opt.value)}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Seniority */}
      <div className="filter-section">
        <h3>📊 Seniority Level</h3>
        <div className="toggle-group">
          {SENIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] ${
                filters.seniority.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => toggleArrayFilter("seniority", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employment Type */}
      <div className="filter-section">
        <h3>📋 Employment Type</h3>
        <div className="toggle-group">
          {EMPLOYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-pill min-h-[40px] ${
                filters.employmentType.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => toggleArrayFilter("employmentType", opt.value)}
            >
              {opt.icon} {opt.label}
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
        <h3>📍 Location / Timezone</h3>
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

      {/* Exclude Keywords */}
      <div className="filter-section">
        <h3>🚫 Exclude</h3>
        <input
          className="input min-h-[44px]"
          type="text"
          placeholder="Company or keyword to hide..."
          value={filters.excludeKeywords}
          onChange={(e) =>
            onFilterChange({ ...filters, excludeKeywords: e.target.value })
          }
        />
        <p className="text-[10px] mt-1 opacity-50">Separate multiple with commas</p>
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
    remoteScope:
      searchParams?.get("remoteScope")?.split(",").filter(Boolean) || [],
    seniority:
      searchParams?.get("seniority")?.split(",").filter(Boolean) || [],
    employmentType:
      searchParams?.get("employmentType")?.split(",").filter(Boolean) || [],
    excludeKeywords: searchParams?.get("excludeKeywords") || "",
  };
}
