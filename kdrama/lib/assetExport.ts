import type { VeoOutput, NaNoBananaOutput, FilmoraOutput, CanvaOutput } from "./types";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(data: object, filename: string) {
  triggerDownload(JSON.stringify(data, null, 2), filename, "application/json");
}

export function downloadMarkdown(md: string, filename: string) {
  triggerDownload(md, filename, "text/markdown");
}

export function buildVeoMarkdown(output: VeoOutput): string {
  const date = output.generatedAt.split("T")[0];
  const lines: string[] = [
    `# Veo 映像プロンプト集`,
    `**ペルソナ:** ${output.persona.dominantType} | **生成日:** ${date}`,
    ``,
    `## グローバルスタイル`,
    `- **映像スタイル:** ${output.globalStyle.cinematicStyle}`,
    `- **カラーグレーディング:** ${output.globalStyle.colorGrading}`,
    `- **参考作品:** ${output.globalStyle.referenceFilms.join(", ")}`,
    ``,
    `---`,
    ``,
  ];

  for (const scene of output.scenes) {
    lines.push(`## ${scene.label}`);
    lines.push(
      `**ID:** \`${scene.sceneId}\` | **尺:** ${scene.durationHint} | **アスペクト:** ${scene.aspectRatio} | **カメラ:** ${scene.cameraMotion}`
    );
    lines.push(`>`);
    lines.push(`> ${scene.prompt}`);
    lines.push(`>`);
    lines.push(`**ムードキーワード:** ${scene.moodKeywords.join(", ")}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function buildNanoBananaMarkdown(output: NaNoBananaOutput): string {
  const date = output.generatedAt.split("T")[0];
  const lines: string[] = [
    `# NaNoBanana 映像プロンプト集`,
    `**ペルソナ:** ${output.persona.dominantType} | **生成日:** ${date}`,
    ``,
    `## グローバルスタイル`,
    `- **スタイル:** ${output.globalStyle.style}`,
    `- **カラーパレット:** ${output.globalStyle.colorPalette.join(", ")}`,
    ``,
    `---`,
    ``,
  ];

  for (const scene of output.scenes) {
    lines.push(`## ${scene.label}`);
    lines.push(
      `**ID:** \`${scene.sceneId}\` | **尺:** ${scene.durationHint} | **FPS:** ${scene.fps} | **アスペクト:** ${scene.aspectRatio}`
    );
    lines.push(`**スタイル:** ${scene.style}`);
    lines.push(`>`);
    lines.push(`> ${scene.prompt}`);
    lines.push(`>`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function buildFilmoraMarkdown(output: FilmoraOutput): string {
  const date = output.generatedAt.split("T")[0];
  const { projectSettings, bgmTracks, cuts } = output;

  const lines: string[] = [
    `# Filmora 絵コンテ`,
    `**生成日:** ${date}`,
    ``,
    `## プロジェクト設定`,
    `**解像度:** ${projectSettings.resolution} / **FPS:** ${projectSettings.fps} / **総尺:** ${projectSettings.totalDurationSec}秒`,
    ``,
    `---`,
    ``,
    `## BGMトラック`,
    `| トラックID | ラベル | ジャンル | ムード | BPM | 開始 | 終了 | FadeIn | FadeOut |`,
    `|---|---|---|---|---|---|---|---|---|`,
  ];

  for (const track of bgmTracks) {
    lines.push(
      `| ${track.trackId} | ${track.label} | ${track.genre} | ${track.mood} | ${track.bpm} | ${track.startTimeSec}s | ${track.endTimeSec}s | ${track.fadeInSec}s | ${track.fadeOutSec}s |`
    );
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## カット割り`);
  lines.push(``);

  for (const cut of cuts) {
    const start = formatTime(cut.startTimeSec);
    const end = formatTime(cut.endTimeSec);
    lines.push(`### ${cut.cutId} — 第${cut.episodeRef}話`);
    lines.push(`- **時間:** ${start} → ${end}`);
    lines.push(`- **シーン:** ${cut.sceneDescription}`);
    lines.push(`- **トランジション:** ${cut.transition}`);
    lines.push(`- **BGM:** ${cut.bgmTrackRef}`);
    lines.push(`- **映像素材ヒント:** ${cut.videoSourceHint}`);
    if (cut.textOverlay) {
      const ov = cut.textOverlay;
      lines.push(
        `- **テキストオーバーレイ:** 「${ov.text}」（${ov.style} / ${ov.positionX}-${ov.positionY} / ${ov.durationSec}秒 / ${ov.fontColor}）`
      );
    }
    lines.push(``);
  }

  return lines.join("\n");
}

export function buildCanvaMarkdown(output: CanvaOutput): string {
  const date = output.generatedAt.split("T")[0];
  const { brandKit, thumbnails } = output;

  const lines: string[] = [
    `# Canva Pro サムネイル構成案`,
    `**生成日:** ${date}`,
    ``,
    `## ブランドキット`,
    `- **カラーパレット:** ${brandKit.colorPalette.join(", ")}`,
    `- **プライマリフォント:** ${brandKit.fontPrimary}`,
    `- **セカンダリフォント:** ${brandKit.fontSecondary}`,
    ``,
    `---`,
    ``,
  ];

  for (const thumb of thumbnails) {
    lines.push(`## ${thumb.label}`);
    lines.push(`**サイズ:** ${thumb.format} | **用途:** ${thumb.usage}`);
    lines.push(``);
    lines.push(`### レイアウト`);
    lines.push(`- **背景:** ${thumb.layout.backgroundType} (${thumb.layout.backgroundColors.join(", ")})`);
    lines.push(`- **画像配置:** ${thumb.layout.mainImagePlacement}`);
    lines.push(`- **テキスト揃え:** ${thumb.layout.textAlignment}`);
    lines.push(``);
    lines.push(`### レイヤー構成`);
    lines.push(`| レイヤーID | タイプ | 内容 | 位置 |`);
    lines.push(`|---|---|---|---|`);
    for (const layer of thumb.layers) {
      const content = layer.content ?? "-";
      const pos = `x:${layer.position.x} y:${layer.position.y}`;
      lines.push(`| ${layer.layerId} | ${layer.type} | ${content} | ${pos} |`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
