"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PersonaRadarChart from "@/components/PersonaRadarChart";
import type { Session } from "@/lib/types";

export default function ResultContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`session_${sessionId}`);
    if (!raw) {
      router.push("/");
      return;
    }
    setSession(JSON.parse(raw));
  }, [sessionId, router]);

  if (!session || !session.persona) return null;

  const { persona } = session;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← 新しい分析
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="mb-6">
            <div className="inline-block bg-purple-100 text-purple-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              {persona.dominantType}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{session.productName}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{persona.description}</p>
          </div>

          <PersonaRadarChart persona={persona} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Link
            href={`/result/${sessionId}/story`}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-bold text-gray-800">13話ストーリー</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {session.episodes ? `生成済み（${session.episodes.length}話）` : "未生成"}
              </p>
            </div>
            <span className="text-purple-400 text-xl">→</span>
          </Link>

          <Link
            href={`/result/${sessionId}/copy`}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-bold text-gray-800">セールスコピー</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {session.copy ? "生成済み" : "未生成"}
              </p>
            </div>
            <span className="text-purple-400 text-xl">→</span>
          </Link>

          <Link
            href={`/result/${sessionId}/creative`}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-bold text-gray-800">クリエイティブ設計書</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {session.creative ? "生成済み（Veo / Filmora / Canva）" : "未生成"}
              </p>
            </div>
            <span className="text-purple-400 text-xl">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
