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

async function addProUser() {
  const email = "harshal.gav@gmail.com";
  
  // Set expiration date to 10 years from now for a "lifetime" pro access (or 1 year)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 10);

  const userData = {
    email: email,
    isPremium: true,
    subscriptionExpiresAt: expirationDate.toISOString(),
    createdAt: new Date().toISOString(),
    job_alerts: {
      query: "",
      location: "worldwide"
    },
    isSubscribed: true
  };

  try {
    // Just create a dummy user ID since they might not have auth yet, 
    // or let Firestore auto-generate an ID.
    // However, if they login later with Google Auth, it might create a new document with their Auth UID.
    // It's safer to just auto-generate an ID for now, so they get the emails.
    const res = await db.collection("users").add(userData);
    console.log(`Added user ${email} with ID: ${res.id}`);
  } catch (error) {
    console.error("Error adding user:", error);
  } finally {
    process.exit(0);
  }
}
addProUser();
