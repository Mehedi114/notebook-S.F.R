const INSTRUCTION_LABELS = new Set([
  'দৃশ্য',
  'সিন',
  'পর্ব',
  'লোকেশন',
  'স্থান',
  'সময়',
  'সময়কাল',
  'লাইটিং',
  'আলো',
  'ক্যামেরা',
  'শট',
  'এঙ্গেল',
  'অ্যাঙ্গেল',
  'নির্দেশনা',
  'নোট',
  'বিশেষ নোট',
  'অ্যাকশন',
  'একশন',
  'অ্যাকশন সিকোয়েন্স',
  'বি-রোল',
  'বিরোল',
  'সাউন্ড',
  'মিউজিক',
  'ব্যাকগ্রাউন্ড',
  'এডিট',
  'এডিটর',
  'প্রপস',
  'চরিত্র',
  'চরিত্রের নাম',
  'টেক্সট',
  'স্ক্রিন',
  'ওয়েব সিরিজ',
  'সিরিজ',
  'নাটক',
  'ভিডিও',
  'থাম্বনেইল',
  'টাইটেল',
  'হুক',
  'ইন্ট্রো',
  'আউটরো',
  'scene',
  'part',
  'episode',
  'duration',
  'lighting',
  'shot',
  'camera',
  'cam',
  'location',
  'loc',
  'time',
  'action',
  'note',
  'notes',
  'instruction',
  'b-roll',
  'broll',
  'sfx',
  'music',
  'audio',
  'edit',
  'editor',
  'props',
  'cast',
  'characters',
  'text',
  'screen',
  'visual',
  'intro',
  'outro',
  'hook',
  'cta',
]);

const INSTRUCTION_SENTENCE_REGEX =
  /(ক্যামেরা|ক্লোজ[\s-]?আপ|ওয়াইড শট|মিডিয়াম শট|বি[\s-]?রোল|সাউন্ড|ব্যাকগ্রাউন্ড মিউজিক|মিউজিক|লোকেশন|লাইটিং|সাবটাইটেল|স্ক্রিনে|স্ক্রিন ব্ল্যাক|জুম ইন|জুম আউট|ফেড ইন|ফেড আউট|ট্রানজিশন|এডিটিং|শট নিবে|শট নিতে হবে|শট হবে|ফ্রেমে|camera|close[\s-]?up|wide shot|b-?roll|sfx|bgm|subtitle|zoom in|transition)/i;

