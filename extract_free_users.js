const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "/Users/harshalgavali/Desktop/job-portal/.env" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

async function extractFreeUsers() {
  try {
    const usersSnapshot = await db.collection("users").get();
    let freeUserEmails = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const isPremium = data.isPremium === true;
      const isEmployer = data.isEmployer === true;
      
      let hasExpired = false;
      if (data.subscriptionExpiresAt) {
          hasExpired = new Date(data.subscriptionExpiresAt) < new Date();
      }
      
      // If they are not premium, or their premium has expired, and they are not an employer
      if ((!isPremium || hasExpired) && !isEmployer) {
        if (data.email) {
            freeUserEmails.push(data.email);
        }
      }
    });

    console.log(`Found ${freeUserEmails.length} free users.`);
    
    let outputContent = "";
    const batchSize = 50;
    
    for (let i = 0; i < freeUserEmails.length; i += batchSize) {
      const batch = freeUserEmails.slice(i, i + batchSize);
      outputContent += `--- BATCH ${Math.floor(i / batchSize) + 1} ---\n`;
      outputContent += batch.join(", ") + "\n\n";
    }
    
    const outputPath = path.join("/Users/harshalgavali/Desktop/job-portal", "free-users-batches.txt");
    fs.writeFileSync(outputPath, outputContent, "utf8");
    console.log(`Successfully wrote to ${outputPath}`);

  } catch (error) {
    console.error("Error extracting users:", error);
  } finally {
    process.exit(0);
  }
}

extractFreeUsers();
