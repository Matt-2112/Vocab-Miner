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
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1") // [[link|text]] → text
    .replace(/'{2,3}/g, "")                            // remove bold/italic markers
    .replace(/\{\{[^}]*\}\}/g, "")                    // remove remaining templates
    .replace(/\s+/g, " ")
    .trim();
}

function extractLanguageSection(wikitext: string, langName: string): string | null {
  const lines = wikitext.split("\n");
  const sectionLines: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (new RegExp(`^==\\s*${langName}\\s*==$`).test(line.trim())) {
      inSection = true;
      continue;
    }
    // Stop at the next top-level language section
    if (inSection && /^==[^=]/.test(line)) break;
    if (inSection) sectionLines.push(line);
  }

  return sectionLines.length > 0 ? sectionLines.join("\n") : null;
}

function extractExamples(section: string): string[] {
  const examples: string[] = [];

  for (const line of section.split("\n")) {
    const trimmed = line.trim();

    // Pattern 1: #: {{uxi|lang|example text|translation}} or {{ux|lang|example|...}}
    // The example text is always the 3rd pipe-delimited argument (index 2)
    const uxMatch = trimmed.match(/\{\{ux[i]?\|[^|]+\|([^|{}]+)/);
    if (uxMatch) {
      const clean = cleanWikiMarkup(uxMatch[1]);
      if (isGoodSentence(clean)) {
        examples.push(clean);
        continue;
      }
    }

    // Pattern 2: #*: direct quotation text
    if (trimmed.startsWith("#*:")) {
      const raw = trimmed.slice(3).trim();
      const clean = cleanWikiMarkup(raw);
      if (isGoodSentence(clean)) examples.push(clean);
    }
  }

  return examples;
}

function isGoodSentence(text: string): boolean {
  const wordCount = text.split(/\s+/).length;
  return text.length > 8 && wordCount >= 3 && wordCount <= 20;
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

    const section = extractLanguageSection(wikitext, langName);
    if (!section) return null;

    const examples = extractExamples(section);
    return examples[0] ?? null;
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
