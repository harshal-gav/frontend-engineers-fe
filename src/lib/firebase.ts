import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
