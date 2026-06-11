"use client";

import { useState, useEffect } from "react";
import { getStoredApiKey, saveApiKey } from "@/lib/apiKey";

export default function ApiKeyInput() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
      setSaved(true);
    } else {
      setEditing(true);
    }
  }, []);

  function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    saveApiKey(trimmed);
    setSaved(true);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  if (saved && !editing) {
    return (
      <div className="flex items-center justify-between text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl">
        <span className="font-medium">✓ Anthropic APIキー設定済み</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-green-600 underline hover:text-green-800"
        >
          変更
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Anthropic APIキー
        <span className="text-gray-400 font-normal ml-2 text-xs">
          （localStorageに保存・サーバーには送信しません）
        </span>
      </label>
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="sk-ant-..."
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-mono"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="px-4 py-3 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  );
}
