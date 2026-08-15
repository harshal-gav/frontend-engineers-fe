import crypto from 'crypto';

interface NormalizedLocation {
  city: string | null;
  state: string | null;
  country: string | null;
  remoteType: 'ONSITE' | 'HYBRID' | 'REMOTE';
  rawLocation: string;
}

interface NormalizedSalary {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
}

type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | null;
type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

// ─── Common city → country mappings for quick lookups ──────────────
const CITY_COUNTRY_MAP: Record<string, { state?: string; country: string }> = {
  'san francisco': { state: 'CA', country: 'US' },
  'new york': { state: 'NY', country: 'US' },
  'los angeles': { state: 'CA', country: 'US' },
  'seattle': { state: 'WA', country: 'US' },
  'austin': { state: 'TX', country: 'US' },
  'chicago': { state: 'IL', country: 'US' },
  'boston': { state: 'MA', country: 'US' },
  'denver': { state: 'CO', country: 'US' },
  'portland': { state: 'OR', country: 'US' },
  'miami': { state: 'FL', country: 'US' },
  'atlanta': { state: 'GA', country: 'US' },
  'washington': { state: 'DC', country: 'US' },
  'london': { country: 'UK' },
  'berlin': { country: 'DE' },
  'amsterdam': { country: 'NL' },
  'paris': { country: 'FR' },
  'dublin': { country: 'IE' },
  'toronto': { state: 'ON', country: 'CA' },
  'vancouver': { state: 'BC', country: 'CA' },
  'sydney': { state: 'NSW', country: 'AU' },
  'melbourne': { state: 'VIC', country: 'AU' },
  'singapore': { country: 'SG' },
  'tokyo': { country: 'JP' },
  'bangalore': { state: 'KA', country: 'IN' },
  'bengaluru': { state: 'KA', country: 'IN' },
  'mumbai': { state: 'MH', country: 'IN' },
  'pune': { state: 'MH', country: 'IN' },
  'hyderabad': { state: 'TS', country: 'IN' },
  'delhi': { state: 'DL', country: 'IN' },
  'chennai': { state: 'TN', country: 'IN' },
  'gurgaon': { state: 'HR', country: 'IN' },
  'noida': { state: 'UP', country: 'IN' },
};

// US state abbreviations
const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
};

const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'USA': 'United States', 'United States': 'US',
  'UK': 'United Kingdom', 'GB': 'United Kingdom', 'United Kingdom': 'UK',
  'CA': 'Canada', 'Canada': 'CA',
  'DE': 'Germany', 'Germany': 'DE',
  'FR': 'France', 'France': 'FR',
  'AU': 'Australia', 'Australia': 'AU',
  'IN': 'India', 'India': 'IN',
  'SG': 'Singapore', 'Singapore': 'SG',
  'JP': 'Japan', 'Japan': 'JP',
  'IE': 'Ireland', 'Ireland': 'IE',
  'NL': 'Netherlands', 'Netherlands': 'NL',
};

// ─── Location Normalizer ──────────────────────────────────────────

