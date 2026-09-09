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

async function listProUsers() {
  try {
    const db = getAdminDb();
    const usersSnapshot = await db.collection("users").where("isPremium", "==", true).get();
    
    console.log(`\n======================================`);
    console.log(`Total Pro Users: ${usersSnapshot.size}`);
    console.log(`======================================`);
    
    let i = 1;
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${i}. ${data.email || 'No email'} (ID: ${doc.id})`);
      i++;
    });
    console.log(`======================================\n`);
  } catch (err) {
    console.error("Error fetching pro users:", err);
  }
}

listProUsers();
