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

const columns = (
  db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
).map((col) => col.name);

if (!columns.includes("tier")) {
  db.exec("ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'");
}

if (!columns.includes("stripe_customer_id")) {
  db.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT");
}

export default db;
