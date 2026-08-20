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
  const snapshot = await db.collection("users").get();
  console.log(`Total users: ${snapshot.docs.length}`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`User: ${doc.id} | isPremium: ${data.isPremium} | expires: ${data.subscriptionExpiresAt}`);
  });
}
test();
