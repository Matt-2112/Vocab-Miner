import Database from "better-sqlite3";
import * as archiver from "archiver";
import { createWriteStream, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { TranslatedEntry } from "./translate";

// Anki .apkg is a zip file containing collection.anki2 (SQLite) and media
export async function buildAnkiDeck(
  entries: TranslatedEntry[],
  deckName: string
): Promise<string> {
  const workDir = join(tmpdir(), `vocabminer-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  const dbPath = join(workDir, "collection.anki2");
  const db = new Database(dbPath);

  initAnkiSchema(db);

  const deckId = Date.now();
  const modelId = deckId + 1;
  const now = Math.floor(Date.now() / 1000);

  insertModel(db, modelId, deckName);
  insertDeck(db, deckId, deckName, now);

  const insertNote = db.prepare(
    `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
     VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')`
  );
  const insertCard = db.prepare(
    `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
     VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`
  );

  const addNote = db.transaction((entry: TranslatedEntry, idx: number) => {
    const noteId = deckId + idx + 100;
    const front = `${entry.word}<br><em>${entry.exampleSentence}</em>`;
    const back = `${entry.translation}<br><em>${entry.translatedExample}</em>`;
    const flds = `${front}\x1f${back}`;

    insertNote.run(noteId, `guid-${noteId}`, modelId, now, flds, entry.word);
    insertCard.run(deckId + idx + 10000, noteId, deckId, now, idx);
  });

  for (let i = 0; i < entries.length; i++) {
    addNote(entries[i], i);
  }

  db.close();

  const apkgPath = join(workDir, `${deckName}.apkg`);
  await zipDeck(dbPath, apkgPath);

  return apkgPath;
}

function initAnkiSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null,
      mod integer not null, usn integer not null, tags text not null, flds text not null,
      sfld integer not null, csum integer not null, flags integer not null, data text not null);
    CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null,
      ord integer not null, mod integer not null, usn integer not null, type integer not null,
      queue integer not null, due integer not null, ivl integer not null, factor integer not null,
      reps integer not null, lapses integer not null, left integer not null, odue integer not null,
      odid integer not null, flags integer not null, data text not null);
    CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null,
      scm integer not null, ver integer not null, dty integer not null, usn integer not null,
      ls integer not null, conf text not null, models text not null, decks text not null,
      dconf text not null, tags text not null);
    CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
    CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null,
      ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null,
      time integer not null, type integer not null);
  `);
}

function insertModel(db: Database.Database, modelId: number, deckName: string) {
  const model = {
    [modelId]: {
      id: modelId,
      name: `${deckName} Model`,
      type: 0,
      mod: 0,
      usn: -1,
      sortf: 0,
      did: null,
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
          bqfmt: "",
          bafmt: "",
          did: null,
          bfont: "",
          bsize: 0,
        },
      ],
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
      latexPre: "",
      latexPost: "",
      req: [[0, "any", [0]]],
    },
  };

  const decks = {
    1: { id: 1, name: "Default", conf: 1, extendNew: 10, extendRev: 50, usn: 0, collapsed: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], dyn: 0, desc: "" },
  };

  db.prepare(
    `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
     VALUES (1, ?, ?, ?, 11, 0, -1, 0, '{}', ?, ?, '{}', '{}')`
  ).run(
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000),
    Date.now(),
    JSON.stringify(model),
    JSON.stringify(decks)
  );
}

function insertDeck(db: Database.Database, deckId: number, deckName: string, now: number) {
  const existingCol = db.prepare("SELECT decks FROM col WHERE id = 1").get() as { decks: string };
  const decks = JSON.parse(existingCol.decks);
  decks[deckId] = {
    id: deckId, name: deckName, conf: 1, extendNew: 10, extendRev: 50,
    usn: -1, collapsed: false, newToday: [0, 0], revToday: [0, 0],
    lrnToday: [0, 0], timeToday: [0, 0], dyn: 0, desc: "",
  };
  db.prepare("UPDATE col SET decks = ? WHERE id = 1").run(JSON.stringify(decks));
}

function zipDeck(dbPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.file(dbPath, { name: "collection.anki2" });
    archive.append("{}", { name: "media" });
    archive.finalize();
  });
}
