import * as deepl from "deepl-node";
import type { WordEntry } from "./frequency";

export interface TranslatedEntry extends WordEntry {
  translation: string;
  translatedExample: string;
}

export async function translateEntries(
  entries: WordEntry[],
  sourceLang: deepl.SourceLanguageCode,
  apiKey: string
): Promise<TranslatedEntry[]> {
  const translator = new deepl.Translator(apiKey);

  const words = entries.map((e) => e.word);
  const examples = entries.map((e) => e.exampleSentence);

  const [wordResults, exampleResults] = await Promise.all([
    translator.translateText(words, sourceLang, "en-US"),
    translator.translateText(examples, sourceLang, "en-US"),
  ]);

  return entries.map((entry, i) => ({
    ...entry,
    translation: Array.isArray(wordResults)
      ? wordResults[i].text
      : (wordResults as deepl.TextResult).text,
    translatedExample: Array.isArray(exampleResults)
      ? exampleResults[i].text
      : (exampleResults as deepl.TextResult).text,
  }));
}
