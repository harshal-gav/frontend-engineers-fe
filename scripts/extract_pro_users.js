const admin = require("firebase-admin");
const dotenv = require("dotenv");

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

async function extractProUsers() {
  try {
    const usersSnapshot = await db.collection("users").get();
    let proUserEmails = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const isPremium = data.isPremium === true;
      
      let hasExpired = false;
      if (data.subscriptionExpiresAt) {
          hasExpired = new Date(data.subscriptionExpiresAt) < new Date();
      }
      
      if (isPremium && !hasExpired) {
        if (data.email) {
            proUserEmails.push(data.email);
        }
      }
    });

    console.log(proUserEmails.join("\n"));
  } catch (error) {
    console.error("Error extracting users:", error);
  } finally {
    process.exit(0);
  }
}

extractProUsers();
