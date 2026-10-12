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
  let alertsToSend: any[] = [];
  try {
    const snapshot = await db.collection("users").get();
    const seenEmails = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.email) return;

      const email = data.email.toLowerCase().trim();
      if (seenEmails.has(email)) return;
      seenEmails.add(email);

      const isPremium = (data.isPremium === true || data.isSubscribed === true) && 
        (!data.subscriptionExpiresAt || new Date(data.subscriptionExpiresAt) > new Date());

      const alertPref = data.job_alerts;
      const hasSpecificAlert = Boolean(
        alertPref && (
          (typeof alertPref.query === "string" && alertPref.query.trim().length > 0) ||
          (typeof alertPref.location === "string" && 
           alertPref.location.trim().toLowerCase() !== "worldwide" && 
           alertPref.location.trim().toLowerCase() !== "any remote" &&
           alertPref.location.trim().toLowerCase() !== "all")
        )
      );

      // If user selected a specific alert (e.g. React js, specific location):
      // Send ONLY their specific alert — do NOT also send the default daily alert!
      if (hasSpecificAlert) {
        alertsToSend.push({
          email: data.email,
          alert: {
            query: (alertPref.query || "").trim(),
            location: (alertPref.location || "worldwide").trim()
          },
          isPremium,
          isDefault: false
        });
      } else if (isPremium) {
        // Pro user who did not configure a specific alert filter:
        // Send the default worldwide daily alert
        alertsToSend.push({
          email: data.email,
          alert: { query: "", location: "worldwide" },
          isPremium: true,
          isDefault: true
        });
      }
    });
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    process.exit(1);
  }

  if (alertsToSend.length === 0) {
    console.log("No alerts to send found.");
    return;
  }

  console.log(`Found ${alertsToSend.length} total alerts to send.`);

  // Group alerts by identical criteria to batch send via BCC
  const alertGroups: { [key: string]: { alert: any, isPremium: boolean, isDefault: boolean, emails: string[] } } = {};
  
  for (const item of alertsToSend) {
    const normQuery = (item.alert.query || '').toLowerCase().trim();
    const normLoc = (item.alert.location || 'worldwide').toLowerCase().trim();
    const key = `${normQuery}|${normLoc}|${item.isPremium}|${item.isDefault}`;
    if (!alertGroups[key]) {
      alertGroups[key] = { alert: item.alert, isPremium: item.isPremium, isDefault: item.isDefault, emails: [] };
    }
    alertGroups[key].emails.push(item.email);
  }

  console.log(`Grouped into ${Object.keys(alertGroups).length} unique alert types.`);

  // Helper function to check if a job matches an alert
  function jobMatchesAlert(job: Job, alert: { query?: string; location?: string }): boolean {
    // 1. Technology / Keyword match
    if (alert.query && alert.query.trim()) {
      const rawQuery = alert.query.trim().toLowerCase();
      const title = (job.title || "").toLowerCase();
      const desc = (job.description || "").toLowerCase();
      const company = (job.company?.name || "").toLowerCase();
      const stack = (job.aiTags?.stack || []).map(s => s.toLowerCase());
      const fullText = `${title} ${desc} ${company}`;

      // Normalize common tech names (e.g. "react js" -> "react", "vue js" -> "vue", "next js" -> "next")
      const cleanTech = rawQuery
        .replace(/\b(\.?js|\.?ts)\b/gi, "")
        .replace(/[\s\-_]+/g, "")
        .trim();

      let matched = false;

      // Direct substring match
      if (fullText.includes(rawQuery) || stack.includes(rawQuery)) {
        matched = true;
      }
      // Normalized tech check in stack or as word boundary in text
      else if (cleanTech && cleanTech.length >= 2 && (
        stack.includes(cleanTech) ||
        stack.some(s => s.includes(cleanTech) || cleanTech.includes(s)) ||
        new RegExp(`\\b${cleanTech}\\b`, "i").test(fullText)
      )) {
        matched = true;
      }
      // Token-based matching for multi-word queries (e.g. "Senior React")
      else {
        const tokens = rawQuery.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
          matched = tokens.every(tok => {
            const tokClean = tok.replace(/\b(\.?js|\.?ts)\b/gi, "").trim();
            if (fullText.includes(tok) || stack.includes(tok)) return true;
            if (tokClean && tokClean.length >= 2 && (
              stack.includes(tokClean) || 
              new RegExp(`\\b${tokClean}\\b`, "i").test(fullText)
            )) return true;
            return false;
          });
        }
      }

      if (!matched) return false;
    }

    // 2. Location match
    const loc = (alert.location || "worldwide").trim().toLowerCase();
    if (loc !== "worldwide" && loc !== "any" && loc !== "any remote" && loc !== "all") {
      const jobLoc = [
        job.location || "",
        job.country || "",
        ...(job.aiTags?.eligibleRegions || [])
      ].join(" ").toLowerCase();

      const isGlobal = job.aiTags?.remoteScope === "GLOBAL" || 
        jobLoc.includes("worldwide") || 
        jobLoc.includes("anywhere") || 
        jobLoc.includes("global");

      if (loc === "us only" || loc === "united states" || loc === "us") {
        if (!jobLoc.includes("us") && !jobLoc.includes("united states") && !isGlobal) {
          return false;
        }
      } else if (loc === "europe" || loc === "eu") {
        if (!jobLoc.includes("europe") && !jobLoc.includes("eu") && !jobLoc.includes("uk") && !jobLoc.includes("united kingdom") && !isGlobal) {
          return false;
        }
      } else if (loc === "asia") {
        if (!jobLoc.includes("asia") && !jobLoc.includes("india") && !jobLoc.includes("singapore") && !jobLoc.includes("japan") && !isGlobal) {
          return false;
        }
      } else if (!jobLoc.includes(loc) && !isGlobal) {
        return false;
      }
    }

    return true;
  }

  // 4. Construct and Send Batched Emails
  for (const key of Object.keys(alertGroups)) {
    const group = alertGroups[key];
    const { alert, isPremium, isDefault, emails } = group;
    
    // Filter new jobs based on group preferences
    const matchedJobs = newJobs.filter(job => jobMatchesAlert(job, alert));

    if (matchedJobs.length === 0) {
      if (isDryRun) {
        console.log(`DRY RUN: 0 matching jobs for alert type "${key}" (${emails.length} users). Skipping.`);
      }
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

    const hasQuery = Boolean(alert.query && alert.query.trim());
    const hasLocation = Boolean(alert.location && !["worldwide", "any", "any remote", "all"].includes(alert.location.trim().toLowerCase()));

    let titleText: string;
    let subjectText: string;
    let descriptionText: string;

    if (!isDefault && (hasQuery || hasLocation)) {
      const criteriaParts: string[] = [];
      if (hasQuery) criteriaParts.push(alert.query.trim());
      if (hasLocation) criteriaParts.push(alert.location.trim());
      const criteriaStr = criteriaParts.join(" • ");

      titleText = `🔔 Your ${criteriaStr} Job Alert`;
      subjectText = `🔔 ${matchedJobs.length} New Remote Jobs matching "${criteriaStr}" for you`;
      descriptionText = `Here are today's remote jobs matching your preferences: <strong>${criteriaStr}</strong>.`;
    } else {
      titleText = "🔥 All New Remote Frontend Jobs";
      subjectText = `🔥 ${matchedJobs.length} New Remote Frontend Jobs for you`;
      descriptionText = "Here are today's remote frontend jobs matching your preferences.";
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a202c; font-size: 24px;">${titleText}</h1>
          <p style="color: #4a5568; font-size: 16px;">${descriptionText}</p>
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
      console.log(`DRY RUN: Would send to ${emails.length} users with ${matchedJobs.length} jobs (Subject: "${subjectText}").`);
    } else {
      // Chunk emails into batches of 49 for Resend limits
      for (let i = 0; i < emails.length; i += 49) {
        const bccBatch = emails.slice(i, i + 49);
        try {
          await resend!.emails.send({
            from: "Frontend Engineers <hello@frontendengineers.com>",
            to: ["hello@frontendengineers.com"], // Self address in To
            bcc: bccBatch,
            subject: subjectText,
            html: emailHtml,
          });
          console.log(`Sent alert batch to ${bccBatch.length} users for alert type: ${key}`);
          // Delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Failed to send alert batch to ${bccBatch.length} users:`, err);
        }
      }
    }
  }
}

main().catch(console.error);
