export function makeClientId(prefix = 'sc') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function countSpokenWords(text = '') {
  if (!text || typeof text !== 'string') return 0;
  // Strip inline cue brackets like [pause] or [zoom] so only spoken words count
  const cleaned = text.replace(/\[[^\]]*\]/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function estimateSceneSeconds(scene, wpm = 130) {
  if (!scene) return 0;
  if (scene.customDurationSec && Number(scene.customDurationSec) > 0) {
    return Math.round(Number(scene.customDurationSec));
  }
  const words = countSpokenWords(scene.spoken || '');
  if (words === 0) return 0;
  return Math.max(2, Math.round((words / (wpm || 130)) * 60));
}

export function computeSceneTimings(scenes = [], wpm = 130) {
  let cursor = 0;
  return scenes.map((sc, idx) => {
    const durationSec = estimateSceneSeconds(sc, wpm);
    const startSec = cursor;
    const endSec = cursor + durationSec;
    cursor = endSec;
    return {
      index: idx,
      words: countSpokenWords(sc.spoken || ''),
      durationSec,
      startSec,
      endSec,
    };
  });
}

export function formatTimecode(totalSeconds = 0) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function formatHumanDuration(totalSeconds = 0) {
  const sec = Math.max(0, Math.round(totalSeconds));
  if (sec === 0) return '0s';
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins === 0) return `${rem}s`;
  if (rem === 0) return `${mins}m`;
  return `${mins}m ${rem}s`;
}

export function formatRelativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Smart Parser: Converts pasted freeform notebook text into structured scenes!
 * Splits on blank lines or headings, detects [Camera: ...] / [Editor: ...] / [B-Roll: ...] cues automatically.
 */
export function parseFreeformToScenes(rawText = '') {
  const blocks = String(rawText)
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [
      {
        id: makeClientId('sc'),
        type: 'hook',
        title: 'Scene 1 — Opening Hook',
        spoken: '',
        visualCue: '',
        editorCue: '',
        notes: '',
        customDurationSec: 0,
      },
    ];
  }

  return blocks.map((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = idx === 0 ? 'Opening Hook' : idx === blocks.length - 1 && blocks.length > 2 ? 'Outro / CTA' : `Scene ${idx + 1}`;
    let type = idx === 0 ? 'hook' : idx === blocks.length - 1 && blocks.length > 2 ? 'cta' : 'story';
    let visualCue = '';
    let editorCue = '';
    const spokenLines = [];

    lines.forEach((line, lineIdx) => {
      if (lineIdx === 0 && /^(\#+\s*|scene\s*\d+|hook|intro|outro|cta)[\s:—-]*/i.test(line) && lines.length > 1) {
        title = line.replace(/^\#+\s*/, '').trim();
        if (/hook/i.test(title)) type = 'hook';
        else if (/intro/i.test(title)) type = 'intro';
        else if (/b-?roll/i.test(title)) type = 'broll';
        else if (/demo/i.test(title)) type = 'demo';
        else if (/cta|outro/i.test(title)) type = 'cta';
        return;
      }

      const camMatch = line.match(/^\[?(?:camera|visual|shot|cam)\s*:\s*([^\]]+)\]?$/i);
      if (camMatch) {
        visualCue = (visualCue ? `${visualCue} ` : '') + camMatch[1].trim();
        return;
      }

      const editMatch = line.match(/^\[?(?:editor|edit|b-?roll|sfx|audio)\s*:\s*([^\]]+)\]?$/i);
      if (editMatch) {
        editorCue = (editorCue ? `${editorCue} ` : '') + editMatch[1].trim();
        return;
      }

      spokenLines.push(line);
    });

    return {
      id: makeClientId('sc'),
      type,
      title,
      spoken: spokenLines.join('\n'),
      visualCue,
      editorCue,
      notes: '',
      customDurationSec: 0,
    };
  });
}

export function buildPlainSpokenScript(script) {
  if (!script?.scenes) return '';
  return script.scenes
    .map((sc) => sc.spoken?.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function buildFullMarkdownExport(script, wpm = 130) {
  if (!script) return '';
  const timings = computeSceneTimings(script.scenes || [], wpm);
  const lines = [
    `# ${script.title}`,
    script.subtitle ? `> ${script.subtitle}` : '',
    '',
    `**Platform:** ${script.platform?.toUpperCase()} (${script.aspectRatio}) | **Status:** ${script.status}`,
    '',
    '---',
    '',
  ];

  (script.scenes || []).forEach((sc, idx) => {
    const t = timings[idx];
    lines.push(
      `### ${idx + 1}. [${sc.type?.toUpperCase()}] ${sc.title || `Scene ${idx + 1}`} (${formatTimecode(t.startSec)} – ${formatTimecode(t.endSec)})`
    );
    if (sc.spoken) lines.push(`\n${sc.spoken}\n`);
    if (sc.visualCue) lines.push(`- **Camera / Visual:** ${sc.visualCue}`);
    if (sc.editorCue) lines.push(`- **Editor / B-Roll / SFX:** ${sc.editorCue}`);
    if (sc.notes) lines.push(`- **Note:** ${sc.notes}`);
    lines.push('');
  });

  return lines.filter((l) => l !== null).join('\n');
}
