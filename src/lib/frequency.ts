import { PorterStemmer, WordTokenizer } from "natural";
import { removeStopwords, eng } from "stopword";
import type { SubtitleCue } from "./parseSubtitles";

export interface WordEntry {
  word: string;
  stem: string;
  count: number;
  exampleSentence: string;
}

const tokenizer = new WordTokenizer();

function scoreExampleSentence(text: string): number {
  const words = text.split(/\s+/);
  const len = words.length;
  if (len < 4 || len > 18) return 0;
  const hasEndPunct = /[.!?]$/.test(text.trim());
  return len * (hasEndPunct ? 1.5 : 1);
}

export function buildFrequencyList(
  cues: SubtitleCue[],
  topN: number = 100
): WordEntry[] {
  const stemToWords: Map<string, Map<string, number>> = new Map();
  const stemToExamples: Map<string, SubtitleCue[]> = new Map();

  for (const cue of cues) {
    const tokens = tokenizer.tokenize(cue.text) ?? [];
    const filtered = removeStopwords(
      tokens.map((t) => t.toLowerCase()),
      eng
    );

    for (const token of filtered) {
      if (token.length < 2) continue;
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
