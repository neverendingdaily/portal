"use client";

import { useState } from "react";
import type { CreativeOutput } from "@/lib/types";

type Tab = "veo" | "filmora" | "canva";

function Field({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          {copied ? "コピー済" : "コピー"}
        </button>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

export default function CreativePanel({ creative }: { creative: CreativeOutput }) {
  const [tab, setTab] = useState<Tab>("veo");

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        {(["veo", "filmora", "canva"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-b-2 border-purple-600 text-purple-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "veo" ? "Veo（映像）" : t === "filmora" ? "Filmora（編集）" : "Canva（デザイン）"}
          </button>
        ))}
      </div>

      {tab === "veo" && (
        <div className="space-y-3">
          <Field label="オープニング映像プロンプト（英語）" value={creative.veo.openingScenePrompt} />
          <Field label="ムードボード" value={creative.veo.moodBoard} />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">各話ハイライトプロンプト</p>
            <div className="space-y-2">
              {creative.veo.episodeHighlightPrompts.map((p, i) => (
                <Field key={i} label={`第${i + 1}話`} value={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "filmora" && (
        <div className="space-y-3">
          <Field label="タイムライン構成" value={creative.filmora.timelineStructure} />
          <Field label="トランジションスタイル" value={creative.filmora.transitionStyle} />
          <Field label="カラーグレーディング" value={creative.filmora.colorGrading} />
          <Field label="BGMムード" value={creative.filmora.bgmMood} />
          <Field label="テキストオーバーレイ指針" value={creative.filmora.textOverlayGuide} />
        </div>
      )}

      {tab === "canva" && (
        <div className="space-y-3">
          <Field label="サムネイルブリーフ" value={creative.canva.thumbnailBrief} />
          <Field label="フォントペアリング" value={creative.canva.fontPairing} />
          <Field label="カバーデザインコンセプト" value={creative.canva.coverDesignConcept} />

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">カラーパレット</p>
            <div className="flex gap-2">
              {creative.canva.colorPalette.map((color, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-200 mb-1"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-gray-600">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">SNS投稿テンプレート</p>
            <div className="space-y-2">
              {creative.canva.snsPostTemplates.map((t, i) => (
                <Field
                  key={i}
                  label={i === 0 ? "Instagram" : i === 1 ? "X（Twitter）" : "Stories"}
                  value={t}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
