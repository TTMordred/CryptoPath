
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import ParticlesBackground from "@/components/ParticlesBackground";

// Dynamically import the client component with suspense enabled.
const TransactionContent = dynamic(
  () => import("./TransactionContent"),
  { suspense: true } as any
);

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search page...</div>}>
      <ParticlesBackground/>
      <TransactionContent />
    </Suspense>
  );
}
