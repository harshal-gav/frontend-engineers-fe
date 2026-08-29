# Best Remote Frontend Jobs Portal

Welcome to the **Best Remote Frontend Jobs** platform! This project is a highly curated, premium job board dedicated specifically to React, Vue, Angular, Node.js, and Fullstack JavaScript/TypeScript engineers looking for 100% remote opportunities.

## Project Overview

This platform offers a seamless experience for finding top-tier frontend engineering roles. It includes dynamic filtering, lightning-fast fuzzy search, and a premium membership tier ("Pro Membership") to unlock exclusive job listings and direct-to-ATS apply links.

### Key Features
- **Curated Job Listings**: Premium, hand-picked remote frontend jobs.
- **Advanced Filtering**: Filter by framework (React, Vue, Angular), employment type, experience level, salary range, and more.
- **Lightning Fast Search**: Integrated `fuse.js` for instant, typo-tolerant fuzzy searching.
- **Pro Membership Paywall**: Premium features locked behind a subscription model.
- **Authentication**: Fully integrated Firebase Authentication (Google Sign-In & Email/Password).
- **Payment Processing**: Dual support for **PayPal** and **PayU** subscriptions with automated webhooks.
- **Firebase Firestore**: Secure backend database storing user metadata, subscription status, and job listings.
- **SEO Optimized**: Statically generated sitemaps (`sitemap.xml`) and JSON-LD structured data for better search engine indexing.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling**: Tailwind CSS with custom glassmorphism and modern dark-mode UI.
- **Backend & Auth**: Firebase (Authentication, Firestore)
- **Payments**: PayPal (via `@paypal/react-paypal-js`), PayU Server-side integration
- **Search**: Fuse.js for client-side search.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup
Ensure you have the `.env` file populated with your Firebase and Payment gateway credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
NEXT_PUBLIC_PAYPAL_PLAN_ID=...
PAYU_MERCHANT_KEY=...
PAYU_MERCHANT_SALT=...
```

## Agents & Subagents
This project leverages intelligent AI agents for scraping and data curation. Refer to the `.agents/skills/filter-jobs/SKILL.md` skill for instructions on using browser subagents to manually extract Frontend jobs from company URLs.

## Legal Pages
All dynamic legal markdown pages are located in `/content/legal/`. They are statically rendered using `react-markdown` on build time for optimized performance.
