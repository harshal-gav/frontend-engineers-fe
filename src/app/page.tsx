import { Suspense } from "react";
import JobsClientPage from "@/components/JobsClientPage";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <JobsClientPage />
    </Suspense>
  );
}
