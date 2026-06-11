import { Client } from "@notionhq/client";
import type { Session } from "./types";

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function saveSessionToNotion(session: Session): Promise<string> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const date = new Date(session.createdAt).toISOString().split("T")[0];

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      title: {
        title: [
          {
            text: {
              content: `ペルソナ分析 - ${session.productName} - ${date}`,
            },
          },
        ],
      },
    },
    children: [
      ...(session.persona
        ? [
            {
              object: "block" as const,
              type: "heading_2" as const,
              heading_2: {
                rich_text: [{ text: { content: "ペルソナプロファイル" } }],
              },
            },
            {
              object: "block" as const,
              type: "callout" as const,
              callout: {
                rich_text: [
                  {
                    text: {
                      content: `【${session.persona.dominantType}】\n${session.persona.description}\n\n虚栄心: ${session.persona.vanity}/10 | 嫉妬: ${session.persona.jealousy}/10 | 承認欲求: ${session.persona.approval}/10\n孤独感: ${session.persona.loneliness}/10 | 野心: ${session.persona.ambition}/10 | 不安: ${session.persona.anxiety}/10 | 愛情渇望: ${session.persona.loveSeeking}/10`,
                    },
                  },
                ],
                icon: { emoji: "🎭" },
                color: "purple_background" as const,
              },
            },
          ]
        : []),
      ...(session.episodes && session.episodes.length > 0
        ? [
            {
              object: "block" as const,
              type: "heading_2" as const,
              heading_2: {
                rich_text: [{ text: { content: "13話ストーリー" } }],
              },
            },
            ...session.episodes.map((ep) => ({
              object: "block" as const,
              type: "toggle" as const,
              toggle: {
                rich_text: [
                  {
                    text: {
                      content: `第${ep.number}話「${ep.title}」`,
                    },
                  },
                ],
                children: [
                  {
                    object: "block" as const,
                    type: "paragraph" as const,
                    paragraph: {
                      rich_text: [{ text: { content: ep.synopsis } }],
                    },
                  },
                ],
              },
            })),
          ]
        : []),
      ...(session.copy
        ? [
            {
              object: "block" as const,
              type: "heading_2" as const,
              heading_2: {
                rich_text: [{ text: { content: "セールスコピー" } }],
              },
            },
            {
              object: "block" as const,
              type: "quote" as const,
              quote: {
                rich_text: [
                  {
                    text: {
                      content: `${session.copy.headline}\n${session.copy.subheadline}`,
                    },
                  },
                ],
              },
            },
            {
              object: "block" as const,
              type: "paragraph" as const,
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: `CTA: ${session.copy.cta}`,
                    },
                  },
                ],
              },
            },
          ]
        : []),
      ...(session.creative
        ? [
            {
              object: "block" as const,
              type: "heading_2" as const,
              heading_2: {
                rich_text: [{ text: { content: "クリエイティブ設計書" } }],
              },
            },
            {
              object: "block" as const,
              type: "heading_3" as const,
              heading_3: {
                rich_text: [{ text: { content: "Veo（映像生成）" } }],
              },
            },
            {
              object: "block" as const,
              type: "paragraph" as const,
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: session.creative.veo.openingScenePrompt,
                    },
                  },
                ],
              },
            },
            {
              object: "block" as const,
              type: "heading_3" as const,
              heading_3: {
                rich_text: [{ text: { content: "Filmora（編集）" } }],
              },
            },
            {
              object: "block" as const,
              type: "paragraph" as const,
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: `${session.creative.filmora.timelineStructure}\nトランジション: ${session.creative.filmora.transitionStyle}\nBGMムード: ${session.creative.filmora.bgmMood}`,
                    },
                  },
                ],
              },
            },
            {
              object: "block" as const,
              type: "heading_3" as const,
              heading_3: {
                rich_text: [{ text: { content: "Canva（デザイン）" } }],
              },
            },
            {
              object: "block" as const,
              type: "paragraph" as const,
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: `${session.creative.canva.thumbnailBrief}\nカラー: ${session.creative.canva.colorPalette.join(", ")}\nフォント: ${session.creative.canva.fontPairing}`,
                    },
                  },
                ],
              },
            },
          ]
        : []),
    ],
  });

  return response.id;
}
