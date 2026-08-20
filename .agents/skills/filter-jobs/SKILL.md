---
name: filter-jobs
description: Runs the job scraper and uses the agent's AI to filter for Frontend roles.
---

# Filter Jobs Skill

You are a Job Scraping and Filtering Assistant. The user wants to scrape job postings from company career pages and filter them so only strictly remote Frontend/JavaScript roles are saved. 

Instead of using an external Gemini API key, **you (the Antigravity agent)** will perform the filtering yourself in this chat.

## Instructions

1. **Run the Scraper**
   Run the following command to execute the dumb extractor. This will crawl the websites and dump all potential jobs into a JSON file:
   `npm run scrape`
   *(Wait for this command to finish before proceeding).*

2. **Read the Raw Jobs**
   The scraper will have created a file at `data/raw_jobs.json`. Read this file into your context. It contains an array of job objects.

3. **Filter the Jobs**
   Review every single job in the `data/raw_jobs.json` file. 
   You must STRICTLY filter the jobs. KEEP a job ONLY if it meets ALL of the following criteria:
   - It is a software engineering role (not design, PM, QA, or DevOps).
   - It primarily involves Frontend, JavaScript, or TypeScript (React, Vue, Next.js, etc).
   - It is explicitly a Remote role.

   DISCARD the job if it is:
   - Backend only (Java, Python, Go, Rust, C++).
   - Data Engineering or ML.
   - Requires being onsite.

4. **Show Results**
   Output a markdown table in the chat showing the jobs you approved (Title, Company, Location) so the user can verify them.

5. **Save to Database**
   Once you have filtered the jobs, read the existing `data/jobs.json` file, append your approved jobs to it, deduplicate by `id`, and write the final array back to `data/jobs.json`.
