"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CopyPanel from "@/components/CopyPanel";
import type { Session } from "@/lib/types";
import { generateCopy } from "@/lib/clientApi";

export default function CopyContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(`session_${sessionId}`);
    if (!raw) {
      router.push("/");
      return;
    }
    setSession(JSON.parse(raw));
  }, [sessionId, router]);

  async function generate() {
    if (!session?.persona) return;
    setLoading(true);
    setError("");
    try {
      const copy = await generateCopy(session.persona, session.productName);
      const updated: Session = { ...session, copy };
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated));
      setSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href={`/result/${sessionId}`}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
        >
          ← ダッシュボードに戻る
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">セールスコピー</h2>
          <p className="text-sm text-gray-500 mb-6">
            {session.productName} × {session.persona?.dominantType} 向けコピー
          </p>

          {!session.copy ? (
            <div className="text-center py-8">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                onClick={generate}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "生成中..." : "コピーを生成する"}
              </button>
            </div>
          ) : (
            <div>
              <CopyPanel copy={session.copy} />
              <button
                onClick={generate}
                disabled={loading}
                className="w-full mt-6 py-3 border border-purple-200 text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {loading ? "再生成中..." : "再生成する"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
