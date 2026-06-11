import { Suspense } from "react";
import ResultContent from "./ResultContent";

export function generateStaticParams() {
  return [{ sessionId: "placeholder" }];
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
