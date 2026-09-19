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
  const usersSnapshot = await db.collection("users").where("email", "==", "harshal.gav@gmail.com").get();
  if (usersSnapshot.empty) {
    console.log("No user found with email harshal.gav@gmail.com");
  } else {
    usersSnapshot.forEach(doc => {
      console.log("USER:", doc.id, doc.data());
    });
  }
  process.exit(0);
}
checkUser();
