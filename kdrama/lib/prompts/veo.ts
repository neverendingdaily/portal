import type { PersonaTraits, Episode } from "../types";

export function buildVeoPrompt(persona: PersonaTraits, episodes: Episode[]): string {
  const episodeSummary = episodes
    .map((ep) => `ep${ep.number}: 「${ep.title}」— ${ep.synopsis.slice(0, 60)}`)
    .join("\n");

  return `You are a cinematic director creating text-to-video prompts for Google Veo.
Generate 15 scene prompts for a Korean drama series based on the following persona and story.

【Persona】
Type: ${persona.dominantType}
Description: ${persona.description}

【Episodes Summary】
${episodeSummary}

Return ONLY valid JSON in this exact structure (no other text):

{
  "globalStyle": {
    "cinematicStyle": "<Korean wave cinematic style description>",
    "colorGrading": "<color grading style, e.g. 'Teal & orange, warm golden hour'>",
    "referenceFilms": ["<K-drama title 1>", "<K-drama title 2>", "<K-drama title 3>"]
  },
  "scenes": [
    {
      "sceneId": "opening",
      "label": "オープニング",
      "episodeRef": null,
      "prompt": "<English text-to-video prompt, 100-200 chars, vivid and cinematic>",
      "durationHint": "5-10s",
      "aspectRatio": "16:9",
      "cameraMotion": "<e.g. slow pan right, static close-up, tracking shot>",
      "moodKeywords": ["<mood1>", "<mood2>", "<mood3>"]
    },
    {
      "sceneId": "ep1",
      "label": "第1話ハイライト",
      "episodeRef": 1,
      "prompt": "<English prompt>",
      "durationHint": "5-8s",
      "aspectRatio": "16:9",
      "cameraMotion": "<camera motion>",
      "moodKeywords": ["<mood1>", "<mood2>"]
    },
    ... (ep2 through ep13 following same pattern) ...,
    {
      "sceneId": "ending",
      "label": "エンディング",
      "episodeRef": null,
      "prompt": "<English prompt for ending credits scene>",
      "durationHint": "8-12s",
      "aspectRatio": "16:9",
      "cameraMotion": "slow zoom out",
      "moodKeywords": ["emotional", "bittersweet", "hopeful"]
    }
  ]
}

Rules:
- All prompts MUST be in English
- Each scene prompt should be vivid, specific, and 100-200 characters
- Reflect the persona's dominant trait (${persona.dominantType}) in emotional tone
- Scenes ep1-ep13 must have episodeRef set to the episode number (1-13)
- Generate exactly 15 scenes: opening + ep1-ep13 + ending`;
}
