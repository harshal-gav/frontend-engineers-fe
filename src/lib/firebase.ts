import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, Auth } from "firebase/auth";
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
let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    // Use localStorage instead of IndexedDB to avoid "Database is closing/hidden" errors
    auth = initializeAuth(app, { 
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver
    });
    (window as any)._customFirebaseAuth = auth;
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  if (typeof window !== "undefined" && (window as any)._customFirebaseAuth) {
    auth = (window as any)._customFirebaseAuth;
  } else {
    // Fallback if somehow not on window
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { app, auth, db };
