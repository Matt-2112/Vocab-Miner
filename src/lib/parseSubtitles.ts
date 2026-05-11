import { parseSync, stringifySync } from "subtitle";

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export function parseSrt(content: string): SubtitleCue[] {
  const nodes = parseSync(content);
  return nodes
    .filter((n) => n.type === "cue")
    .map((n) => ({
      start: (n.data as { start: number }).start,
      end: (n.data as { end: number }).end,
      text: (n.data as { text: string }).text.replace(/<[^>]+>/g, "").trim(),
    }))
    .filter((c) => c.text.length > 0);
}
