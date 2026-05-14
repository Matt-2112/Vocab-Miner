"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import UpgradeButton from "@/components/UpgradeButton";

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

const FREE_LIMIT = 50;
const PRO_LIMIT = 500;

export default function GenerateForm({ tier }: { tier: string }) {
  const { update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      update();
      router.replace("/generate");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPro = tier === "premium";
  const maxCards = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("de");
  const [deckName, setDeckName] = useState("");
  const [topN, setTopN] = useState(isPro ? 100 : FREE_LIMIT);
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
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <Link href="/" className="text-white font-semibold text-lg tracking-tight">
          immerse<span className="text-[#4ade80]">.</span>
        </Link>
        <AuthButton />
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[#161616] rounded-2xl border border-white/10 p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Generate your deck</h1>
          <p className="text-white/50 text-sm mb-8">
            Upload a subtitle file and get a ready-to-import Anki deck.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Subtitle file <span className="text-white/30">.srt or .ass</span>
              </label>
              <div
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#4ade80]/50 transition-colors"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".srt,.vtt,.ass"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="text-white font-medium">{file.name}</p>
                ) : (
                  <p className="text-white/40 text-sm">Click to select a .srt or .ass file</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Content language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4ade80]/50"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Deck name <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g. Dark Season 1"
                className="w-full bg-[#0d0d0d] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#4ade80]/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-white/70">
                  Number of words: <span className="font-semibold text-white">{topN}</span>
                </label>
                {!isPro && (
                  <UpgradeButton className="text-[10px] font-semibold tracking-widest uppercase text-[#4ade80]/70 hover:text-[#4ade80] disabled:opacity-60 transition-colors">
                    Unlock 500 → Pro
                  </UpgradeButton>
                )}
              </div>
              <input
                type="range"
                min={20}
                max={maxCards}
                step={10}
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value, 10))}
                className="w-full accent-[#4ade80]"
              />
              {!isPro && (
                <p className="text-white/30 text-xs mt-1">
                  Free plan · 50 cards max.{" "}
                  <UpgradeButton className="text-[#4ade80]/60 hover:text-[#4ade80] disabled:opacity-60 transition-colors underline">
                    Upgrade for 500.
                  </UpgradeButton>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || status === "processing"}
              className="w-full bg-[#4ade80] text-[#0d0d0d] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#22c55e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {status === "processing" ? "Processing…" : "Generate Anki Deck"}
            </button>

            {status === "done" && (
              <p className="text-[#4ade80] text-sm text-center">Deck downloaded!</p>
            )}
            {status === "error" && (
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
