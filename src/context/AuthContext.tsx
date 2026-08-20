"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSubscribed: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSubscribed: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous listener if it exists
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      
      if (firebaseUser) {
        // Listen to the top-level user doc for the isPremium flag.
        // This is a single-document read (fast, cheap) that matches
        // the dual-write pattern used by the PayPal webhook handler.
        const userDocRef = doc(db, "users", firebaseUser.uid);

        unsubscribeDoc = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const isPremium = data.isPremium === true;
            const expiresAt = data.subscriptionExpiresAt;

            // Check if the subscription has expired (belt-and-suspenders
            // with the webhook's own expiry handling)
            if (isPremium && expiresAt) {
              const expiryDate = new Date(expiresAt);
              setIsSubscribed(expiryDate > new Date());
            } else {
              setIsSubscribed(isPremium);
            }
          } else {
            setIsSubscribed(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user doc:", error);
          setIsSubscribed(false);
          setLoading(false);
        });
      } else {
        setIsSubscribed(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isSubscribed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
