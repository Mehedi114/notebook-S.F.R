import React from 'react';
import {
  Pin,
  Copy,
  Trash2,
  Clock,
  FileText,
  BookOpen,
  Zap,
  Volume2,
  Youtube,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { PLATFORMS, SCRIPT_STATUSES } from '../lib/constants';
import { countSpokenWords, formatHumanDuration, formatRelativeTime } from '../lib/scriptUtils';

export default function ScriptHeader({
  script,
  isEditing,
  defaultWpm,
  saveState,
  activeTab,
  onChangeTab,
  voiceOpen,
  onToggleVoice,
  onChangeScriptField,
  onDuplicateScript,
  onDeleteScript,
}) {
  if (!script) return null;

  const fullText = script.fullText || '';
  const effectiveWpm = script.wpmOverride || defaultWpm || 130;
  const totalWords = countSpokenWords(fullText);
  const totalDuration = totalWords > 0 ? Math.max(3, Math.round((totalWords / effectiveWpm) * 60)) : 0;

  const statusObj = SCRIPT_STATUSES.find((s) => s.id === script.status) || SCRIPT_STATUSES[0];
  const platformObj = PLATFORMS.find((p) => p.id === script.platform) || PLATFORMS[0];

  const handlePlatformChange = (nextPlatform) => {
    const pf = PLATFORMS.find((p) => p.id === nextPlatform);
    onChangeScriptField({
      platform: nextPlatform,
      aspectRatio: pf ? pf.aspect : script.aspectRatio,
      folderId: nextPlatform === 'shorts' ? 'fld_reels' : 'fld_youtube',
    });
  };

  const writerInitial = (script.authorName || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#0E1118]/95 px-3.5 sm:px-7 pt-4 pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3 no-print">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <select
              value={script.status}
              onChange={(e) => onChangeScriptField({ status: e.target.value })}
              className={`px-2.5 py-1.5 rounded-xl font-script text-xs font-bold border cursor-pointer focus:outline-none ${statusObj.badge}`}
            >
              {SCRIPT_STATUSES.map((st) => (
                <option
                  key={st.id}
                  value={st.id}
                  className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {st.label}
                </option>
              ))}
            </select>

            <select
              value={script.platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-[#171B26] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 cursor-pointer focus:outline-none"
            >
              {PLATFORMS.map((pf) => (
                <option key={pf.id} value={pf.id}>
                  {pf.label} ({pf.aspect})
                </option>
              ))}
            </select>

            {script.youtubeUrl && !isEditing && (
              <a
                href={script.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white whitespace-nowrap"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span className="font-script">ভিডিও দেখুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mr-1">
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B00]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => onChangeScriptField({ isPinned: !script.isPinned })}
              title="Pin script"
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                script.isPinned
                  ? 'bg-orange-500/15 border-orange-500/40 text-[#FF6B00]'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDuplicateScript}
              title="কপি তৈরি করুন"
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDeleteScript}
              title="ডিলিট করুন"
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Script Title & Optional YouTube Link */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={script.title}
              onChange={(e) => onChangeScriptField({ title: e.target.value })}
              placeholder="ভিডিওর টাইটেল লিখুন..."
              className="w-full font-script text-xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 bg-transparent border-0 focus:outline-none placeholder:text-zinc-400"
            />
            <input
              type="url"
              value={script.youtubeUrl || ''}
              onChange={(e) => onChangeScriptField({ youtubeUrl: e.target.value })}
              placeholder="আপলোডের পর YouTube ভিডিও লিংক এখানে দিতে পারেন (ঐচ্ছিক)..."
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 bg-transparent border-0 focus:outline-none placeholder:text-zinc-500/60"
            />
          </div>
        ) : (
          <h1 className="font-script text-xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
            {script.title}
          </h1>
        )}

        {/* Author + Voice Reader Button + Word/Time Stats */}
        <div className="mt-3.5 p-2.5 sm:px-3.5 rounded-2xl bg-zinc-100/90 dark:bg-[#151924] border border-zinc-200/70 dark:border-zinc-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              {writerInitial}
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-script text-zinc-500 dark:text-zinc-400 shrink-0">লেখক:</span>
                <input
                  type="text"
                  value={script.authorName || ''}
                  onChange={(e) => onChangeScriptField({ authorName: e.target.value })}
                  placeholder="লেখকের নাম"
                  className="font-script font-bold text-[#FF6B00] bg-white dark:bg-[#0D1017] px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 w-28 sm:w-36 focus:outline-none"
                />
              </div>
            ) : (
              <div className="font-script flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-zinc-600 dark:text-zinc-300">
                  ✍️ লিখেছেন: <strong className="text-[#FF6B00]">{script.authorName || 'Sumon'}</strong>
                </span>
                <span className="text-[11px] text-zinc-400">• {formatRelativeTime(script.updatedAt)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <span className="inline-flex items-center gap-1 font-mono-code text-[11px] text-zinc-600 dark:text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
              <strong>{formatHumanDuration(totalDuration)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-mono-code text-[11px] text-zinc-600 dark:text-zinc-300">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <strong>{totalWords}w</strong>
            </span>

            <button
              type="button"
              onClick={onToggleVoice}
              className={`no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-script font-bold text-xs transition cursor-pointer ${
                voiceOpen
                  ? 'bg-[#FF6B00] text-white shadow-sm shadow-orange-500/30'
                  : 'bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/30'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{voiceOpen ? 'ভয়েস চালু' : 'বাংলা ভয়েস'}</span>
            </button>
          </div>
        </div>

        {/* Two Smart Reading Tabs */}
        <div className="grid grid-cols-2 gap-1 mt-3.5 no-print">
          <button
            type="button"
            onClick={() => onChangeTab('master')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'master'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="font-script truncate">সম্পূর্ণ স্ক্রিপ্ট (A–Z)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('smart')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'smart'
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span className="font-script truncate">শুধু ডায়ালগ ও নির্দেশনা</span>
          </button>
        </div>
      </div>
    </div>
  );
}
