"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AssetsPanel from "@/components/AssetsPanel";
import type { Session, CreativeAssets } from "@/lib/types";
import { generateVeo, generateFilmora, generateCanva, generateNanoBanana } from "@/lib/clientApi";

type Tab = "veo" | "nanobanana" | "filmora" | "canva";
type GeneratingState = { [K in Tab]?: boolean };

export default function CreativeContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [generating, setGenerating] = useState<GeneratingState>({});
  const [errors, setErrors] = useState<Partial<Record<Tab, string>>>({});

  useEffect(() => {
    const raw = localStorage.getItem(`session_${sessionId}`);
    if (!raw) {
      router.push("/");
      return;
    }
    setSession(JSON.parse(raw));
  }, [sessionId, router]);

  async function handleGenerate(tool: Tab) {
    if (!session?.persona || !session?.episodes) {
      setErrors((prev) => ({ ...prev, [tool]: "先にストーリーを生成してください" }));
      return;
    }
    setGenerating((prev) => ({ ...prev, [tool]: true }));
    setErrors((prev) => ({ ...prev, [tool]: undefined }));

    try {
      let asset;
      if (tool === "veo") {
        asset = await generateVeo(session.persona, session.episodes, sessionId);
      } else if (tool === "filmora") {
        asset = await generateFilmora(session.persona, session.episodes, sessionId);
      } else if (tool === "canva") {
        asset = await generateCanva(session.persona, session.episodes, session.copy, sessionId);
      } else {
        asset = await generateNanoBanana(session.persona, session.episodes, sessionId);
      }

      const updatedAssets: CreativeAssets = {
        ...(session.assets ?? {}),
        [tool]: asset,
      };
      const updated: Session = { ...session, assets: updatedAssets };
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated));
      setSession(updated);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [tool]: err instanceof Error ? err.message : "エラーが発生しました",
      }));
    } finally {
      setGenerating((prev) => ({ ...prev, [tool]: false }));
    }
  }

  if (!session) return null;

  const noEpisodes = !session.episodes;

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
          <h2 className="text-xl font-bold text-gray-800 mb-1">クリエイティブ設計書</h2>
          <p className="text-sm text-gray-500 mb-1">
            Veo / NaNoBanana / Filmora / Canva — 各ツール用プロンプト・絵コンテ・サムネイル設計を生成
          </p>
          <p className="text-xs text-gray-400 mb-6">生成後はJSONとMarkdownでダウンロードできます</p>

          {noEpisodes && (
            <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg mb-6">
              設計書生成にはストーリーが必要です。先に「13話ストーリー」を生成してください。
            </div>
          )}

          {Object.values(errors).some(Boolean) && (
            <div className="mb-4 space-y-1">
              {(Object.entries(errors) as [Tab, string | undefined][])
                .filter(([, v]) => v)
                .map(([tool, msg]) => (
                  <p key={tool} className="text-red-500 text-xs">
                    {tool}: {msg}
                  </p>
                ))}
            </div>
          )}

          <AssetsPanel
            assets={session.assets ?? {}}
            onGenerate={handleGenerate}
            generating={generating}
          />
        </div>
      </div>
    </main>
  );
}
