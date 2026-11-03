import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createApp } from './index.js';
import {
  extractSmartBreakdown,
  buildSpeechChunks,
  prepareTextForBanglaTTS,
} from '../src/lib/smartExtractor.js';

async function withServer(fn) {
  const tmpDb = path.join(
    os.tmpdir(),
    `sfr-notebook-v5-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
  );
  const { app, db } = createApp({ dbPath: tmpDb });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(`${tmpDb}${suffix}`);
      } catch {
        // ignore
      }
    }
  }
}

test('Clean workspace has SUMON FROM RANGPUR branding, zero demo scripts, and official YouTube Channel URL', async () => {
  await withServer(async (baseUrl) => {
    const studioRes = await fetch(`${baseUrl}/api/studio`);
    assert.equal(studioRes.status, 200);
    const studio = await studioRes.json();
    assert.equal(studio.studioName, 'SUMON FROM RANGPUR');
    assert.equal(studio.creatorName, 'Sumon');
    assert.equal(
      studio.youtubeChannelUrl,
      'https://youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg'
    );

    const foldersRes = await fetch(`${baseUrl}/api/folders`);
    const folders = await foldersRes.json();
    assert.equal(folders.length, 2);
    assert.deepEqual(
      folders.map((f) => f.name),
      ['YouTube Videos', 'YouTube Shorts']
    );

    const scriptsRes = await fetch(`${baseUrl}/api/scripts`);
    assert.equal(scriptsRes.status, 200);
    const scripts = await scriptsRes.json();
    assert.equal(scripts.length, 0);
  });
});

test('Zero-password script creation, editing, commenting, and auto-title derivation work immediately', async () => {
  await withServer(async (baseUrl) => {
    const sampleA2Z = `দৃশ্য ১ - রংপুরের চায়ের দোকান
[ক্যামেরা: সবার গ্রুপ শট থেকে সুমনের ক্লোজ-আপ]
সুমন: ভাই শোন, আজকে দারুণ একটা প্ল্যান আছে!
মেহেদী: (অবাক হয়ে) কী প্ল্যান তাড়াতাড়ি বল!`;

    // Create script directly WITHOUT any password or Authorization header!
    const createRes = await fetch(`${baseUrl}/api/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'রংপুর স্পেশাল ভিডিও',
        authorName: 'Sumon',
        platform: 'youtube',
        fullText: sampleA2Z,
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.authorName, 'Sumon');
    assert.equal(created.fullText, sampleA2Z);

    // Edit script directly without password
    const editRes = await fetch(`${baseUrl}/api/scripts/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'রংপুর স্পেশাল ভিডিও (আপডেটেড)',
        lastEditedBy: 'Sumon',
      }),
    });
    assert.equal(editRes.status, 200);
    const edited = await editRes.json();
    assert.equal(edited.title, 'রংপুর স্পেশাল ভিডিও (আপডেটেড)');

    // Comment without password
    const commentRes = await fetch(`${baseUrl}/api/scripts/${created.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: 'রাকিব',
        authorRole: 'Cameraman',
        content: 'ডায়ালগগুলো একদম ন্যাচারাল হয়েছে!',
      }),
    });
    assert.equal(commentRes.status, 201);

    // Auto-derived title when pasting fullText without title
    const pasteOnlyRes = await fetch(`${baseUrl}/api/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '',
        authorName: 'Sumon',
        platform: 'shorts',
        folderId: 'fld_reels',
        fullText: 'রংপুরের ঈদ কমেডি শর্টস\nসুমন: সবাইকে ঈদ মোবারক!',
      }),
    });
    assert.equal(pasteOnlyRes.status, 201);
    const pasteCreated = await pasteOnlyRes.json();
    assert.equal(pasteCreated.title, 'রংপুরের ঈদ কমেডি শর্টস');
  });
});

test('Smart Extractor & Bangla TTS Cleaner produce natural Bangla sentences and clean chunks', () => {
  const sampleScript = `দৃশ্য ১ - রংপুর স্টেশন রোড
লোকেশন: সকালের চায়ের দোকান
[ক্যামেরা সবার ওপর প্যান করে সুমনের মুখের ক্লোজ-আপ নেবে]
সুমন: কিরে ভাই, এত দেরি করলি কেন?
মেহেদী: (হাঁপাতে হাঁপাতে) রাস্তায় প্রচণ্ড জ্যাম ছিল ভাই!
সুমন: আচ্ছা তাড়াতাড়ি চা শেষ কর, শুট শুরু করতে হবে।

দৃশ্য ২ - নদীর পাড়
(ড্রোন শটে পুরো নদীর দৃশ্য দেখাবে)
রাকিব বলল, "ভাই আলো কমে যাচ্ছে, এখনই শট নিতে হবে!"`;

  const result = extractSmartBreakdown(sampleScript);
  assert.equal(result.scenes.length, 2);
  assert.equal(result.dialogues.length, 4);
  assert.equal(result.dialogues[0].speaker, 'সুমন');
  assert.equal(result.dialogues[1].cue, 'হাঁপাতে হাঁপাতে');
  assert.equal(result.dialogues[3].speaker, 'রাকিব');

  const spokenCleaned = prepareTextForBanglaTTS(sampleScript);
  assert.ok(spokenCleaned.includes('সুমন বলছে, কিরে ভাই, এত দেরি করলি কেন?'));
  assert.ok(spokenCleaned.includes('মেহেদী হাঁপাতে হাঁপাতে বলছে, রাস্তায় প্রচণ্ড জ্যাম ছিল ভাই!'));
  assert.ok(!spokenCleaned.includes('['));

  const chunks = buildSpeechChunks(sampleScript, 145);
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((c) => c.length <= 150));
});
