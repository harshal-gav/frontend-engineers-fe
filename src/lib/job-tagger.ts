const STACK_PATTERNS = [
  { tag: 'react', patterns: [/\breact(?:\.?js)?\b/i, /\breactjs\b/i] },
  { tag: 'vue', patterns: [/\bvue(?:\.?js)?\b/i, /\bvuejs\b/i] },
  { tag: 'angular', patterns: [/\bangular(?:js)?\b/i] },
  { tag: 'nextjs', patterns: [/\bnext\.?js\b/i, /\bnext\.js\b/i] },
  { tag: 'nuxtjs', patterns: [/\bnuxt(?:\.?js)?\b/i] },
  { tag: 'svelte', patterns: [/\bsvelte(?:kit)?\b/i] },
  { tag: 'sveltekit', patterns: [/\bsveltekit\b/i] },
  { tag: 'typescript', patterns: [/\btypescript\b/i, /\bTS\b/] },
  { tag: 'javascript', patterns: [/\bjavascript\b/i, /\bJS\b/, /\bES6\b/i, /\bES2015\b/i, /\becmascript\b/i] },
  { tag: 'css', patterns: [/\bCSS(?:3)?\b/i] },
  { tag: 'tailwind', patterns: [/\btailwind(?:\s?css)?\b/i] },
  { tag: 'sass', patterns: [/\bsass\b/i, /\bscss\b/i] },
  { tag: 'less', patterns: [/\bless\b/i] },
  { tag: 'webpack', patterns: [/\bwebpack\b/i] },
  { tag: 'vite', patterns: [/\bvite\b/i] },
  { tag: 'redux', patterns: [/\bredux\b/i] },
  { tag: 'mobx', patterns: [/\bmobx\b/i] },
  { tag: 'zustand', patterns: [/\bzustand\b/i] },
  { tag: 'graphql', patterns: [/\bgraphql\b/i, /\bgraph\s?ql\b/i] },
  { tag: 'storybook', patterns: [/\bstorybook\b/i] },
  { tag: 'figma', patterns: [/\bfigma\b/i] },
  { tag: 'cypress', patterns: [/\bcypress\b/i] },
  { tag: 'jest', patterns: [/\bjest\b/i] },
  { tag: 'playwright', patterns: [/\bplaywright\b/i] },
  { tag: 'flutter', patterns: [/\bflutter\b/i] },
  { tag: 'blazor', patterns: [/\bblazor\b/i] },
  { tag: 'ember', patterns: [/\bember(?:\.?js)?\b/i] },
  { tag: 'jquery', patterns: [/\bjquery\b/i] },
  { tag: 'html', patterns: [/\bhtml(?:5)?\b/i] },
  { tag: 'accessibility', patterns: [/\baccessibility\b/i, /\bWCAG\b/i, /\ba11y\b/i, /\baria\b/i] },
  { tag: 'webgl', patterns: [/\bwebgl\b/i] },
  { tag: 'threejs', patterns: [/\bthree\.?js\b/i] },
  { tag: 'd3', patterns: [/\bd3(?:\.js)?\b/i] },
  { tag: 'gatsby', patterns: [/\bgatsby\b/i] },
  { tag: 'remix', patterns: [/\bremix\b/i] },
  { tag: 'astro', patterns: [/\bastro\b/i] },
];

export function autoTagJob(job: { title: string; description: string; location?: string; country?: string }) {
  const text = `${job.title || ''} ${job.description || ''}`;
  
  // 1. Stack
  const stackSet = new Set<string>();
  for (const { tag, patterns } of STACK_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        stackSet.add(tag);
        break;
      }
    }
  }
  
  // 2. Remote Scope
  const locText = `${job.location || ''} ${job.country || ''} ${job.description || ''}`;
  let remoteScope: 'GLOBAL' | 'REGION' | 'COUNTRY' = 'GLOBAL';
  let eligibleRegions = ['Global'];
  
  if (/\bauthori[sz]ed\s+to\s+work\b/i.test(locText) || /\bno\s+visa\s+sponsorship\b/i.test(locText) || /\bmust\s+be\s+a\s+US\b/i.test(locText)) {
    remoteScope = 'COUNTRY';
    eligibleRegions = [job.country || 'United States'];
  } else if (job.location && job.location.includes('Remote - ')) {
    const loc = job.location.replace('Remote - ', '').trim();
    if (loc !== 'Global' && loc !== 'Anywhere') {
      remoteScope = 'COUNTRY';
      eligibleRegions = [loc];
    }
  } else if (/\blatam\b|\beurope\b|\bemea\b/i.test(locText)) {
    remoteScope = 'REGION';
    eligibleRegions = locText.match(/\blatam\b/i) ? ['LATAM'] : ['Europe'];
  }
  
  // 3. Seniority
  let seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'manager' = 'mid';
  const titleLower = (job.title || '').toLowerCase();
  if (/\b(?:junior|jr\.?|entry)\b/i.test(titleLower)) seniority = 'junior';
  else if (/\b(?:principal|architect|staff)\b/i.test(titleLower)) seniority = 'principal';
  else if (/\b(?:lead|manager|head)\b/i.test(titleLower)) seniority = 'lead';
  else if (/\b(?:senior|sr\.?)\b/i.test(titleLower)) seniority = 'senior';
  else {
    const yearsMatch = text.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years <= 2) seniority = 'junior';
      else if (years >= 5) seniority = 'senior';
    }
  }
  
  // 4. Employment Type
  let employmentType: 'fulltime' | 'contract' | 'parttime' | 'b2b' | 'internship' = 'fulltime';
  if (/\b(?:intern|internship)\b/i.test(text)) employmentType = 'internship';
  else if (/\bb2b\b/i.test(text)) employmentType = 'b2b';
  else if (/\b(?:contract|freelance|1099)\b/i.test(text)) employmentType = 'contract';
  else if (/\bpart[\s-]?time\b/i.test(text)) employmentType = 'parttime';

  return {
    stack: Array.from(stackSet),
    remoteScope,
    eligibleRegions,
    seniority,
    employmentType
  };
}
