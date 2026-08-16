import fs from "fs";
import path from "path";
import { generateSlug, type Job } from "./jobs";

/**
 * Read and parse jobs.json from the data directory.
 * Filters to remote + frontend-relevant jobs, enriches with slug, excludes dead jobs.
 * This is a server-side only function.
 */
export function loadJobsFromFile(): Job[] {
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  if (!fs.existsSync(jobsPath)) return [];

  const raw = fs.readFileSync(jobsPath, "utf-8");
  const jobs: Job[] = JSON.parse(raw);

  return jobs
    .filter((job) => {
      // Exclude dead jobs
      if (job.isDead) return false;

      const isRemote =
        job.remoteType === "REMOTE" ||
        (job.location && /remote|anywhere/i.test(job.location));

      const isRelevant =
        /\b(frontend|front-end|react|vue|angular|ui|ux|web|software|engineer|developer)\b/i.test(
          job.title
        ) ||
        (job.description &&
          /\b(frontend|front-end|react|vue|angular|software)\b/i.test(
            job.description
          ));

      return isRemote && isRelevant;
    })
    .map((job) => ({
      ...job,
      slug: generateSlug(job),
    }));
}
