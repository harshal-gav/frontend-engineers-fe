import { Resend } from "resend";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

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

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendBulkPromo() {
  try {
    const db = getAdminDb();
    console.log("Fetching users from Firestore...");
    const usersSnapshot = await db.collection("users").get();
    
    const freeUserEmails: string[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      // Only get free users who have an email
      if (!data.isPremium && data.email) {
        freeUserEmails.push(data.email);
      }
    });

    console.log(`Found ${freeUserEmails.length} free users.`);
    
    if (freeUserEmails.length === 0) {
      console.log("No free users to send to. Exiting.");
      return;
    }

    const htmlContent = fs.readFileSync(path.join(process.cwd(), "email/promo.html"), "utf-8");

    // Resend batch limit is 100 emails per request
    const CHUNK_SIZE = 100;
    
    console.log(`Sending emails in batches of ${CHUNK_SIZE}...`);
    
    for (let i = 0; i < freeUserEmails.length; i += CHUNK_SIZE) {
      const chunk = freeUserEmails.slice(i, i + CHUNK_SIZE);
      
      const payload = chunk.map(email => ({
        from: "Harshal <hello@frontendengineers.com>",
        to: email,
        subject: "Quick question about your job search",
        html: htmlContent,
      }));

      console.log(`Sending batch ${i / CHUNK_SIZE + 1} (${chunk.length} emails)...`);
      
      const { data, error } = await resend.batch.send(payload);

      if (error) {
        console.error(`Error sending batch ${i / CHUNK_SIZE + 1}:`, error);
      } else {
        console.log(`Successfully sent batch ${i / CHUNK_SIZE + 1}!`);
      }
      
      // Add a small delay between batches to be safe with rate limits
      if (i + CHUNK_SIZE < freeUserEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("Finished sending all promotional emails!");

  } catch (error) {
    console.error("Critical error during bulk send:", error);
  }
}

sendBulkPromo();
