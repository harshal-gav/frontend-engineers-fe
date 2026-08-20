require('dotenv').config();
const admin = require("firebase-admin");

async function test() {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  const db = admin.firestore();
  
  await db.collection("users").doc("T3K0Fm4UMRWmxsy1c2RFMjaTERA3").set({
    isPremium: true,
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, { merge: true });
  console.log("Upgraded user!");
}
test();
