import { Suspense } from "react";
import CreativeContent from "./CreativeContent";

export function generateStaticParams() {
  return [{ sessionId: "placeholder" }];
}

export default function CreativePage() {
  return (
    <Suspense fallback={null}>
      <CreativeContent />
    </Suspense>
  );
}
