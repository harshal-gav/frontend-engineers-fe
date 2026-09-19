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

async function checkUser() {
  const usersSnapshot = await db.collection("users").get();
  let found = false;
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && data.email.toLowerCase().includes("harshal")) {
      console.log("USER:", doc.id, data);
      found = true;
    }
  });
  if (!found) console.log("No users found containing 'harshal' in email.");
  process.exit(0);
}
checkUser();
