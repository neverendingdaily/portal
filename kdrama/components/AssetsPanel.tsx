"use client";

import { useState } from "react";
import type { CreativeAssets, VeoOutput, NaNoBananaOutput, FilmoraOutput, CanvaOutput } from "@/lib/types";
import {
  downloadJson,
  downloadMarkdown,
  buildVeoMarkdown,
  buildNanoBananaMarkdown,
  buildFilmoraMarkdown,
  buildCanvaMarkdown,
} from "@/lib/assetExport";

type Tab = "veo" | "nanobanana" | "filmora" | "canva";

type GeneratingState = { [K in Tab]?: boolean };

type Props = {
  assets: CreativeAssets;
  onGenerate: (tool: Tab) => Promise<void>;
  generating: GeneratingState;
};

function DownloadBar({
  onJson,
  onMd,
}: {
  onJson: () => void;
  onMd: () => void;
}) {
  return (
    <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
      <button
        onClick={onJson}
        className="flex-1 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        JSON ダウンロード
      </button>
      <button
        onClick={onMd}
        className="flex-1 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Markdown ダウンロード
      </button>
    </div>
  );
}

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
          className="text-xs text-purple-600 hover:text-purple-800 font-medium shrink-0 ml-2"
        >
          {copied ? "コピー済" : "コピー"}
        </button>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