export function normalizeLocation(rawLocation: string): NormalizedLocation {
  if (!rawLocation || rawLocation.trim() === '') {
    return { city: null, state: null, country: null, remoteType: 'ONSITE', rawLocation: '' };
  }

  const text = rawLocation.trim();
  const lower = text.toLowerCase();

  // Detect remote type
  let remoteType: 'ONSITE' | 'HYBRID' | 'REMOTE' = 'ONSITE';
  if (/\bremote\b|work from anywhere|work from home|distributed/i.test(lower)) {
    remoteType = 'REMOTE';
  } else if (/\bhybrid\b/i.test(lower)) {
    remoteType = 'HYBRID';
  }

  // Try to extract city, state, country from the text
  let city: string | null = null;
  let state: string | null = null;
  let country: string | null = null;

  // Remove "Remote" prefix/suffix for parsing
  const cleanedLocation = text
    .replace(/\b(remote|hybrid|onsite|on-site|in-office)\b/gi, '')
    .replace(/[()]/g, '')
    .replace(/\s*[-–—/,]\s*$/, '')
    .replace(/^\s*[-–—/,]\s*/, '')
    .trim();

  if (cleanedLocation) {
    // Split by common delimiters
    const parts = cleanedLocation.split(/[,;/]/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      // Try: "City, State" or "City, Country"
      const lastPart = parts[parts.length - 1].toUpperCase();
      const firstPart = parts[0];

      // Check if last part is a US state
      if (US_STATES[lastPart]) {
        state = lastPart;
        country = 'US';
        city = firstPart;
      }
      // Check if last part is a country
      else if (COUNTRY_NAMES[lastPart] || COUNTRY_NAMES[parts[parts.length - 1]]) {
        country = lastPart.length <= 3 ? lastPart : (COUNTRY_NAMES[parts[parts.length - 1]] || lastPart);
        if (parts.length >= 3) {
          city = parts[0];
          state = parts[1];
        } else {
          city = firstPart;
        }
      } else {
        city = firstPart;
        // The last part could be anything
        const lookupKey = parts[parts.length - 1].toLowerCase();
        if (CITY_COUNTRY_MAP[lookupKey]) {
          country = CITY_COUNTRY_MAP[lookupKey].country;
        }
      }
    } else {
      // Single part — might be just a city
      const lookupKey = cleanedLocation.toLowerCase();
      if (CITY_COUNTRY_MAP[lookupKey]) {
        city = cleanedLocation;
        state = CITY_COUNTRY_MAP[lookupKey].state || null;
        country = CITY_COUNTRY_MAP[lookupKey].country;
      } else if (COUNTRY_NAMES[cleanedLocation] || COUNTRY_NAMES[cleanedLocation.toUpperCase()]) {
        country = cleanedLocation.toUpperCase().length <= 3
          ? cleanedLocation.toUpperCase()
          : (COUNTRY_NAMES[cleanedLocation] || cleanedLocation);
      } else {
        city = cleanedLocation;
      }
    }
  }

  return { city, state, country, remoteType, rawLocation: text };
}

// ─── Salary Normalizer ────────────────────────────────────────────

const CURRENCY_PATTERNS: { pattern: RegExp; currency: string }[] = [
  { pattern: /\$|USD|usd/, currency: 'USD' },
  { pattern: /€|EUR|eur/, currency: 'EUR' },
  { pattern: /£|GBP|gbp/, currency: 'GBP' },
  { pattern: /₹|INR|inr|lakh|lpa|lac/, currency: 'INR' },
  { pattern: /¥|JPY|jpy/, currency: 'JPY' },
  { pattern: /C\$|CAD|cad/, currency: 'CAD' },
  { pattern: /A\$|AUD|aud/, currency: 'AUD' },
  { pattern: /S\$|SGD|sgd/, currency: 'SGD' },
];

export function normalizeSalary(rawSalary: string): NormalizedSalary {
  if (!rawSalary || rawSalary.trim() === '') {
    return { salaryMin: null, salaryMax: null, currency: 'USD' };
  }

  const text = rawSalary.trim();

  // Detect currency
  let currency = 'USD';
  for (const { pattern, currency: curr } of CURRENCY_PATTERNS) {
    if (pattern.test(text)) {
      currency = curr;
      break;
    }
  }

  // Extract numbers
  const numbers: number[] = [];
  const numPattern = /[\d,]+\.?\d*\s*[kKlLmM]?/g;
  let match;

  while ((match = numPattern.exec(text)) !== null) {
    let numStr = match[0].replace(/,/g, '').trim();
    let multiplier = 1;

    if (/[kK]$/.test(numStr)) {
      multiplier = 1000;
      numStr = numStr.replace(/[kK]$/, '');
    } else if (/[lL]$/.test(numStr) || /lakh|lac|lpa/i.test(text)) {
      multiplier = 100000;
      numStr = numStr.replace(/[lL]$/, '');
    } else if (/[mM]$/.test(numStr)) {
      multiplier = 1000000;
      numStr = numStr.replace(/[mM]$/, '');
    }

    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) {
      numbers.push(Math.round(num * multiplier));
    }
  }

  if (numbers.length === 0) {
    return { salaryMin: null, salaryMax: null, currency };
  }

  if (numbers.length === 1) {
    // Could be yearly or hourly — assume yearly if > 1000
    return { salaryMin: numbers[0], salaryMax: numbers[0], currency };
  }

  // Two or more numbers — take min and max
  return {
    salaryMin: Math.min(...numbers),
    salaryMax: Math.max(...numbers),
    currency,
  };
}

// ─── Experience Level Inference ───────────────────────────────────

