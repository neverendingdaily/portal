import { Suspense } from "react";
import StoryContent from "./StoryContent";

export function generateStaticParams() {
  return [{ sessionId: "placeholder" }];
}

export default function StoryPage() {
  return (
    <Suspense fallback={null}>
      <StoryContent />
    </Suspense>
  );
}
