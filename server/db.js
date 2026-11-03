import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SFR_YOUTUBE_CHANNEL_URL =
  'https://youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg';

export function makeId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function makeShareSlug() {
  return crypto.randomBytes(5).toString('base64url');
}

export function createDatabase(customDbPath) {
  const dbPath = customDbPath || path.resolve(process.cwd(), 'data', 'notebook.db');
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS studio_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      studio_name TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      youtube_channel_url TEXT NOT NULL DEFAULT '${SFR_YOUTUBE_CHANNEL_URL}',
      default_wpm INTEGER NOT NULL DEFAULT 130,
      pin_salt TEXT NOT NULL DEFAULT '',
      pin_hash TEXT NOT NULL DEFAULT '',
      pin_version INTEGER NOT NULL DEFAULT 1,
      is_default_pin INTEGER NOT NULL DEFAULT 0,
      token_secret TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#FF6B00',
      icon TEXT NOT NULL DEFAULT 'folder',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      share_slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT 'Sumon',
      last_edited_by TEXT NOT NULL DEFAULT '',
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      platform TEXT NOT NULL DEFAULT 'youtube',
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      status TEXT NOT NULL DEFAULT 'ready_for_shoot',
      is_shared INTEGER NOT NULL DEFAULT 1,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'Bangla',
      target_duration_sec INTEGER NOT NULL DEFAULT 0,
      wpm_override INTEGER DEFAULT NULL,
      full_text TEXT NOT NULL DEFAULT '',
      youtube_url TEXT NOT NULL DEFAULT '',
      scenes_json TEXT NOT NULL DEFAULT '[]',
      brief_json TEXT NOT NULL DEFAULT '{}',
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
      scene_id TEXT DEFAULT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL DEFAULT 'Team Member',
      is_creator INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      is_resolved INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
  `);

  runMigrations(db);
  seedStudioAndCleanFolders(db);
  return db;
}

function runMigrations(db) {
  const studioCols = db.prepare('PRAGMA table_info(studio_settings)').all().map((c) => c.name);
  if (!studioCols.includes('youtube_channel_url')) {
    db.exec(
      `ALTER TABLE studio_settings ADD COLUMN youtube_channel_url TEXT NOT NULL DEFAULT '${SFR_YOUTUBE_CHANNEL_URL}'`
    );
  }

  const scriptCols = db.prepare('PRAGMA table_info(scripts)').all().map((c) => c.name);
  if (!scriptCols.includes('author_name')) {
    db.exec("ALTER TABLE scripts ADD COLUMN author_name TEXT NOT NULL DEFAULT 'Sumon'");
  }
  if (!scriptCols.includes('last_edited_by')) {
    db.exec("ALTER TABLE scripts ADD COLUMN last_edited_by TEXT NOT NULL DEFAULT ''");
  }
  if (!scriptCols.includes('full_text')) {
    db.exec("ALTER TABLE scripts ADD COLUMN full_text TEXT NOT NULL DEFAULT ''");
  }
  if (!scriptCols.includes('youtube_url')) {
    db.exec("ALTER TABLE scripts ADD COLUMN youtube_url TEXT NOT NULL DEFAULT ''");
  }

  db.exec(`
    DELETE FROM scripts WHERE id IN (
      'scr_sfr_sketch',
      'scr_yt_workflow',
      'scr_reel_mistakes',
      'scr_private_docu'
    );
    DELETE FROM folders WHERE id IN (
      'fld_facebook',
      'fld_ideas',
      'fld_sfr_sketch'
    );
    UPDATE scripts SET is_shared = 1 WHERE is_shared = 0;
  `);

  db.prepare(`
    UPDATE studio_settings
    SET studio_name = 'SUMON FROM RANGPUR',
        creator_name = CASE
          WHEN LOWER(creator_name) IN ('suman', 'mehedi') THEN 'Sumon'
          ELSE creator_name
        END,
        youtube_channel_url = COALESCE(NULLIF(youtube_channel_url, ''), ?)
    WHERE id = 1
  `).run(SFR_YOUTUBE_CHANNEL_URL);
}

function seedStudioAndCleanFolders(db) {
  const existingSettings = db.prepare('SELECT id FROM studio_settings WHERE id = 1').get();
  const now = new Date().toISOString();

  if (!existingSettings) {
    db.prepare(`
      INSERT INTO studio_settings (
        id, studio_name, creator_name, tagline, youtube_channel_url, default_wpm,
        pin_salt, pin_hash, pin_version, is_default_pin, token_secret, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, '', '', 1, 0, '', ?)
    `).run(
      'SUMON FROM RANGPUR',
      'Sumon',
      'Official YouTube Script Notebook',
      SFR_YOUTUBE_CHANNEL_URL,
      130,
      now
    );
  }

  const ensureFolder = db.prepare(`
    INSERT OR IGNORE INTO folders (id, name, color, icon, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  ensureFolder.run('fld_youtube', 'YouTube Videos', '#FF0000', 'youtube', 1, now);
  ensureFolder.run('fld_reels', 'YouTube Shorts', '#FF6B00', 'zap', 2, now);

  db.prepare("UPDATE folders SET name = 'YouTube Videos', color = '#FF0000' WHERE id = 'fld_youtube'").run();
  db.prepare("UPDATE folders SET name = 'YouTube Shorts', color = '#FF6B00' WHERE id = 'fld_reels'").run();
}
