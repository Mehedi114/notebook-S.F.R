import React, { useMemo, useRef, useState } from 'react';
import { Copy, Check, ZoomIn, ZoomOut, Sparkles, PenTool } from 'lucide-react';
import { extractSmartBreakdown } from '../lib/smartExtractor';

function cleanMdInline(str = '') {
  return String(str || '').replace(/\*\*|__/g, '').trim();
}

function renderFormattedMasterScript(text = '', fontSize = 18) {
  const lines = String(text || '').split('\n');
  return lines.map((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return <div key={idx} className="h-3" />;
    }

    if (/^[-–—=*_]{3,}$/.test(trimmed)) {
      return <hr key={idx} className="my-5 border-zinc-200 dark:border-zinc-800" />;
    }

    const strippedHead = cleanMdInline(trimmed.replace(/^#+\s*/, ''));

    // Scene or Episode Heading
    if (
      /^#+\s+/.test(trimmed) ||
      /^(?:⏱\s*)?(?:দৃশ্য|সিন|পর্ব|scene|part)\s*[০-৯0-9#]+/i.test(strippedHead)
    ) {
      return (
        <div
          key={idx}
          className="mt-5 mb-2.5 px-3.5 py-2 rounded-xl bg-[#FF6B00]/12 border-l-4 border-[#FF6B00] font-script font-extrabold text-sm sm:text-base text-[#FF6B00]"
        >
          {strippedHead}
        </div>
      );
    }

    // Pure Bracketed Instruction Line [ ... ] or ( ... )
    if (/^(?:\[.+\]|\(.+\))$/.test(strippedHead)) {
      return (
        <div
          key={idx}
          className="my-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 font-script text-xs sm:text-sm text-cyan-700 dark:text-cyan-300"
        >
          🎥 {strippedHead}
        </div>
      );
    }

    // Speaker: Dialogue OR Metadata: Value
    const cleanLine = cleanMdInline(trimmed.replace(/^\s*[*•]\s+/, '• '));
    const speakerMatch = cleanLine.match(/^([^\n:ঃ]{1,26}[:ঃ])\s*(.+)$/);
    if (speakerMatch) {
      return (
        <p
          key={idx}
          style={{ fontSize: `${fontSize}px` }}
          className="my-2 font-script leading-[1.9] text-zinc-900 dark:text-zinc-100"
        >
          <strong className="text-[#FF6B00] font-extrabold mr-1.5">{speakerMatch[1]}</strong>
          <span>{speakerMatch[2]}</span>
        </p>
      );
    }

    return (
      <p
        key={idx}
        style={{ fontSize: `${fontSize}px` }}
        className="my-2 font-script leading-[1.9] text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap"
      >
        {cleanLine}
      </p>
    );
  });
}

export default function MasterScriptView({
  fullText = '',
  isCreatorMode,
  onToggleEdit,
  onChangeFullText,
  onSwitchToShortExtract,
}) {
  const [fontSize, setFontSize] = useState(18);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const detectedCharacters = useMemo(() => {
    const bd = extractSmartBreakdown(fullText);
    return bd.characters.slice(0, 6).map((c) => c.name);
  }, [fullText]);

  const insertSnippet = (snippet) => {
    const el = textareaRef.current;
    if (!el) {
      onChangeFullText(`${fullText}${fullText.endsWith('\n') || !fullText ? '' : '\n'}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? fullText.length;
    const end = el.selectionEnd ?? fullText.length;
    const before = fullText.slice(0, start);
    const after = fullText.slice(end);
    const next = `${before}${snippet}${after}`;
    onChangeFullText(next);
    setTimeout(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    }, 20);
  };

  const handleCopyFull = async () => {
    if (!fullText.trim()) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('স্ক্রিপ্ট কপি করুন:', fullText);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-7 py-4 sm:py-6 space-y-4 print-container">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-4 rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200/85 dark:border-zinc-800/90 no-print">
        {isCreatorMode ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="font-script text-[11px] text-zinc-400 shrink-0 mr-1">কুইক ট্যাগ:</span>
            <button
              type="button"
              onClick={() => insertSnippet('\nদৃশ্য ১ - ')}
              className="px-2.5 py-1 rounded-lg bg-orange-500/12 text-[#FF6B00] font-script font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              + দৃশ্য
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n[ক্যামেরা: ]')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/12 text-cyan-600 dark:text-cyan-300 font-script font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              + নির্দেশনা
            </button>
            {detectedCharacters.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => insertSnippet(`\n${ch}: `)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-script font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                + {ch}:
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onSwitchToShortExtract}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B00]/12 text-[#FF6B00] font-script font-bold text-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>সময় কম? শুধু ডায়ালগ ও মূল নির্দেশনা দেখুন →</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {onToggleEdit && (
            <button
              type="button"
              onClick={() => onToggleEdit(!isCreatorMode)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-script font-bold text-xs cursor-pointer ${
                isCreatorMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#FF6B00] text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isCreatorMode ? 'পড়ার মোড' : 'এডিট করুন'}</span>
            </button>
          )}

          <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0D1017]">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="ছোট লেখা"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono-code text-zinc-400">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="বড় লেখা"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyFull}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-script font-semibold text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-[#131720] border border-zinc-200/85 dark:border-zinc-800/90 shadow-xs p-4 sm:p-8">
        {isCreatorMode ? (
          <textarea
            ref={textareaRef}
            value={fullText}
            onChange={(e) => onChangeFullText(e.target.value)}
            style={{ fontSize: `${fontSize}px` }}
            rows={Math.max(14, fullText.split('\n').length + 4)}
            placeholder={`এখানে একদম শুরু থেকে শেষ (A to Z) পুরো স্ক্রিপ্ট লিখুন বা পেস্ট করুন...\n\nউদাহরণ:\nদৃশ্য ১ - রংপুরের চায়ের দোকান\n[ক্যামেরা: সবার গ্রুপ শট থেকে সুমনের ক্লোজ-আপ]\nসুমন: ভাই শোন, আজকে দারুণ একটা প্ল্যান আছে!\nমেহেদী: (অবাক হয়ে) কী প্ল্যান তাড়াতাড়ি বল!`}
            className="w-full font-script leading-[1.9] text-zinc-900 dark:text-zinc-50 bg-transparent border-0 focus:outline-none resize-y placeholder:text-zinc-400/75"
          />
        ) : fullText.trim() ? (
          <div>{renderFormattedMasterScript(fullText, fontSize)}</div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="font-script text-sm text-zinc-400 italic">
              এই স্ক্রিপ্টে এখনো কোনো টেক্সট লেখা হয়নি।
            </p>
            {onToggleEdit && (
              <button
                type="button"
                onClick={() => onToggleEdit(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] text-white font-script font-bold text-xs cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>এখনই স্ক্রিপ্ট লিখুন</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
