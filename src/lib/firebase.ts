import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDTdjUqhTbtQ-5tzQQE-cuxkHKBTcrJzvU",
  authDomain: "frontend-engineers-com.firebaseapp.com",
  projectId: "frontend-engineers-com",
  storageBucket: "frontend-engineers-com.firebasestorage.app",
  messagingSenderId: "136510578019",
  appId: "1:136510578019:web:fa452d0d959f286ed40756",
  measurementId: "G-6WRQG12BZH"
};

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

const db = getFirestore(app);

// Initialize Firebase Analytics (client-side only)
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, analytics };
