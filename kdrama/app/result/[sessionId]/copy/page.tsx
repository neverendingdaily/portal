import { Suspense } from "react";
import CopyContent from "./CopyContent";

export function generateStaticParams() {
  return [{ sessionId: "placeholder" }];
}

export default function CopyPage() {
  return (
    <Suspense fallback={null}>
      <CopyContent />
    </Suspense>
  );
}
