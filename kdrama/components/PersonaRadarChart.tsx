"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PersonaTraits } from "@/lib/types";

const TRAIT_LABELS: Record<keyof Omit<PersonaTraits, "dominantType" | "description">, string> = {
  vanity: "虚栄心",
  jealousy: "嫉妬",
  approval: "承認欲求",
  loneliness: "孤独感",
  ambition: "野心",
  anxiety: "不安",
  loveSeeking: "愛情渇望",
};

export default function PersonaRadarChart({ persona }: { persona: PersonaTraits }) {
  const data = (Object.keys(TRAIT_LABELS) as Array<keyof typeof TRAIT_LABELS>).map((key) => ({
    trait: TRAIT_LABELS[key],
    score: persona[key],
    fullMark: 10,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="trait"
            tick={{ fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
          />
          <Tooltip
            formatter={(value) => [`${value}/10`, "スコア"]}
            contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
          />
          <Radar
            name="ペルソナ"
            dataKey="score"
            stroke="#9333ea"
            fill="#9333ea"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-2">
        {(Object.keys(TRAIT_LABELS) as Array<keyof typeof TRAIT_LABELS>).map((key) => (
          <div key={key} className="text-center bg-purple-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">{TRAIT_LABELS[key]}</p>
            <p className="text-lg font-bold text-purple-700">{persona[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
