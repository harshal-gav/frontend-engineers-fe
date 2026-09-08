import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

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

async function countUsers() {
  try {
    const db = getAdminDb();
    const usersSnapshot = await db.collection("users").get();
    let freeUsers = 0;
    let proUsers = 0;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPremium) {
        proUsers++;
      } else {
        freeUsers++;
      }
    });

    console.log(`\n======================================`);
    console.log(`Total Users: ${usersSnapshot.size}`);
    console.log(`Free Users (Recipients): ${freeUsers}`);
    console.log(`Pro Users: ${proUsers}`);
    console.log(`======================================\n`);
  } catch (err) {
    console.error("Error counting users:", err);
  }
}

countUsers();
