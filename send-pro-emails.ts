import { Resend } from "resend";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

dotenv.config();

function getAdminDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.firestore();
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendProEmails() {
  try {
    const db = getAdminDb();
    console.log("Fetching Pro users from Firestore...");
    const usersSnapshot = await db.collection("users").where("isPremium", "==", true).get();
    
    const proUserEmails: string[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        proUserEmails.push(data.email);
      }
    });

    console.log(`Found ${proUserEmails.length} Pro users with emails.`);
    
    if (proUserEmails.length === 0) {
      console.log("No Pro users to send to. Exiting.");
      return;
    }

    const htmlContent = fs.readFileSync(path.join(process.cwd(), "early-access-email-draft.html"), "utf-8");

    // Resend batch limit is 100 emails per request
    const CHUNK_SIZE = 100;
    
    console.log(`Sending emails in batches of ${CHUNK_SIZE}...`);
    
    for (let i = 0; i < proUserEmails.length; i += CHUNK_SIZE) {
      const chunk = proUserEmails.slice(i, i + CHUNK_SIZE);
      
      const payload = chunk.map(email => ({
        from: "FrontendEngineers <hello@frontendengineers.com>",
        to: email,
        subject: "⭐ Priority Access: Fresh remote frontend jobs are here!",
        html: htmlContent,
      }));

      console.log(`Sending batch ${i / CHUNK_SIZE + 1} (${chunk.length} emails)...`);
      
      const { data, error } = await resend.batch.send(payload);

      if (error) {
        console.error(`Error sending batch ${i / CHUNK_SIZE + 1}:`, error);
      } else {
        console.log(`Successfully sent batch ${i / CHUNK_SIZE + 1}!`, data);
      }
      
      // Add a small delay between batches to be safe with rate limits
      if (i + CHUNK_SIZE < proUserEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("Finished sending early access emails to Pro users!");

  } catch (error) {
    console.error("Critical error during bulk send:", error);
  }
}

sendProEmails();
