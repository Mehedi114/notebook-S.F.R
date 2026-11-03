import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  PenTool,
  Tv,
  Share2,
  Printer,
  MessageSquare,
  Moon,
  Sun,
  Settings,
  Check,
  Plus,
} from 'lucide-react';

export default function TopBar({
  memberIdentity,
  onEditIdentity,
  isEditing,
  onToggleEditing,
  onStartWrite,
  activeScript,
  onBackToFeed,
  onOpenTeleprompter,
  onToggleComments,
  commentsOpen,
  theme,
  onToggleTheme,
  onOpenSettings,
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = async () => {
    if (!activeScript) return;
    const url = new URL(window.location.href);
    url.searchParams.set('s', activeScript.shareSlug);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      window.prompt('শেয়ার লিংক কপি করুন:', url.toString());
    }
  };

  const unresolvedCount = activeScript?.comments
    ? activeScript.comments.filter((c) => !c.isResolved).length
    : activeScript?.unresolvedCommentCount || 0;

  return (
    <header className="h-14 shrink-0 px-3 sm:px-5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-[#FAF8F5]/95 dark:bg-[#0B0D13]/95 backdrop-blur-md flex items-center justify-between gap-2 no-print z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onBackToFeed}
          className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 text-xs font-bold active:scale-95 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
          <span className="font-script">তালিকা</span>
        </button>

        {activeScript ? (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-200/75 dark:bg-[#161A24] border border-zinc-300/50 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onToggleEditing(false)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-script text-xs font-bold transition cursor-pointer ${
                !isEditing
                  ? 'bg-white dark:bg-[#222838] text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>পড়ুন</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleEditing(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-script text-xs font-bold transition cursor-pointer ${
                isEditing
                  ? 'bg-[#FF6B00] text-white shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>এডিট</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartWrite}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF6B00] text-white font-script text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন স্ক্রিপ্ট</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {activeScript && (
          <>
            <button
              type="button"
              onClick={onOpenTeleprompter}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-orange-600 text-white shadow-xs shadow-orange-500/20 transition cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Prompter</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#161A24] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden md:inline-flex items-center justify-center p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleComments}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                commentsOpen
                  ? 'bg-[#FF6B00]/15 text-[#FF6B00] border-[#FF6B00]/40'
                  : 'bg-white dark:bg-[#161A24] text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes</span>
              {unresolvedCount > 0 && (
                <span className="px-1.5 rounded-full text-[10px] bg-[#FF6B00] text-white font-bold">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onEditIdentity}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#161A24] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer"
        >
          <img src="/brand/sfr-logo.png" alt="" className="w-4 h-4 rounded-full object-cover" />
          <span className="font-script truncate max-w-[90px]">{memberIdentity?.name || 'Sumon'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
