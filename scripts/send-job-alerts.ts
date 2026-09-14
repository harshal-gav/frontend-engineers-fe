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
  const isDryRun = process.argv.includes("--dry-run");

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

  console.log(`Found ${newJobs.length} new jobs. Fetching premium users...`);

  // 3. Fetch Premium Users
  let premiumEmails: string[] = [];
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("users").where("isPremium", "==", true).get();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        premiumEmails.push(data.email);
      }
    });
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    process.exit(1);
  }

  if (premiumEmails.length === 0) {
    console.log("No premium users found to email.");
    return;
  }

  console.log(`Found ${premiumEmails.length} premium users. Preparing email...`);

  // 4. Construct Email HTML
  const jobsHtml = newJobs.map((job) => {
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

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a202c;">New Remote Frontend Jobs! 🚀</h1>
        <p style="color: #4a5568; font-size: 16px;">Here are the latest roles added to Frontend Engineers today.</p>
      </div>
      
      ${jobsHtml}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #a0aec0; font-size: 12px;">
        <p>You are receiving this email because you are a Pro member of Frontend Engineers.</p>
        <p><a href="https://frontendengineers.com" style="color: #a0aec0;">frontendengineers.com</a></p>
      </div>
    </div>
  `;

  // 5. Send Emails via Resend
  if (isDryRun) {
    console.log("DRY RUN: Would send the following email to:", premiumEmails.join(", "));
    console.log("Email HTML preview:");
    console.log(emailHtml);
    return;
  }

  try {
    // Resend allows up to 50 recipients per request. We'll chunk the emails.
    const CHUNK_SIZE = 50;
    for (let i = 0; i < premiumEmails.length; i += CHUNK_SIZE) {
      const chunk = premiumEmails.slice(i, i + CHUNK_SIZE);
      
      const { data, error } = await resend!.emails.send({
        from: "Frontend Engineers <hello@frontendengineers.com>",
        to: ["hello@frontendengineers.com"], // Required 'to' field
        bcc: chunk, // Hide recipients from each other
        subject: `🚀 ${newJobs.length} New Remote Frontend Jobs`,
        html: emailHtml,
      });

      if (error) {
        console.error(`Resend error sending to chunk ${i / CHUNK_SIZE + 1}:`, error);
      } else {
        console.log(`Successfully sent batch ${i / CHUNK_SIZE + 1}`, data);
      }
    }
  } catch (error) {
    console.error("Unexpected error sending emails:", error);
  }
}

main().catch(console.error);
