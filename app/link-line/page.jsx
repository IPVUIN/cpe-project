"use client";

import { Suspense } from "react";
import LinkLineContent from "./link-line";

export default function LinkLinePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LinkLineContent />
    </Suspense>
  );
}