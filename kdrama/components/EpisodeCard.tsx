import type { Episode } from "@/lib/types";

export default function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
          第{episode.number}話
        </span>
        <h3 className="font-bold text-gray-800">「{episode.title}」</h3>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">{episode.synopsis}</p>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex gap-2">
          <span className="text-pink-500 font-medium shrink-0">見せ場</span>
          <span className="text-gray-600">{episode.keyScene}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-purple-500 font-medium shrink-0">感情フック</span>
          <span className="text-gray-600">{episode.emotionalHook}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-indigo-500 font-medium shrink-0">
            {episode.number === 13 ? "エンディング" : "次話へ"}
          </span>
          <span className="text-gray-600 italic">{episode.cliffhanger}</span>
        </div>
      </div>
    </div>
  );
}
