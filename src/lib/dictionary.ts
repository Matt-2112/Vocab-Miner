import type { WordEntry } from "./frequency";

const LANG_NAME_MAP: Record<string, string> = {
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
};

function cleanWikiMarkup(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, "")           // remove templates {{...}}
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1") // unwrap [[link|text]] → text
    .replace(/'{2,3}/g, "")                   // remove bold/italic markers
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWiktionaryExample(word: string, langName: string): Promise<string | null> {
  const url =
    `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}` +
    `&prop=wikitext&format=json&origin=*`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = await res.json() as { parse?: { wikitext?: { "*": string } } };
    const wikitext = data?.parse?.wikitext?.["*"];
    if (!wikitext) return null;

    // Isolate the section for the target language (e.g. ==German==)
    const langPattern = new RegExp(
      `==\\s*${langName}\\s*==([\\s\\S]*?)(?:(?=^==[^=])|$)`,
      "m"
    );
    const langMatch = wikitext.match(langPattern);
    if (!langMatch) return null;

    const section = langMatch[1];

    // Examples appear on lines starting with #* (direct) or #*: (quoted block)
    // We prefer #*: lines as they are the actual sentences
    const candidates: string[] = [];

    for (const line of section.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#*:") || trimmed.startsWith("#* ")) {
        const raw = trimmed.replace(/^#\*:?\s*/, "");
        const clean = cleanWikiMarkup(raw);
        const wordCount = clean.split(/\s+/).length;
        if (clean.length > 10 && wordCount >= 4 && wordCount <= 20) {
          candidates.push(clean);
        }
      }
    }

    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

async function processBatch(entries: WordEntry[], langName: string): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      const sentence = await fetchWiktionaryExample(entry.word, langName);
      if (sentence) entry.exampleSentence = sentence;
    })
  );
}

export async function enrichWithDictionaryExamples(
  entries: WordEntry[],
  sourceLang: string
): Promise<WordEntry[]> {
  const langName = LANG_NAME_MAP[sourceLang];
  if (!langName) return entries;

  const batchSize = 5;
  for (let i = 0; i < entries.length; i += batchSize) {
    await processBatch(entries.slice(i, i + batchSize), langName);
    if (i + batchSize < entries.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return entries;
}
