import { NextRequest, NextResponse } from "next/server";
import { parseSrt } from "@/lib/parseSubtitles";
import { buildFrequencyList } from "@/lib/frequency";
import { enrichWithDictionaryExamples } from "@/lib/dictionary";
import { translateEntries } from "@/lib/translate";
import { buildAnkiDeck } from "@/lib/buildDeck";
import { readFileSync } from "fs";
import type { SourceLanguageCode } from "deepl-node";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("subtitle") as File | null;
  const sourceLang = (formData.get("sourceLang") as SourceLanguageCode) ?? "de";
  const deckName = (formData.get("deckName") as string) ?? "VocabMiner Deck";
  const topN = parseInt((formData.get("topN") as string) ?? "100", 10);

  if (!file) {
    return NextResponse.json({ error: "No subtitle file provided" }, { status: 400 });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL_API_KEY not configured" }, { status: 500 });
  }

  const text = await file.text();
  const cues = parseSrt(text);

  if (cues.length === 0) {
    return NextResponse.json({ error: "No cues parsed from subtitle file" }, { status: 400 });
  }

  const frequencyList = buildFrequencyList(cues, topN, sourceLang);
  await enrichWithDictionaryExamples(frequencyList, sourceLang);
  const translated = await translateEntries(frequencyList, sourceLang, apiKey);
  const apkgPath = await buildAnkiDeck(translated, deckName);

  const fileBuffer = readFileSync(apkgPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${deckName}.apkg"`,
    },
  });
}
