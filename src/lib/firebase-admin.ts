import * as admin from "firebase-admin";

export function getAdminDb() {
  if (!admin.apps.length) {
    try {
      // During Next.js build, env vars might be missing.
      // We only want to initialize if we actually have the required credentials.
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });
      } else {
        // Initialize a dummy app for build time
        admin.initializeApp({ projectId: "demo-project" });
      }
    } catch (error) {
      console.error("Firebase admin initialization error", error);
    }
  }
  return admin.firestore();
}
