"use client";

import { useState } from "react";
import type { SalesCopy } from "@/lib/types";

function CopyItem({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1"
      >
        {copied ? "コピー済" : "コピー"}
      </button>
    </div>
  );
}

export default function CopyPanel({ copy }: { copy: SalesCopy }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">メインコピー</h3>
        <CopyItem label="ヘッドライン" value={copy.headline} />
        <CopyItem label="サブヘッドライン" value={copy.subheadline} />
        <CopyItem label="CTA" value={copy.cta} />
        <CopyItem label="社会的証明" value={copy.socialProof} />
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">ペインポイント（3つの痛み）</h3>
        <div className="space-y-2">
          {copy.painPoints.map((p, i) => (
            <CopyItem key={i} label={`痛み ${i + 1}`} value={p} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">プロミス（3つの約束）</h3>
        <div className="space-y-2">
          {copy.promises.map((p, i) => (
            <CopyItem key={i} label={`約束 ${i + 1}`} value={p} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">メール件名（5案）</h3>
        <div className="space-y-2">
          {copy.emailSubjectLines.map((s, i) => (
            <CopyItem key={i} label={`件名 ${i + 1}`} value={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