const SCENE_HEADING_REGEX =
  /^(?:দৃশ্য|সিন|পর্ব|ধাপ|scene|part|episode|act)\s*[০-৯0-9#]+.*$/i;

function stripMarkdownLine(str = '') {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{23F0}-\u{23FF}]/gu, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^\s*[*•\-]\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getScriptFullText(script) {
  if (!script) return '';
  if (typeof script.fullText === 'string' && script.fullText.trim()) {
    return script.fullText;
  }
  if (Array.isArray(script.scenes) && script.scenes.length > 0) {
    return script.scenes
      .map((sc, idx) => {
        const parts = [];
        if (sc.title) parts.push(`দৃশ্য ${idx + 1}: ${sc.title}`);
        if (sc.visualCue) parts.push(`[ক্যামেরা ও শট: ${sc.visualCue}]`);
        if (sc.spoken) parts.push(sc.spoken);
        if (sc.editorCue) parts.push(`[এডিট ও সাউন্ড: ${sc.editorCue}]`);
        if (sc.notes) parts.push(`[নোট: ${sc.notes}]`);
        return parts.join('\n');
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return '';
}

function isInstructionPrefix(prefix) {
  const norm = stripMarkdownLine(prefix)
    .toLowerCase()
    .replace(/[০-৯0-9#.\-_()[\]]/g, '')
    .trim();
  if (!norm) return true;
  if (INSTRUCTION_LABELS.has(norm)) return true;
  for (const kw of INSTRUCTION_LABELS) {
    if (norm === kw || norm.startsWith(`${kw} `) || norm.endsWith(` ${kw}`)) {
      return true;
    }
  }
  return false;
}

function inferSpeakerBeforeQuote(beforeText = '') {
  const clean = stripMarkdownLine(beforeText).replace(/[,—–\-:]\s*$/, '').trim();
  if (!clean) return { speaker: 'ডায়ালগ', cue: '' };

  const verbMatch = clean.match(
    /([^\s,.!?;।]{2,20})(?:\s+([^,.!?;।]{0,35}?))?\s+(?:বললো|বলল|বলে|বললেন|বলবে|চিৎকার করে বললো|হেসে বললো|রেগে বললো|জিজ্ঞেস করলো|জিজ্ঞাসা করলো|উত্তর দিলো|ডেকে বললো|said|asked|replied|shouted)$/i
  );
  if (verbMatch) {
    const candidate = verbMatch[1].replace(/^(তখন|হঠাৎ|এরপর|তারপর)$/i, '').trim();
    const cue = (verbMatch[2] || '').trim();
    if (candidate && !isInstructionPrefix(candidate)) {
      return { speaker: candidate, cue };
    }
  }

  return { speaker: 'ডায়ালগ', cue: '' };
}

/**
 * Automatically extracts Dialogues, Characters, Scenes, and Basic Instructions
 * from any complete A-to-Z script (plain text OR Markdown formatted)!
 */
export function extractSmartBreakdown(rawText = '') {
  const text = String(rawText || '').trim();
  if (!text) {
    return {
      dialogues: [],
      instructions: [],
      characters: [],
      scenes: [],
      totalWords: 0,
      extractedWords: 0,
      isSoloMode: false,
    };
  }

  const lines = text.split('\n');
  const dialogues = [];
  const instructions = [];
  const scenes = [];
  const characterCounts = new Map();

  let currentScene = 'শুরু / দৃশ্য ১';

  const addCharacter = (name) => {
    if (!name || name === 'ডায়ালগ' || name === 'ভয়েসওভার / কথা') return;
    characterCounts.set(name, (characterCounts.get(name) || 0) + 1);
  };

  const addInstruction = (kind, content, sceneName) => {
    const clean = stripMarkdownLine(content)
      .replace(/^[:：\-–—]+\s*/, '')
      .trim();
    if (!clean || clean.length < 2) return;
    if (instructions.length > 0 && instructions[instructions.length - 1].text === clean) return;
    instructions.push({
      id: `inst_${instructions.length + 1}`,
      kind, // 'scene' | 'camera' | 'action'
      text: clean,
      scene: sceneName,
    });
  };

  const soloCandidateLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawTrimmed = lines[i].trim();
    if (!rawTrimmed || /^[-–—=*_]{3,}$/.test(rawTrimmed)) continue;

    const isMarkdownHeading = /^#+\s+/.test(rawTrimmed);
    const cleanLine = stripMarkdownLine(rawTrimmed);
    if (!cleanLine) continue;

    // Cast mapping bullet e.g. "* সোহেল → সুমন"
    if (/[→⇒]/.test(cleanLine) && cleanLine.split(/\s+/).length <= 8) {
      addInstruction('action', `চরিত্র: ${cleanLine}`, currentScene);
      continue;
    }

    // 1. Check Scene Heading or Markdown Heading
    if (SCENE_HEADING_REGEX.test(cleanLine)) {
      currentScene = cleanLine;
      scenes.push(cleanLine);
      addInstruction('scene', cleanLine, currentScene);
      continue;
    }

    if (isMarkdownHeading) {
      addInstruction('scene', cleanLine, currentScene);
      continue;
    }

    // 2. Pure Bracketed or Parenthetical Instruction Line: [ ... ] or ( ... )
    const pureBracket = cleanLine.match(/^(?:\[([^\]]+)\]|\(([^)]+)\))$/);
    if (pureBracket) {
      const inner = (pureBracket[1] || pureBracket[2] || '').trim();
      addInstruction(
        INSTRUCTION_SENTENCE_REGEX.test(inner) ? 'camera' : 'action',
        inner,
        currentScene
      );
      continue;
    }

    // 3. Check Prefix: Value line ("সুমন: ..." OR "লোকেশন: ..." OR "শট ১: ...")
    const prefixMatch = cleanLine.match(/^([^\n:ঃ—–\-]{1,28})\s*[:ঃ]\s*(.*)$/);
    if (prefixMatch) {
      const rawPrefix = prefixMatch[1].trim();
      const rest = prefixMatch[2].trim();

      if (isInstructionPrefix(rawPrefix)) {
        const isSceneKw = /^(দৃশ্য|সিন|পর্ব|scene|part)/i.test(rawPrefix);
        if (isSceneKw && rest) {
          currentScene = `${rawPrefix}: ${rest}`;
          scenes.push(currentScene);
        }
        if (rest) {
          addInstruction(
            isSceneKw
              ? 'scene'
              : /^(ক্যামেরা|শট|লাইটিং|সাউন্ড|মিউজিক|বি-?রোল|camera|shot|lighting|sfx|music|b-?roll)/i.test(
                    rawPrefix
                  )
                ? 'camera'
                : 'action',
            `${rawPrefix}: ${rest}`,
            currentScene
          );
        }
        continue;
      }

      const prefixWords = rawPrefix.split(/\s+/).filter(Boolean);
      if (prefixWords.length <= 4 && rest) {
        const inlineCues = [];
        const cleanSpoken = rest
          .replace(/\[([^\]]+)\]|\(([^)]+)\)/g, (_, b1, b2) => {
            const c = (b1 || b2 || '').trim();
            if (c) inlineCues.push(c);
            return ' ';
          })
          .replace(/^["“”']+|["“”']+$/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        const cueText = inlineCues.join(', ');
        if (cueText && cueText.length > 12) {
          addInstruction('action', `${rawPrefix} — ${cueText}`, currentScene);
        }

        if (cleanSpoken) {
          addCharacter(rawPrefix);
          dialogues.push({
            id: `dlg_${dialogues.length + 1}`,
            speaker: rawPrefix,
            cue: cueText,
            text: cleanSpoken,
            scene: currentScene,
          });
        }
        continue;
      }
    }

    // 4. Extract inline [bracket instructions] from narrative paragraphs
    const bracketMatches = [...cleanLine.matchAll(/\[([^\]]+)\]/g)];
    for (const bm of bracketMatches) {
      if (bm[1]?.trim()) {
        addInstruction(
          INSTRUCTION_SENTENCE_REGEX.test(bm[1]) ? 'camera' : 'action',
          bm[1].trim(),
          currentScene
        );
      }
    }

    // 5. Quoted Dialogues inside narrative paragraph: "..." or “...”
    const quoteRegex = /["“]([^"”]{2,})["”]/g;
    const quoteMatches = [...cleanLine.matchAll(quoteRegex)];
    if (quoteMatches.length > 0) {
      let lastEnd = 0;
      for (const qm of quoteMatches) {
        const before = cleanLine.slice(lastEnd, qm.index);
        const { speaker, cue } = inferSpeakerBeforeQuote(before);
        const spokenText = qm[1].trim();
        if (spokenText) {
          addCharacter(speaker);
          dialogues.push({
            id: `dlg_${dialogues.length + 1}`,
            speaker,
            cue,
            text: spokenText,
            scene: currentScene,
          });
        }
        lastEnd = qm.index + qm[0].length;
      }

      const withoutQuotes = cleanLine
        .replace(quoteRegex, ' ')
        .replace(/\[[^\]]*\]/g, ' ')
        .trim();
      const sentences = withoutQuotes.split(/[।.!?]+/).map((s) => s.trim()).filter(Boolean);
      for (const s of sentences) {
        if (INSTRUCTION_SENTENCE_REGEX.test(s)) {
          addInstruction('camera', s, currentScene);
        }
      }
      continue;
    }

    // 6. Plain paragraph line
    const strippedLine = cleanLine.replace(/\[[^\]]*\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!strippedLine) continue;

    if (INSTRUCTION_SENTENCE_REGEX.test(strippedLine) && strippedLine.split(/\s+/).length <= 28) {
      addInstruction('camera', strippedLine, currentScene);
    } else {
      soloCandidateLines.push({
        text: strippedLine,
        scene: currentScene,
      });
    }
  }

  let isSoloMode = false;
  if (dialogues.length === 0 && soloCandidateLines.length > 0) {
    isSoloMode = true;
    for (const item of soloCandidateLines) {
      const cues = [];
      const cleanSpoken = item.text
        .replace(/\(([^)]+)\)/g, (_, p1) => {
          if (p1?.trim()) cues.push(p1.trim());
          return ' ';
        })
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (cues.length > 0) {
        addInstruction('action', cues.join(', '), item.scene);
      }

      if (cleanSpoken) {
        dialogues.push({
          id: `dlg_${dialogues.length + 1}`,
          speaker: 'ভয়েসওভার / কথা',
          cue: cues.join(', '),
          text: cleanSpoken,
          scene: item.scene,
        });
      }
    }
  } else if (dialogues.length > 0 && soloCandidateLines.length > 0) {
    for (const item of soloCandidateLines) {
      const shortSummary =
        item.text.length > 140 ? `${item.text.slice(0, 137).trim()}...` : item.text;
      addInstruction('action', shortSummary, item.scene);
    }
  }

  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const extractedWords = dialogues.reduce(
    (sum, d) => sum + d.text.split(/\s+/).filter(Boolean).length,
    0
  );

  const characters = [...characterCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    dialogues,
    instructions,
    characters,
    scenes,
    totalWords,
    extractedWords,
    isSoloMode,
  };
}

