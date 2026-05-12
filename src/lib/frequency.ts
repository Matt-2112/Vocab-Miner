import { PorterStemmer } from "natural";
import * as stopword from "stopword";
import type { SubtitleCue } from "./parseSubtitles";

export interface WordEntry {
  word: string;
  stem: string;
  count: number;
  exampleSentence: string;
}

// Maps DeepL/app language codes to stopword package export names
const STOPWORD_LANG_MAP: Record<string, keyof typeof stopword> = {
  de: "deu",
  fr: "fra",
  es: "spa",
  it: "ita",
  pt: "por",
  nl: "nld",
  pl: "pol",
  ru: "rus",
  ja: "jpn",
  zh: "zho",
  ko: "kor",
};

function getStopwords(sourceLang: string): string[] {
  const key = STOPWORD_LANG_MAP[sourceLang];
  const list = key ? stopword[key] : null;
  return Array.isArray(list) ? (list as string[]) : stopword.eng;
}

// Builds a set of likely proper nouns by checking how often a word appears
// capitalised in mid-sentence positions (index > 0 within a cue).
// Skipped for German because German capitalises all nouns.
function buildProperNounSet(cues: SubtitleCue[], sourceLang: string): Set<string> {
  if (sourceLang === "de") return new Set();

  const midCaps = new Map<string, number>();   // lowercase word → capitalised mid-sentence count
  const midTotal = new Map<string, number>();  // lowercase word → total mid-sentence count

  for (const cue of cues) {
    const tokens = cue.text.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      const raw = tokens[i].replace(/[^\p{L}]/gu, "");
      if (raw.length < 2) continue;
      const lower = raw.toLowerCase();
      midTotal.set(lower, (midTotal.get(lower) ?? 0) + 1);
      if (/^\p{Lu}/u.test(raw)) {
        midCaps.set(lower, (midCaps.get(lower) ?? 0) + 1);
      }
    }
  }

  const properNouns = new Set<string>();
  for (const [word, total] of midTotal) {
    if (total < 2) continue;
    const caps = midCaps.get(word) ?? 0;
    if (caps / total > 0.75) properNouns.add(word);
  }
  return properNouns;
}

function tokenize(text: string): string[] {
  return text.match(/\p{L}+/gu) ?? [];
}

function scoreExampleSentence(text: string): number {
  const words = text.split(/\s+/);
  const len = words.length;
  if (len < 4 || len > 18) return 0;
  const hasEndPunct = /[.!?]$/.test(text.trim());
  return len * (hasEndPunct ? 1.5 : 1);
}

export function buildFrequencyList(
  cues: SubtitleCue[],
  topN: number = 100,
  sourceLang: string = "en"
): WordEntry[] {
  const stopwords = getStopwords(sourceLang);
  const properNouns = buildProperNounSet(cues, sourceLang);
  const stemToWords: Map<string, Map<string, number>> = new Map();
  const stemToExamples: Map<string, SubtitleCue[]> = new Map();

  for (const cue of cues) {
    const tokens = tokenize(cue.text);
    const filtered = stopword.removeStopwords(
      tokens.map((t) => t.toLowerCase()),
      stopwords
    );

    for (const token of filtered) {
      if (token.length < 3) continue;
      if (properNouns.has(token)) continue;
      const stem = PorterStemmer.stem(token);

      if (!stemToWords.has(stem)) stemToWords.set(stem, new Map());
      const wordMap = stemToWords.get(stem)!;
      wordMap.set(token, (wordMap.get(token) ?? 0) + 1);

      if (!stemToExamples.has(stem)) stemToExamples.set(stem, []);
      stemToExamples.get(stem)!.push(cue);
    }
  }

  const entries: WordEntry[] = [];

  for (const [stem, wordMap] of stemToWords) {
    const count = Array.from(wordMap.values()).reduce((a, b) => a + b, 0);
    const word = Array.from(wordMap.entries()).sort((a, b) => b[1] - a[1])[0][0];

    const candidates = stemToExamples.get(stem) ?? [];
    const best = candidates
      .map((c) => ({ cue: c, score: scoreExampleSentence(c.text) }))
      .sort((a, b) => b.score - a.score)[0];

    entries.push({ word, stem, count, exampleSentence: best?.cue.text ?? "" });
  }

  return entries
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}
