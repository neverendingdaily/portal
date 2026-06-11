import type { PersonaTraits, Episode } from "../types";

export function buildNanoBananaPrompt(persona: PersonaTraits, episodes: Episode[]): string {
  const episodeSummary = episodes
    .map((ep) => `ep${ep.number}: 「${ep.title}」— ${ep.synopsis.slice(0, 60)}`)
    .join("\n");

  return `You are a creative director generating text-to-video prompts for NaNoBanana AI video generator.
NaNoBanana uses a style-first format: specify visual style, subject, action, and environment clearly.

【Persona】
Type: ${persona.dominantType}
Description: ${persona.description}

【Episodes Summary】
${episodeSummary}

Return ONLY valid JSON in this exact structure (no other text):

{
  "globalStyle": {
    "style": "<primary visual style, e.g. 'live action cinematic k-drama'>",
    "colorPalette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"]
  },
  "scenes": [
    {
      "sceneId": "opening",
      "label": "オープニング",
      "episodeRef": null,
      "prompt": "<English prompt: style + subject + action + environment, 80-150 chars>",
      "durationHint": "5-10s",
      "style": "cinematic k-drama, live action, warm film grain",
      "aspectRatio": "16:9",
      "fps": 24
    },
    {
      "sceneId": "ep1",
      "label": "第1話",
      "episodeRef": 1,
      "prompt": "<English prompt>",
      "durationHint": "5-8s",
      "style": "<scene-specific style>",
      "aspectRatio": "16:9",
      "fps": 24
    },
    ... (ep2 through ep13) ...,
    {
      "sceneId": "ending",
      "label": "エンディング",
      "episodeRef": null,
      "prompt": "<English prompt for final scene>",
      "durationHint": "8-12s",
      "style": "cinematic, soft bokeh, golden hour",
      "aspectRatio": "16:9",
      "fps": 24
    }
  ]
}

Rules:
- All prompts MUST be in English
- NaNoBanana prompt format: [style], [subject], [action], [environment/lighting]
  Example: "cinematic k-drama, young woman in hanbok, standing alone in rain, soft neon bokeh"
- Reflect ${persona.dominantType} psychology in each scene's emotional atmosphere
- Generate exactly 15 scenes: opening + ep1-ep13 + ending
- fps should be 24 for all scenes (cinematic feel)`;
}
