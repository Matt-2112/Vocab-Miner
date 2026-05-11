"use client";

import { useState, useRef } from "react";

const SUPPORTED_LANGUAGES = [
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("de");
  const [deckName, setDeckName] = useState("");
  const [topN, setTopN] = useState(100);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("processing");
    setErrorMsg("");

    const form = new FormData();
    form.append("subtitle", file);
    form.append("sourceLang", sourceLang);
    form.append("deckName", deckName || file.name.replace(/\.[^.]+$/, ""));
    form.append("topN", String(topN));

    try {
      const res = await fetch("/api/process", { method: "POST", body: form });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Unknown error");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deckName || "deck"}.apkg`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">VocabMiner</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Upload a subtitle file and get an Anki deck of the most common words.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Subtitle file <span className="text-zinc-400">.srt</span>
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-zinc-400 transition-colors"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".srt,.vtt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p className="text-zinc-700 font-medium">{file.name}</p>
              ) : (
                <p className="text-zinc-400 text-sm">Click to select a .srt or .vtt file</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Content language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Deck name <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g. Dark Season 1"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Number of words: <span className="font-semibold">{topN}</span>
            </label>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={!file || status === "processing"}
            className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === "processing" ? "Processing…" : "Generate Anki Deck"}
          </button>

          {status === "done" && (
            <p className="text-green-600 text-sm text-center">Deck downloaded!</p>
          )}
          {status === "error" && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      </div>
    </main>
  );
}
