import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import fs from "fs";

dotenv.config();

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

async function exportUsers() {
  try {
    const db = getAdminDb();
    const usersSnapshot = await db.collection("users").get();
    
    const freeUserEmails: string[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.isPremium && data.email) {
        freeUserEmails.push(data.email);
      }
    });

    console.log(`Found ${freeUserEmails.length} free users.`);
    
    const CHUNK_SIZE = 50;
    let outputContent = "=== FREE USER EMAIL BATCHES (FOR BCC) ===\n\n";
    
    for (let i = 0; i < freeUserEmails.length; i += CHUNK_SIZE) {
      const chunk = freeUserEmails.slice(i, i + CHUNK_SIZE);
      outputContent += `--- BATCH ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} emails) ---\n`;
      outputContent += chunk.join(", ") + "\n\n";
    }

    fs.writeFileSync("email-batches.txt", outputContent);
    console.log("Successfully wrote batches to email-batches.txt");

  } catch (error) {
    console.error("Error exporting users:", error);
  }
}

exportUsers();
