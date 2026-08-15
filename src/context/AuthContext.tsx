"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // The Firebase Stripe Extension manages a 'subscriptions' subcollection.
        // We listen for any subscription that is 'active' or 'trialing'.
        const subscriptionsRef = collection(db, "users", firebaseUser.uid, "subscriptions");
        const q = query(
          subscriptionsRef,
          where("status", "in", ["trialing", "active"])
        );

        const unsubscribeSub = onSnapshot(q, (snapshot) => {
          setIsSubscribed(!snapshot.empty);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching subscriptions:", error);
          setLoading(false);
        });

        return () => unsubscribeSub();
      } else {
        setIsSubscribed(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isSubscribed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
