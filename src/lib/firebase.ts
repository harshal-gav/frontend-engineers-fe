import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    // Use localStorage instead of IndexedDB to avoid "Database is closing/hidden" errors
    auth = initializeAuth(app, { persistence: browserLocalPersistence });
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
