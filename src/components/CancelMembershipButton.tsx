"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function CancelMembershipButton() {
  const { user, loading, isSubscribed } = useAuth();
  const [isCancelling, setIsCancelling] = useState(false);

  if (loading || !user || !isSubscribed) {
    return null;
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your Pro Membership? You will retain access until the end of your billing cycle.")) return;
    
    setIsCancelling(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Your subscription has been cancelled successfully.");
        // Optional: refresh page or redirect to update state
        window.location.reload();
      } else {
        alert(data.error || "Failed to cancel subscription.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while cancelling your subscription.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="mt-12 p-6 border border-[#333] bg-[#111227] rounded-xl">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Subscription</h3>
      <p className="text-gray-500 text-sm mb-4">
        You are currently on the Pro Membership plan. You can cancel your subscription at any time. You will continue to have access to Pro features until the end of your billing cycle.
      </p>
      <button
        onClick={handleCancelSubscription}
        disabled={isCancelling}
        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50 font-semibold"
      >
        {isCancelling ? "Cancelling..." : "Cancel Membership"}
      </button>
    </div>
  );
}
