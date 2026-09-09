import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

function getAdminDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.firestore();
}

async function checkUser() {
  try {
    const db = getAdminDb();
    const usersSnapshot = await db.collection("users").where("email", "==", "harshal.gav@gmail.com").get();
    
    if (usersSnapshot.empty) {
      console.log("User harshal.gav@gmail.com not found!");
      return;
    }
    
    usersSnapshot.forEach(doc => {
      console.log(`User ID: ${doc.id}`);
      console.log(doc.data());
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
