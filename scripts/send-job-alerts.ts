import fs from "fs";
import path from "path";
import { Resend } from "resend";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

// Load environment variables from .env if running locally
dotenv.config();

// Ensure Firebase Admin is initialized
function getAdminDb() {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      throw new Error("Missing FIREBASE_PROJECT_ID for admin db");
    }
  }
  return admin.firestore();
}

const isDryRun = process.argv.includes("--dry-run");

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY && !isDryRun) {
  console.error("Missing RESEND_API_KEY");
  process.exit(1);
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

import { Job, generateSlug } from "../src/lib/jobs";

async function main() {
  // 1. Load Jobs
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  if (!fs.existsSync(jobsPath)) {
    console.error("No jobs.json found");
    return;
  }

  const rawJobs: Job[] = JSON.parse(fs.readFileSync(jobsPath, "utf-8"));
  
  // 2. Filter New Jobs (added in the last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const newJobs = rawJobs.filter((job) => {
    if (!job.postedAt) return false;
    const postedDate = new Date(job.postedAt);
    return postedDate > oneDayAgo;
  });

  if (newJobs.length === 0) {
    console.log("No new jobs in the last 24 hours. Exiting.");
    return;
  }

  console.log(`Found ${newJobs.length} new jobs. Fetching users with job alerts...`);

  // 3. Fetch Users
  const db = getAdminDb();
  let usersToAlert: any[] = [];
  try {
    const snapshot = await db.collection("users").get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email && data.job_alerts && data.isSubscribed) {
        usersToAlert.push(data);
      }
    });
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    process.exit(1);
  }

  if (usersToAlert.length === 0) {
    console.log("No users with job alerts found.");
    return;
  }

  console.log(`Found ${usersToAlert.length} users with job alerts.`);

  // 4. Construct and Send Individual Emails
  for (const user of usersToAlert) {
    const alert = user.job_alerts;
    
    // Filter new jobs based on user preferences
    const matchedJobs = newJobs.filter(job => {
      const text = `${job.title} ${job.description || ""}`.toLowerCase();
      
      // Technology match
      if (alert.query && !text.includes(alert.query.toLowerCase())) {
        return false;
      }
      // Location match
      const loc = alert.location?.toLowerCase() || "worldwide";
      const jobLoc = (job.location || "").toLowerCase();
      if (loc === "us only" && !jobLoc.includes("us") && !jobLoc.includes("united states")) {
        return false;
      }
      if (loc === "europe" && !jobLoc.includes("eu") && !jobLoc.includes("europe")) {
        return false;
      }
      if (loc === "asia" && !jobLoc.includes("asia")) {
        return false;
      }

      return true;
    });

    if (matchedJobs.length === 0) {
      continue;
    }

    const jobsHtml = matchedJobs.slice(0, 15).map((job) => {
      const slug = job.slug || generateSlug(job);
      const jobUrl = `https://frontendengineers.com/jobs/${slug}`;
      return `
        <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1a202c; font-size: 18px;">
            <a href="${jobUrl}" style="color: #2563eb; text-decoration: none;">${job.title}</a>
          </h3>
          <p style="margin: 0 0 4px 0; color: #4a5568;">
            <strong>${job.company?.name || "Unknown Company"}</strong>
          </p>
          <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px;">
            📍 ${job.location || "Remote"}
          </p>
          <a href="${jobUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Job & Apply</a>
        </div>
      `;
    }).join("");

    const isPremium = user.isPremium === true && (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date());

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a202c;">🔥 Your Remote Frontend Jobs</h1>
          <p style="color: #4a5568; font-size: 16px;">Here are today's remote frontend jobs matching your preferences.</p>
        </div>
        
        ${jobsHtml}
        
        ${!isPremium ? `
        <div style="margin-top: 40px; padding: 24px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; text-align: center;">
          <h2 style="color: #d97706; margin-top: 0;">Want the complete job-search experience?</h2>
          <p style="color: #b45309; font-size: 15px; margin-bottom: 20px;">
            ⭐ Upgrade to FrontendEngineers Pro for advanced search, filters, full job descriptions, direct apply links and daily job alerts.
          </p>
          <a href="https://frontendengineers.com/pricing" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
            Get Pro — $9/month
          </a>
        </div>
        ` : ""}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #a0aec0; font-size: 12px;">
          <p>You received this email because you created a job alert on Frontend Engineers.</p>
          <p><a href="https://frontendengineers.com/dashboard" style="color: #2563eb;">Edit your alert preferences</a></p>
        </div>
      </div>
    `;

    if (isDryRun) {
      console.log(`DRY RUN: Would send to ${user.email} with ${matchedJobs.length} jobs.`);
    } else {
      try {
        await resend!.emails.send({
          from: "Frontend Engineers <hello@frontendengineers.com>",
          to: [user.email],
          subject: `🔥 ${matchedJobs.length} New Remote Frontend Jobs for you`,
          html: emailHtml,
        });
        console.log(`Sent to ${user.email}`);
      } catch (e) {
        console.error(`Failed to send to ${user.email}`, e);
      }
    }
  }
}

main().catch(console.error);
