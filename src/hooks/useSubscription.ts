"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export interface SubscriptionState {
  /** Whether the user has an active premium subscription */
  isPremium: boolean;
  /** ISO 8601 date string when the subscription expires (null if no active sub) */
  expiresAt: string | null;
  /** LemonSqueezy customer ID for managing the subscription */
  lemonSqueezyCustomerId: string | null;
  /** Whether the subscription data is still loading */
  loading: boolean;
  /** The authenticated Firebase user (null if logged out) */
  user: User | null;
}

/**
 * useSubscription — reads the user's Firebase doc in real time
 * and returns the premium subscription state.
 *
 * This hook listens to the top-level `users/{uid}` doc for the
 * `isPremium` and `subscriptionExpiresAt` fields written by the
 * LemonSqueezy webhook handler.
 *
 * Usage:
 * ```tsx
 * const { isPremium, expiresAt, loading } = useSubscription();
 * if (loading) return <Spinner />;
 * if (!isPremium) return <Paywall />;
 * return <PremiumContent />;
 * ```
 */
export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    expiresAt: null,
    lemonSqueezyCustomerId: null,
    loading: true,
    user: null,
  });

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listener when user changes
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);

        unsubscribeDoc = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const isPremiumFlag = data.isPremium === true;
              const expiresAt = data.subscriptionExpiresAt || null;

              // Client-side expiry check (belt-and-suspenders)
              let isPremium = isPremiumFlag;
              if (isPremiumFlag && expiresAt) {
                isPremium = new Date(expiresAt) > new Date();
              }

              setState({
                isPremium,
                expiresAt,
                lemonSqueezyCustomerId:
                  data.lemonSqueezyCustomerId || null,
                loading: false,
                user: firebaseUser,
              });
            } else {
              // User doc doesn't exist yet (new user, hasn't subscribed)
              setState({
                isPremium: false,
                expiresAt: null,
                lemonSqueezyCustomerId: null,
                loading: false,
                user: firebaseUser,
              });
            }
          },
          (error) => {
            console.error("[useSubscription] Firestore error:", error);
            setState((prev) => ({
              ...prev,
              isPremium: false,
              loading: false,
              user: firebaseUser,
            }));
          }
        );
      } else {
        // Not logged in
        setState({
          isPremium: false,
          expiresAt: null,
          lemonSqueezyCustomerId: null,
          loading: false,
          user: null,
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return state;
}
