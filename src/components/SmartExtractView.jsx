import React, { useMemo, useState } from 'react';
import {
  Zap,
  MessageCircle,
  Clapperboard,
  Volume2,
  Copy,
  Check,
  Users,
  Camera,
  MapPin,
} from 'lucide-react';
import { extractSmartBreakdown } from '../lib/smartExtractor';

export default function SmartExtractView({ fullText = '', onListenShort }) {
  const [selectedCharacter, setSelectedCharacter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('both'); // 'both' | 'dialogues' | 'instructions'
  const [copied, setCopied] = useState(false);

  const breakdown = useMemo(() => extractSmartBreakdown(fullText), [fullText]);

  const visibleDialogues = useMemo(() => {
    if (selectedCharacter === 'all') return breakdown.dialogues;
    return breakdown.dialogues.filter((d) => d.speaker === selectedCharacter);
  }, [breakdown.dialogues, selectedCharacter]);

  const handleCopyShort = async () => {
    const lines = [];
    if (breakdown.instructions.length > 0) {
      lines.push('=== মূল নির্দেশনা ===');
      breakdown.instructions.forEach((inst, i) => lines.push(`${i + 1}. ${inst.text}`));
      lines.push('');
    }
    if (visibleDialogues.length > 0) {
      lines.push('=== ডায়ালগসমূহ ===');
      visibleDialogues.forEach((d) => {
        const cueStr = d.cue ? ` (${d.cue})` : '';
        lines.push(`${d.speaker}${cueStr}: ${d.text}`);
      });
    }
    const out = lines.join('\n');
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('কপি করুন:', out);
    }
  };

  if (!fullText.trim()) {
    return (
      <div className="max-w-4xl mx-auto px-3.5 sm:px-7 py-10 text-center">
        <p className="font-script text-sm text-zinc-400">
          মেইন স্ক্রিপ্টে লেখা যোগ করলেই সিস্টেম অটোমেটিক ডায়ালগ ও মূল নির্দেশনা আলাদা করে এখানে দেখাবে!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-7 py-4 sm:py-6 space-y-5 print-container">
      {/* Smart Summary Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#FF6B00]/15 via-orange-500/8 to-transparent border border-[#FF6B00]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FF6B00]">
            <Zap className="w-4 h-4 fill-current" />
            <span className="font-script">স্মার্ট অটো-এক্সট্রাক্ট (সময় বাঁচানোর শর্ট ভিউ)</span>
          </div>
          <p className="font-script text-xs text-zinc-600 dark:text-zinc-300">
            পুরো স্ক্রিপ্ট (<strong>{breakdown.totalWords}</strong> শব্দ) থেকে সিস্টেম নিজে থেকেই{' '}
            <strong>{breakdown.dialogues.length}টি ডায়ালগ</strong> ও{' '}
            <strong>{breakdown.instructions.length}টি মূল নির্দেশনা</strong> আলাদা করে এনেছে।
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={onListenShort}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-script font-bold text-xs shadow-sm shadow-orange-500/25 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>শর্ট ভয়েস শুনুন</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShort}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#161B26] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-script font-semibold text-xs cursor-pointer"
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

      {/* Sub-Filter: Both | Only Dialogues | Only Basic Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="inline-flex rounded-xl bg-zinc-200/70 dark:bg-[#141822] p-1 border border-zinc-300/40 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSectionFilter('both')}
            className={`px-3 py-1.5 rounded-lg font-script text-xs font-bold transition cursor-pointer ${
              sectionFilter === 'both'
                ? 'bg-white dark:bg-[#222838] text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            ডায়ালগ + নির্দেশনা
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('dialogues')}
            className={`px-3 py-1.5 rounded-lg font-script text-xs font-bold transition cursor-pointer ${
              sectionFilter === 'dialogues'
                ? 'bg-white dark:bg-[#222838] text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            শুধু ডায়ালগ ({breakdown.dialogues.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('instructions')}
            className={`px-3 py-1.5 rounded-lg font-script text-xs font-bold transition cursor-pointer ${
              sectionFilter === 'instructions'
                ? 'bg-white dark:bg-[#222838] text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            শুধু নির্দেশনা ({breakdown.instructions.length})
          </button>
        </div>
      </div>

      {/* 1. Basic Instructions Card */}
      {(sectionFilter === 'both' || sectionFilter === 'instructions') && (
        <section className="rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200/85 dark:border-zinc-800/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-cyan-500" />
            <h3 className="font-script font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              মূল শুটিং ও অ্যাকশন নির্দেশনা ({breakdown.instructions.length})
            </h3>
          </div>

          {breakdown.instructions.length === 0 ? (
            <p className="font-script text-xs text-zinc-400 italic">
              স্ক্রিপ্টে আলাদা কোনো ব্র্যাকেট বা ক্যামেরা নির্দেশনা দেওয়া হয়নি—সরাসরি নিচের ডায়ালগ দেখুন।
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {breakdown.instructions.map((inst) => (
                <div
                  key={inst.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-script leading-relaxed ${
                    inst.kind === 'scene'
                      ? 'bg-orange-500/8 border-orange-500/25 text-orange-800 dark:text-orange-200 sm:col-span-2 font-bold'
                      : inst.kind === 'camera'
                        ? 'bg-cyan-500/8 border-cyan-500/20 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-50 dark:bg-[#181D29] border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200'
                  }`}
                >
                  {inst.kind === 'scene' ? (
                    <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                  ) : (
                    <Camera className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  )}
                  <span>{inst.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Extracted Dialogues Card (With Character Filter!) */}
      {(sectionFilter === 'both' || sectionFilter === 'dialogues') && (
        <section className="rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200/85 dark:border-zinc-800/90 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="font-script font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                শুধু ডায়ালগসমূহ ({visibleDialogues.length})
              </h3>
            </div>

            {/* Character Filter Pills */}
            {breakdown.characters.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar no-print">
                <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => setSelectedCharacter('all')}
                  className={`px-2.5 py-1 rounded-full font-script text-xs font-bold whitespace-nowrap cursor-pointer ${
                    selectedCharacter === 'all'
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-zinc-100 dark:bg-[#181D29] text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  সবাই
                </button>
                {breakdown.characters.map((ch) => (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={() =>
                      setSelectedCharacter(selectedCharacter === ch.name ? 'all' : ch.name)
                    }
                    className={`px-2.5 py-1 rounded-full font-script text-xs font-bold whitespace-nowrap cursor-pointer ${
                      selectedCharacter === ch.name
                        ? 'bg-[#FF6B00] text-white'
                        : 'bg-zinc-100 dark:bg-[#181D29] text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {ch.name} ({ch.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {visibleDialogues.length === 0 ? (
            <p className="font-script text-xs text-zinc-400 italic">কোনো ডায়ালগ পাওয়া যায়নি।</p>
          ) : (
            <div className="space-y-2.5">
              {visibleDialogues.map((d, idx) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-[#171C28] border border-zinc-200/70 dark:border-zinc-800/80 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-[11px] text-zinc-400">
                        #{idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] font-script font-extrabold text-xs">
                        {d.speaker}
                      </span>
                      {d.cue && (
                        <span className="font-script text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                          ({d.cue})
                        </span>
                      )}
                    </div>
                    {d.scene && (
                      <span className="font-script text-[10px] text-zinc-400 truncate max-w-[180px]">
                        {d.scene}
                      </span>
                    )}
                  </div>

                  <p className="font-script text-[17px] sm:text-lg leading-[1.8] text-zinc-900 dark:text-zinc-50 pt-0.5">
                    {d.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