/**
 * Normalizes Markdown, colons, brackets, arrows, and emojis into natural spoken Bangla
 * so TTS pronounces every line fluently!
 */
export function prepareTextForBanglaTTS(rawText = '') {
  if (!rawText) return '';

  const lines = String(rawText)
    .replace(/\bS\.F\.R\b/gi, 'এস এফ আর')
    .replace(/\bBGM\b/gi, 'ব্যাকগ্রাউন্ড মিউজিক')
    .split('\n');

  const spokenLines = [];

  for (const raw of lines) {
    const rawTrimmed = raw.trim();
    if (!rawTrimmed || /^[-–—=*_]{3,}$/.test(rawTrimmed)) continue;

    const isHeading = /^#+\s+/.test(rawTrimmed);
    let line = stripMarkdownLine(rawTrimmed);
    if (!line) continue;

    // Cast arrow e.g. "সোহেল → সুমন"
    if (/[→⇒]/.test(line)) {
      line = line.replace(/\s*[→⇒]\s*/g, ' চরিত্রে ');
      spokenLines.push(`${line}${/[।.!?]$/.test(line) ? '' : '।'}`);
      continue;
    }

    // Pure bracketed instruction line: [ক্যামেরা: ক্লোজআপ]
    const fullBracket = line.match(/^(?:\[(.+)\]|【(.+)】)$/);
    if (fullBracket) {
      const inner = (fullBracket[1] || fullBracket[2] || '').replace(/[:ঃ]/g, ', ').trim();
      if (inner) spokenLines.push(`${inner}${/[।.!?]$/.test(inner) ? '' : '।'}`);
      continue;
    }

    // Markdown headings e.g. "# ওয়েব সিরিজ: পাক্কা খেলোয়াড়" or "## দৃশ্য ১: হুক"
    if (isHeading) {
      const cleanHead = line.replace(/[:ঃ—–]/g, ', ').replace(/\s{2,}/g, ' ').trim();
      spokenLines.push(`${cleanHead}${/[।.!?]$/.test(cleanHead) ? '' : '।'}`);
      continue;
    }

    // Speaker: (cue) dialogue  OR  Metadata: value
    const prefixMatch = line.match(/^([^\n:ঃ()[\]]{1,28})\s*[:ঃ]\s*(.*)$/);
    if (prefixMatch) {
      const label = prefixMatch[1].trim();
      let rest = prefixMatch[2].trim();
      if (!rest) {
        spokenLines.push(`${label}।`);
        continue;
      }

      if (isInstructionPrefix(label)) {
        spokenLines.push(`${label}, ${rest}${/[।.!?]$/.test(rest) ? '' : '।'}`);
        continue;
      }

      let cue = '';
      const cueMatch = rest.match(/^\(([^)]{1,45})\)\s*(.+)$/);
      if (cueMatch) {
        cue = cueMatch[1].trim();
        rest = cueMatch[2].trim();
      }

      rest = rest
        .replace(/\[([^\]]+)\]/g, ' ($1) ')
        .replace(/^["“”']+|["“”']+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (cue) {
        spokenLines.push(`${label} ${cue} বলছে, ${rest}${/[।.!?]$/.test(rest) ? '' : '।'}`);
      } else {
        spokenLines.push(`${label} বলছে, ${rest}${/[।.!?]$/.test(rest) ? '' : '।'}`);
      }
      continue;
    }

    line = line
      .replace(/\[([^\]]+)\]/g, ', $1, ')
      .replace(/^["“”']+|["“”']+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (line) {
      spokenLines.push(`${line}${/[।.!?]$/.test(line) ? '' : '।'}`);
    }
  }

  return spokenLines.join('\n');
}

export function buildSpeechChunks(text = '', maxLen = 145) {
  const clean = prepareTextForBanglaTTS(text);
  if (!clean) return [];

  const rawSentences = (clean.match(/[^।.!?\n]+[।.!?\n]*/g) || [clean])
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
    } else {
      const parts = (sentence.match(/[^,，;—–]+[,，;—–]*/g) || [sentence])
        .map((p) => p.trim())
        .filter(Boolean);
      let buffer = '';
      for (const p of parts) {
        if ((buffer + ' ' + p).trim().length <= maxLen) {
          buffer = (buffer ? `${buffer} ${p}` : p).trim();
        } else {
          if (buffer) chunks.push(buffer);
          if (p.length <= maxLen) {
            buffer = p.trim();
          } else {
            const words = p.split(/\s+/);
            let wBuf = '';
            for (const w of words) {
              if ((wBuf + ' ' + w).trim().length <= maxLen - 5) {
                wBuf = (wBuf ? `${wBuf} ${w}` : w).trim();
              } else {
                if (wBuf) chunks.push(wBuf);
                wBuf = w;
              }
            }
            buffer = wBuf;
          }
        }
      }
      if (buffer) chunks.push(buffer);
    }
  }

  return chunks;
}
