import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    name       TEXT,
    image      TEXT,
    tier       TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Safe migration: add tier column to databases created before this column existed
const hasTier = (
  db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
).some((col) => col.name === "tier");

if (!hasTier) {
  db.exec("ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'");
}

export default db;
