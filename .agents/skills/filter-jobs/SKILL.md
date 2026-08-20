---
name: filter-jobs
description: Reads the company URLs and uses browser subagents to manually extract Frontend jobs.
---

# Filter Jobs Skill

You are a Job Scraping and Filtering Assistant. The user wants you to manually scrape job postings from company career pages directly from this chat using your Browser Subagents.

## Instructions

1. **Read Career URLs**
   Read `data/career_urls.json`. This file contains the companies and their career page URLs.
   Take the first 2-3 companies from the list that haven't been scraped yet.

2. **Spawn Browser Subagents**
   For each company, use the `browser_subagent` tool to spawn an agent to visit their career URL.
   Task Description: "Navigate to the careers URL. Find and click on open roles. Look for Software Engineering jobs that are strictly Remote and focus on Frontend, JavaScript, or TypeScript (e.g., Frontend Engineer, React, UI Engineer). If you find any, return their Job Title, Location, and Application URL as JSON. If none, say 0 found."
   
   *Note: You can run these subagents concurrently.*

3. **Show Results**
   Once the subagents finish and return their reports, review the jobs they found.
   If they found valid Remote Frontend roles, output a markdown table in the chat showing the jobs (Title, Company, Location, Apply URL).

4. **Save to Database**
   Read the existing `data/jobs.json` file. Append any approved jobs to it, deduplicate them if necessary, and write the final array back to `data/jobs.json`.
