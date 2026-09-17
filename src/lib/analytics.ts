import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

type EventName = 
  | "signup_started" 
  | "signup_completed" 
  | "job_saved" 
  | "alert_created" 
  | "upgrade_modal_opened" 
  | "checkout_started" 
  | "subscription_completed"
  | "dashboard_viewed"
  | "search_used";

export function trackEvent(eventName: EventName, eventParams?: Record<string, any>) {
  if (typeof window !== "undefined" && analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (e) {
      console.error(`Failed to log analytics event: ${eventName}`, e);
    }
  }
}
