require('dotenv').config();
const admin = require("firebase-admin");

async function test() {
  console.log("Init...");
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Init success");
    const db = admin.firestore();
    console.log("Fetching users...");
    const snapshot = await db.collection("users").limit(1).get();
    console.log("Fetch success, docs:", snapshot.docs.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
