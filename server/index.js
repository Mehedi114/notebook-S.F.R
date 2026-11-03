import express from 'express';
import http from 'node:http';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, makeId, makeShareSlug, SFR_YOUTUBE_CHANNEL_URL } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function countWords(text = '') {
  if (!text || typeof text !== 'string') return 0;
  const cleaned = text.replace(/\[[^\]]*\]/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function createApp({ dbPath } = {}) {
  const db = createDatabase(dbPath);
  const app = express();

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  const sseClients = new Set();

  function broadcast(event, payload) {
    const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients) {
      try {
        client.res.write(data);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  function getSettings() {
    return db.prepare('SELECT * FROM studio_settings WHERE id = 1').get();
  }

  function resolveValidFolderId(folderId) {
    if (!folderId) return null;
    const row = db.prepare('SELECT id FROM folders WHERE id = ?').get(String(folderId));
    return row ? row.id : null;
  }

  function formatScriptRow(row, { includeFull = false } = {}) {
    if (!row) return null;
    const scenes = safeJsonParse(row.scenes_json, []);
    const brief = safeJsonParse(row.brief_json, {});
    const tags = safeJsonParse(row.tags_json, []);

    const fullText =
      row.full_text && row.full_text.trim()
        ? row.full_text
        : scenes
            .map((s) => [s.title ? `দৃশ্য: ${s.title}` : '', s.spoken || ''].filter(Boolean).join('\n'))
            .filter(Boolean)
            .join('\n\n');

    const totalWords = countWords(fullText);
    const settings = getSettings();
    const wpm = row.wpm_override || settings.default_wpm || 130;
    const estimatedDurationSec =
      totalWords > 0 ? Math.max(3, Math.round((totalWords / wpm) * 60)) : 0;

    const commentStats = db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as unresolved
         FROM comments WHERE script_id = ?`
      )
      .get(row.id);

    const base = {
      id: row.id,
      shareSlug: row.share_slug,
      title: row.title,
      subtitle: row.subtitle,
      authorName: row.author_name || 'Sumon',
      lastEditedBy: row.last_edited_by || row.author_name || '',
      folderId: row.folder_id,
      platform: row.platform,
      aspectRatio: row.aspect_ratio,
      status: row.status,
      isPinned: Boolean(row.is_pinned),
      wpmOverride: row.wpm_override,
      youtubeUrl: row.youtube_url || '',
      tags,
      wordCount: totalWords,
      estimatedDurationSec,
      commentCount: Number(commentStats?.total || 0),
      unresolvedCommentCount: Number(commentStats?.unresolved || 0),
      previewText: fullText.replace(/\s+/g, ' ').trim().slice(0, 180) || row.subtitle || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (!includeFull) return base;

    const comments = db
      .prepare(
        `SELECT id, script_id as scriptId, scene_id as sceneId, author_name as authorName,
                author_role as authorRole, content,
                is_resolved as isResolved, created_at as createdAt
         FROM comments
         WHERE script_id = ?
         ORDER BY created_at ASC`
      )
      .all(row.id)
      .map((c) => ({
        ...c,
        isResolved: Boolean(c.isResolved),
      }));

    return {
      ...base,
      fullText,
      scenes,
      brief,
      comments,
    };
  }

  // --- SSE Real-Time Endpoint ---
  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

    const client = { res };
    sseClients.add(client);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(client);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(client);
    });
  });

  // --- Studio Info (Zero Password System!) ---
  app.get('/api/studio', (req, res) => {
    const s = getSettings();
    res.json({
      studioName: s.studio_name,
      creatorName: s.creator_name,
      tagline: s.tagline,
      youtubeChannelUrl: s.youtube_channel_url || SFR_YOUTUBE_CHANNEL_URL,
      defaultWpm: s.default_wpm,
    });
  });

  app.patch('/api/studio', (req, res) => {
    const { studioName, creatorName, tagline, youtubeChannelUrl, defaultWpm } = req.body || {};
    const s = getSettings();
    const now = new Date().toISOString();

    const updatedStudioName =
      typeof studioName === 'string' && studioName.trim() ? studioName.trim() : s.studio_name;
    const updatedCreatorName =
      typeof creatorName === 'string' && creatorName.trim() ? creatorName.trim() : s.creator_name;
    const updatedTagline = typeof tagline === 'string' ? tagline.trim() : s.tagline;
    const updatedYtUrl =
      typeof youtubeChannelUrl === 'string' && youtubeChannelUrl.trim()
        ? youtubeChannelUrl.trim()
        : s.youtube_channel_url || SFR_YOUTUBE_CHANNEL_URL;
    const updatedWpm =
      Number(defaultWpm) >= 60 && Number(defaultWpm) <= 300
        ? Math.round(Number(defaultWpm))
        : s.default_wpm;

    db.prepare(`
      UPDATE studio_settings
      SET studio_name = ?, creator_name = ?, tagline = ?, youtube_channel_url = ?, default_wpm = ?, updated_at = ?
      WHERE id = 1
    `).run(updatedStudioName, updatedCreatorName, updatedTagline, updatedYtUrl, updatedWpm, now);

    broadcast('studio:updated', { studioName: updatedStudioName, ts: Date.now() });

    res.json({
      studioName: updatedStudioName,
      creatorName: updatedCreatorName,
      tagline: updatedTagline,
      youtubeChannelUrl: updatedYtUrl,
      defaultWpm: updatedWpm,
    });
  });

  // --- Folders ---
  app.get('/api/folders', (req, res) => {
    const folders = db
      .prepare(
        'SELECT id, name, color, icon, sort_order as sortOrder FROM folders ORDER BY sort_order ASC, created_at ASC'
      )
      .all();

    const counts = db
      .prepare('SELECT folder_id, COUNT(*) as cnt FROM scripts GROUP BY folder_id')
      .all();
    const countMap = new Map(counts.map((c) => [c.folder_id, Number(c.cnt)]));

    res.json(
      folders.map((f) => ({
        ...f,
        scriptCount: countMap.get(f.id) || 0,
      }))
    );
  });

  // --- Scripts (Open Team Collaboration — Zero Password!) ---
  app.get('/api/scripts', (req, res) => {
    const rows = db
      .prepare('SELECT * FROM scripts ORDER BY is_pinned DESC, updated_at DESC')
      .all();
    res.json(rows.map((r) => formatScriptRow(r, { includeFull: false })));
  });

  app.get('/api/scripts/by-slug/:slug', (req, res) => {
    const row = db.prepare('SELECT * FROM scripts WHERE share_slug = ?').get(req.params.slug);
    if (!row) return res.status(404).json({ error: 'Script not found.' });
    res.json(formatScriptRow(row, { includeFull: true }));
  });

  app.get('/api/scripts/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Script not found.' });
    res.json(formatScriptRow(row, { includeFull: true }));
  });

  app.post('/api/scripts', (req, res) => {
    try {
      const {
        title = '',
        subtitle = '',
        authorName = '',
        folderId = null,
        platform = 'youtube',
        aspectRatio = '16:9',
        status = 'ready_for_shoot',
        isPinned = false,
        fullText = '',
        youtubeUrl = '',
      } = req.body || {};

      const id = makeId('scr');
      const shareSlug = makeShareSlug();
      const now = new Date().toISOString();

      const cleanFullText = String(fullText || '');
      const fallbackTitle =
        cleanFullText
          .split('\n')
          .map((l) => l.trim())
          .find(Boolean)
          ?.slice(0, 70) || 'নতুন স্ক্রিপ্ট';
      const cleanTitle = String(title || '').trim() || fallbackTitle;

      const cleanAuthor =
        typeof authorName === 'string' && authorName.trim()
          ? authorName.trim().slice(0, 60)
          : getSettings().creator_name || 'Sumon';

      const validFolderId = resolveValidFolderId(folderId);

      db.prepare(`
        INSERT INTO scripts (
          id, share_slug, title, subtitle, author_name, last_edited_by, folder_id,
          platform, aspect_ratio, status, is_shared, is_pinned,
          full_text, youtube_url, scenes_json, brief_json, tags_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, '[]', '{}', '[]', ?, ?)
      `).run(
        id,
        shareSlug,
        cleanTitle,
        String(subtitle || ''),
        cleanAuthor,
        cleanAuthor,
        validFolderId,
        platform,
        aspectRatio,
        status,
        isPinned ? 1 : 0,
        cleanFullText,
        String(youtubeUrl || '').trim(),
        now,
        now
      );

      const created = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
      const formatted = formatScriptRow(created, { includeFull: true });
      broadcast('script:updated', { scriptId: id, ts: Date.now() });
      res.status(201).json(formatted);
    } catch (err) {
      console.error('Error creating script:', err);
      res.status(500).json({ error: `স্ক্রিপ্ট সেভ করতে সমস্যা হয়েছে: ${err.message}` });
    }
  });

  app.put('/api/scripts/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Script not found.' });

      const body = req.body || {};
      const now = new Date().toISOString();

      const nextTitle =
        body.title !== undefined ? String(body.title).trim() || 'নতুন স্ক্রিপ্ট' : existing.title;
      const nextSubtitle =
        body.subtitle !== undefined ? String(body.subtitle) : existing.subtitle;
      const nextAuthorName =
        typeof body.authorName === 'string' && body.authorName.trim()
          ? body.authorName.trim().slice(0, 60)
          : existing.author_name;
      const nextLastEditedBy =
        typeof body.lastEditedBy === 'string' && body.lastEditedBy.trim()
          ? body.lastEditedBy.trim().slice(0, 60)
          : existing.last_edited_by || nextAuthorName;
      const nextFolderId =
        body.folderId !== undefined ? resolveValidFolderId(body.folderId) : existing.folder_id;
      const nextPlatform = body.platform !== undefined ? body.platform : existing.platform;
      const nextAspectRatio =
        body.aspectRatio !== undefined ? body.aspectRatio : existing.aspect_ratio;
      const nextStatus = body.status !== undefined ? body.status : existing.status;
      const nextIsPinned =
        body.isPinned !== undefined ? (body.isPinned ? 1 : 0) : existing.is_pinned;
      const nextFullText =
        body.fullText !== undefined ? String(body.fullText) : existing.full_text;
      const nextYoutubeUrl =
        body.youtubeUrl !== undefined ? String(body.youtubeUrl).trim() : existing.youtube_url;
      const nextWpmOverride =
        body.wpmOverride !== undefined
          ? body.wpmOverride
            ? Number(body.wpmOverride)
            : null
          : existing.wpm_override;

      db.prepare(`
        UPDATE scripts
        SET title = ?, subtitle = ?, author_name = ?, last_edited_by = ?, folder_id = ?,
            platform = ?, aspect_ratio = ?, status = ?, is_shared = 1, is_pinned = ?,
            full_text = ?, youtube_url = ?, wpm_override = ?, updated_at = ?
        WHERE id = ?
      `).run(
        nextTitle,
        nextSubtitle,
        nextAuthorName,
        nextLastEditedBy,
        nextFolderId,
        nextPlatform,
        nextAspectRatio,
        nextStatus,
        nextIsPinned,
        nextFullText,
        nextYoutubeUrl,
        nextWpmOverride,
        now,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM scripts WHERE id = ?').get(existing.id);
      const formatted = formatScriptRow(updated, { includeFull: true });
      broadcast('script:updated', { scriptId: existing.id, ts: Date.now() });
      res.json(formatted);
    } catch (err) {
      console.error('Error updating script:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/scripts/:id/duplicate', (req, res) => {
    const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Script not found.' });

    const id = makeId('scr');
    const shareSlug = makeShareSlug();
    const now = new Date().toISOString();
    const copyAuthor =
      req.body?.authorName && String(req.body.authorName).trim()
        ? String(req.body.authorName).trim().slice(0, 60)
        : existing.author_name;

    db.prepare(`
      INSERT INTO scripts (
        id, share_slug, title, subtitle, author_name, last_edited_by, folder_id,
        platform, aspect_ratio, status, is_shared, is_pinned,
        full_text, youtube_url, scenes_json, brief_json, tags_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready_for_shoot', 1, 0, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      shareSlug,
      `${existing.title} (কপি)`,
      existing.subtitle,
      copyAuthor,
      copyAuthor,
      existing.folder_id,
      existing.platform,
      existing.aspect_ratio,
      existing.full_text,
      existing.youtube_url,
      existing.scenes_json,
      existing.brief_json,
      existing.tags_json,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
    broadcast('script:updated', { scriptId: id, ts: Date.now() });
    res.status(201).json(formatScriptRow(created, { includeFull: true }));
  });

  app.delete('/api/scripts/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM scripts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Script not found.' });
    db.prepare('DELETE FROM scripts WHERE id = ?').run(req.params.id);
    broadcast('script:deleted', { scriptId: req.params.id, ts: Date.now() });
    res.json({ ok: true });
  });

  // --- Team Comments ---
  app.post('/api/scripts/:id/comments', (req, res) => {
    const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
    if (!script) return res.status(404).json({ error: 'Script not found.' });

    const { authorName, authorRole = 'Team Member', content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }
    const cleanAuthor =
      authorName && String(authorName).trim()
        ? String(authorName).trim().slice(0, 50)
        : 'Team Member';
    const cleanRole = String(authorRole || 'Team Member').trim().slice(0, 40);

    const id = makeId('cmt');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO comments (
        id, script_id, scene_id, author_name, author_role, is_creator, content, is_resolved, parent_id, created_at
      ) VALUES (?, ?, NULL, ?, ?, 0, ?, 0, NULL, ?)
    `).run(id, script.id, cleanAuthor, cleanRole, String(content).trim().slice(0, 2000), now);

    broadcast('comment:updated', { scriptId: script.id, commentId: id, ts: Date.now() });
    res.status(201).json({
      id,
      scriptId: script.id,
      authorName: cleanAuthor,
      authorRole: cleanRole,
      content: String(content).trim().slice(0, 2000),
      isResolved: false,
      createdAt: now,
    });
  });

  app.patch('/api/comments/:id/resolve', (req, res) => {
    const existing = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Comment not found.' });

    const nextResolved =
      req.body?.isResolved !== undefined ? (req.body.isResolved ? 1 : 0) : existing.is_resolved ? 0 : 1;
    db.prepare('UPDATE comments SET is_resolved = ? WHERE id = ?').run(nextResolved, existing.id);

    broadcast('comment:updated', { scriptId: existing.script_id, commentId: existing.id, ts: Date.now() });
    res.json({ id: existing.id, isResolved: Boolean(nextResolved) });
  });

  app.delete('/api/comments/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Comment not found.' });
    db.prepare('DELETE FROM comments WHERE id = ?').run(existing.id);
    broadcast('comment:updated', { scriptId: existing.script_id, commentId: existing.id, ts: Date.now() });
    res.json({ ok: true });
  });

  return { app, db };
}

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const isProd = process.env.NODE_ENV === 'production';

  const { app } = createApp();
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: { server, clientPort: 443 },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '..', 'dist');
    const publicPath = path.resolve(__dirname, '..', 'public');

    app.get('/sw.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(path.join(publicPath, 'sw.js'));
    });

    app.get('/manifest.webmanifest', (req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(publicPath, 'manifest.webmanifest'));
    });

    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      const acceptEnc = req.headers['accept-encoding'] || '';
      if (!acceptEnc.includes('gzip')) return next();
      if (!/\.(js|css|html|svg|webmanifest)$/i.test(req.path)) return next();

      const candidateDist = path.join(distPath, req.path);
      const candidatePub = path.join(publicPath, req.path);
      const target = fs.existsSync(candidateDist)
        ? candidateDist
        : fs.existsSync(candidatePub)
          ? candidatePub
          : null;
      if (!target || !fs.statSync(target).isFile()) return next();

      const ext = path.extname(target).toLowerCase();
      const mime =
        ext === '.js'
          ? 'application/javascript; charset=utf-8'
          : ext === '.css'
            ? 'text/css; charset=utf-8'
            : ext === '.html'
              ? 'text/html; charset=utf-8'
              : ext === '.svg'
                ? 'image/svg+xml'
                : 'application/manifest+json; charset=utf-8';

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader(
        'Cache-Control',
        req.path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
      );
      fs.createReadStream(target).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    });

    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '365d', immutable: true }));
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    app.use(express.static(publicPath, { maxAge: '1h', index: false }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-cache');
        const acceptEnc = req.headers['accept-encoding'] || '';
        if (acceptEnc.includes('gzip')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');
          fs.createReadStream(indexFile).pipe(zlib.createGzip({ level: 6 })).pipe(res);
        } else {
          res.sendFile(indexFile);
        }
      } else {
        res.status(404).send('Build not found. Run npm run build first.');
      }
    });
  }

  server.listen(port, host, () => {
    console.log(`S.F.R Smart Notebook running on http://${host}:${port} (${isProd ? 'production' : 'development'})`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
