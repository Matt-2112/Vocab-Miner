import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id   TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name  TEXT,
    image TEXT,
    tier  TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

export default db;
