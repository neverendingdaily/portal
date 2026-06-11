"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import type { Session } from "@/lib/types";
import { analyzePersona } from "@/lib/clientApi";
import ApiKeyInput from "./ApiKeyInput";

export default function InputForm() {
  const router = useRouter();
  const [snsPostsText, setSnsPostsText] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const persona = await analyzePersona(snsPostsText);

      const sessionId = uuidv4();
      const session: Session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        snsPostsText,
        productName,
        persona,
      };

      localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
      router.push(`/result/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ApiKeyInput />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SNS投稿テキスト
          <span className="text-gray-400 font-normal ml-2">（分析対象の投稿を貼り付けてください）</span>
        </label>
        <textarea
          value={snsPostsText}
          onChange={(e) => setSnsPostsText(e.target.value)}
          placeholder="例：&#10;最近また新しいブランドバッグ買っちゃった✨ 周りの反応が楽しみすぎる&#10;あの子、また海外旅行してる…いいなぁ私も行きたい&#10;フォロワー1000人突破！みんなありがとう、もっと増やしたい"
          className="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          商品・サービス名
          <span className="text-gray-400 font-normal ml-2">（セールスコピーの対象）</span>
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="例：オンラインビジネス講座、美容サプリ、コーチングプログラム"
          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          required
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {loading ? "分析中..." : "ペルソナを分析する"}
      </button>
    </form>
  );
}