function VeoTab({ veo, onGenerate, generating }: { veo?: VeoOutput; onGenerate: () => void; generating: boolean }) {
  if (!veo) {
    return (
      <div className="text-center py-8">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "生成中..." : "Veo プロンプトを生成"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 text-right">{veo.scenes.length}シーン生成済</div>
      <Field label="映像スタイル" value={veo.globalStyle.cinematicStyle} />
      <Field label="カラーグレーディング" value={veo.globalStyle.colorGrading} />
      <Field label="参考作品" value={veo.globalStyle.referenceFilms.join(", ")} />
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">シーンプロンプト一覧</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {veo.scenes.map((scene) => (
            <div key={scene.sceneId} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">
                  {scene.label}
                </span>
                <span className="text-xs text-gray-400">{scene.durationHint} / {scene.aspectRatio} / {scene.cameraMotion}</span>
              </div>
              <p className="text-gray-800 italic">&quot;{scene.prompt}&quot;</p>
              <p className="text-xs text-gray-400 mt-1">Keywords: {scene.moodKeywords.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
      <DownloadBar
        onJson={() => downloadJson(veo, `veo_prompts_${veo.sessionId}.json`)}
        onMd={() => downloadMarkdown(buildVeoMarkdown(veo), `veo_prompts_${veo.sessionId}.md`)}
      />
    </div>
  );
}

function NanoBananaTab({ nb, onGenerate, generating }: { nb?: NaNoBananaOutput; onGenerate: () => void; generating: boolean }) {
  if (!nb) {
    return (
      <div className="text-center py-8">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "生成中..." : "NaNoBanana プロンプトを生成"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 text-right">{nb.scenes.length}シーン生成済</div>
      <Field label="グローバルスタイル" value={nb.globalStyle.style} />
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">カラーパレット</p>
        <div className="flex gap-2">
          {nb.globalStyle.colorPalette.map((color, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-lg border border-gray-200 mb-1" style={{ backgroundColor: color }} />
              <p className="text-xs text-gray-600">{color}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">シーンプロンプト</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {nb.scenes.map((scene) => (
            <div key={scene.sceneId} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded">
                  {scene.label}
                </span>
                <span className="text-xs text-gray-400">{scene.durationHint} / {scene.fps}fps</span>
              </div>
              <p className="text-gray-800 italic">&quot;{scene.prompt}&quot;</p>
              <p className="text-xs text-gray-400 mt-1">Style: {scene.style}</p>
            </div>
          ))}
        </div>
      </div>
      <DownloadBar
        onJson={() => downloadJson(nb, `nanobanana_prompts_${nb.sessionId}.json`)}
        onMd={() => downloadMarkdown(buildNanoBananaMarkdown(nb), `nanobanana_prompts_${nb.sessionId}.md`)}
      />
    </div>
  );
}

function FilmoraTab({ filmora, onGenerate, generating }: { filmora?: FilmoraOutput; onGenerate: () => void; generating: boolean }) {
  if (!filmora) {
    return (
      <div className="text-center py-8">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "生成中..." : "Filmora 絵コンテを生成"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-purple-800">
          {filmora.projectSettings.resolution} / {filmora.projectSettings.fps}fps / 総尺 {filmora.projectSettings.totalDurationSec}秒
        </p>
        <p className="text-purple-600 text-xs mt-1">BGM {filmora.bgmTracks.length}本 / カット {filmora.cuts.length}カット</p>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">BGMトラック</p>
        <div className="space-y-2">
          {filmora.bgmTracks.map((track) => (
            <div key={track.trackId} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">
                  {track.trackId}
                </span>
                <span className="font-medium text-gray-700">{track.label}</span>
              </div>
              <p className="text-xs text-gray-500">
                {track.genre} / {track.mood} / {track.bpm}BPM / {track.startTimeSec}s→{track.endTimeSec}s
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">カット割り（{filmora.cuts.length}カット）</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filmora.cuts.map((cut) => (
            <div key={cut.cutId} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">
                  {cut.cutId}
                </span>
                <span className="text-xs text-gray-500">
                  第{cut.episodeRef}話 / {cut.startTimeSec}s→{cut.endTimeSec}s / {cut.transition}
                </span>
              </div>
              <p className="text-gray-700">{cut.sceneDescription}</p>
              {cut.textOverlay && (
                <p className="text-xs text-purple-600 mt-1">テキスト: 「{cut.textOverlay.text}」</p>
              )}
              <p className="text-xs text-gray-400 mt-1">BGM: {cut.bgmTrackRef} / {cut.videoSourceHint}</p>
            </div>
          ))}
        </div>
      </div>

      <DownloadBar
        onJson={() => downloadJson(filmora, `filmora_storyboard_${filmora.sessionId}.json`)}
        onMd={() => downloadMarkdown(buildFilmoraMarkdown(filmora), `filmora_storyboard_${filmora.sessionId}.md`)}
      />
    </div>
  );
}

function CanvaTab({ canva, onGenerate, generating }: { canva?: CanvaOutput; onGenerate: () => void; generating: boolean }) {
  if (!canva) {
    return (
      <div className="text-center py-8">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "生成中..." : "Canva サムネイルを生成"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">ブランドキット</p>
        <p className="text-sm text-gray-700 mb-2">
          {canva.brandKit.fontPrimary} / {canva.brandKit.fontSecondary}
        </p>
        <div className="flex gap-2">
          {canva.brandKit.colorPalette.map((color, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-lg border border-gray-200 mb-1" style={{ backgroundColor: color }} />
              <p className="text-xs text-gray-600">{color}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">サムネイル構成（{canva.thumbnails.length}種）</p>
        <div className="space-y-3">
          {canva.thumbnails.map((thumb) => (
            <div key={thumb.thumbnailId} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded">
                  {thumb.usage}
                </span>
                <span className="text-sm font-medium text-gray-700">{thumb.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{thumb.format}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                背景: {thumb.layout.backgroundType} ({thumb.layout.backgroundColors.join(", ")}) /
                画像: {thumb.layout.mainImagePlacement} / テキスト: {thumb.layout.textAlignment}
              </p>
              <div className="space-y-1">
                {thumb.layers.map((layer) => (
                  <div key={layer.layerId} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{layer.type}</span>
                    <span>{layer.content ?? layer.layerId}</span>
                    {layer.style?.fontSize && <span className="text-gray-400">{layer.style.fontSize}px</span>}
                    {layer.style?.color && (
                      <span
                        className="inline-block w-3 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: layer.style.color }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DownloadBar
        onJson={() => downloadJson(canva, `canva_thumbnails_${canva.sessionId}.json`)}
        onMd={() => downloadMarkdown(buildCanvaMarkdown(canva), `canva_thumbnails_${canva.sessionId}.md`)}
      />
    </div>
  );
}

const TAB_LABELS: Record<Tab, string> = {
  veo: "Veo",
  nanobanana: "NaNoBanana",
  filmora: "Filmora",
  canva: "Canva",
};

export default function AssetsPanel({ assets, onGenerate, generating }: Props) {
  const [tab, setTab] = useState<Tab>("veo");

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-b-2 border-purple-600 text-purple-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[t]}
            {assets[t] && (
              <span className="ml-1.5 w-2 h-2 bg-green-400 rounded-full inline-block" />
            )}
          </button>
        ))}
      </div>

      {tab === "veo" && (
        <VeoTab veo={assets.veo} onGenerate={() => onGenerate("veo")} generating={!!generating.veo} />
      )}
      {tab === "nanobanana" && (
        <NanoBananaTab nb={assets.nanobanana} onGenerate={() => onGenerate("nanobanana")} generating={!!generating.nanobanana} />
      )}
      {tab === "filmora" && (
        <FilmoraTab filmora={assets.filmora} onGenerate={() => onGenerate("filmora")} generating={!!generating.filmora} />
      )}
      {tab === "canva" && (
        <CanvaTab canva={assets.canva} onGenerate={() => onGenerate("canva")} generating={!!generating.canva} />
      )}
    </div>
  );
}