const EXPERIENCE_PATTERNS: { level: ExperienceLevel; patterns: RegExp[] }[] = [
  {
    level: 'LEAD',
    patterns: [
      /\b(lead|principal|staff|director|head of|vp|architect)\b/i,
      /\b(8\+|9\+|10\+|12\+|15\+)\s*years?\b/i,
    ],
  },
  {
    level: 'SENIOR',
    patterns: [
      /\b(senior|sr\.?|experienced|expert)\b/i,
      /\b(5\+|6\+|7\+|5-10|5-8)\s*years?\b/i,
    ],
  },
  {
    level: 'MID',
    patterns: [
      /\b(mid[- ]?level|intermediate|regular)\b/i,
      /\b(2-5|3-5|2-4|3-6|3-4)\s*years?\b/i,
    ],
  },
  {
    level: 'ENTRY',
    patterns: [
      /\b(junior|jr\.?|entry[- ]?level|associate|trainee|graduate|new grad|fresh)\b/i,
      /\b(0-[123]|1-[23]|0-1)\s*years?\b/i,
    ],
  },
];

export function inferExperienceLevel(title: string, description?: string): ExperienceLevel {
  const text = `${title} ${description || ''}`;

  for (const { level, patterns } of EXPERIENCE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return level;
      }
    }
  }

  return null;
}

// ─── Employment Type Inference ────────────────────────────────────

export function inferEmploymentType(text: string): EmploymentType {
  const lower = text.toLowerCase();

  if (/\b(intern(ship)?|internee)\b/i.test(lower)) return 'INTERNSHIP';
  if (/\b(contract(or)?|freelance|consulting|temporary|temp)\b/i.test(lower)) return 'CONTRACT';
  if (/\b(part[- ]?time|half[- ]?time)\b/i.test(lower)) return 'PART_TIME';

  return 'FULL_TIME';
}

// ─── Source Hash Generator ────────────────────────────────────────

export function generateSourceHash(
  companyId: string,
  title: string,
  location: string,
  postedAt?: string | Date | null
): string {
  const parts = [
    companyId.trim().toLowerCase(),
    title.trim().toLowerCase(),
    (location || '').trim().toLowerCase(),
    postedAt ? new Date(postedAt).toISOString().split('T')[0] : 'unknown',
  ];

  return crypto
    .createHash('sha256')
    .update(parts.join('|'))
    .digest('hex');
}

// ─── Full Job Normalizer ──────────────────────────────────────────

export interface RawScrapedJob {
  title: string;
  url: string;
  location?: string;
  salary?: string;
  description?: string;
  department?: string;
  type?: string;
  postedAt?: string;
}

export interface NormalizedJob {
  id: string;
  title: string;
  applyUrl: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  remoteType: 'ONSITE' | 'HYBRID' | 'REMOTE';
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  department: string | null;
  postedAt: Date | null;
  sourceHash: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
    industry: string | null;
    website: string | null;
  };
}

export function normalizeJob(
  raw: RawScrapedJob,
  companyId: string
): NormalizedJob {
  const loc = normalizeLocation(raw.location || '');

  // Also check description for remote type if location didn't indicate it
  if (loc.remoteType === 'ONSITE' && raw.description) {
    if (/\bremote\b|work from anywhere|work from home/i.test(raw.description)) {
      loc.remoteType = 'REMOTE';
    } else if (/\bhybrid\b/i.test(raw.description)) {
      loc.remoteType = 'HYBRID';
    }
  }

  // Also check type field
  if (raw.type && loc.remoteType === 'ONSITE') {
    if (/remote/i.test(raw.type)) loc.remoteType = 'REMOTE';
    else if (/hybrid/i.test(raw.type)) loc.remoteType = 'HYBRID';
  }

  const salary = normalizeSalary(raw.salary || '');
  const fullText = `${raw.title} ${raw.description || ''} ${raw.type || ''}`;

  let postedAt: Date | null = null;
  if (raw.postedAt) {
    const parsed = new Date(raw.postedAt);
    if (!isNaN(parsed.getTime())) {
      postedAt = parsed;
    }
  }

  const sourceHash = generateSourceHash(companyId, raw.title, raw.location || '', postedAt);
  
  return {
    id: sourceHash,
    title: raw.title.trim(),
    applyUrl: raw.url,
    description: raw.description?.trim() || null,
    location: raw.location?.trim() || null,
    city: loc.city,
    state: loc.state,
    country: loc.country,
    remoteType: loc.remoteType,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    experienceLevel: inferExperienceLevel(raw.title, raw.description),
    employmentType: inferEmploymentType(fullText),
    department: raw.department?.trim() || null,
    postedAt,
    sourceHash,
  };
}
