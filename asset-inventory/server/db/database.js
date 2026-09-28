import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let db;

try {
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
  const filename = process.env.DB_PATH || (isVercel ? ':memory:' : resolve(here, '../data/assets.db'));

  if (filename !== ':memory:') {
    try { mkdirSync(dirname(filename), { recursive: true }); } catch (_) {}
  }

  db = new Database(filename);
  db.pragma('foreign_keys = ON');
  if (filename !== ':memory:') {
    try { db.pragma('journal_mode = WAL'); } catch (_) {}
  }
  db.exec(readFileSync(resolve(here, 'schema.sql'), 'utf8'));
} catch (err) {
  console.warn('SQLite init fallback to in-memory:', err.message);
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(readFileSync(resolve(here, 'schema.sql'), 'utf8'));
}

export default db;

