import React from 'react';
import { Home, Plus, Volume2, MessageSquare, Zap } from 'lucide-react';

export default function MobileBottomNav({
  mobileView,
  activeTab,
  hasActiveScript,
  unresolvedCount = 0,
  voiceOpen,
  onGoHome,
  onGoSmartShort,
  onStartWrite,
  onToggleVoice,
  onOpenComments,
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0D1017]/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800/90 pb-safe no-print">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {/* 1. Scripts Home */}
        <button
          type="button"
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer ${
            mobileView === 'list' ? 'text-[#FF6B00]' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-script text-[10px] font-bold">স্ক্রিপ্ট</span>
        </button>

        {/* 2. Smart Short Extract (Only Dialogues + Basic Instructions) */}
        <button
          type="button"
          disabled={!hasActiveScript}
          onClick={onGoSmartShort}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 disabled:opacity-35 cursor-pointer ${
            mobileView === 'detail' && activeTab === 'smart'
              ? 'text-[#FF6B00]'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="font-script text-[10px] font-bold">শর্ট ডায়ালগ</span>
        </button>

        {/* 3. Center Floating Add Script Button (No Password!) */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onStartWrite}
            aria-label="Add new script"
            className="w-12 h-12 -mt-4 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-orange-400 text-white shadow-lg shadow-orange-500/35 flex items-center justify-center active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.6]" />
          </button>
        </div>

        {/* 4. Bangla Voice Reader */}
        <button
          type="button"
          disabled={!hasActiveScript}
          onClick={onToggleVoice}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 disabled:opacity-35 cursor-pointer ${
            voiceOpen ? 'text-[#FF6B00]' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Volume2 className="w-5 h-5" />
          <span className="font-script text-[10px] font-bold">বাংলা ভয়েস</span>
        </button>

        {/* 5. Team Comments */}
        <button
          type="button"
          disabled={!hasActiveScript}
          onClick={onOpenComments}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1 text-zinc-500 dark:text-zinc-400 disabled:opacity-35 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-script text-[10px] font-bold">মন্তব্য</span>
          {unresolvedCount > 0 && (
            <span className="absolute top-0.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#FF6B00] text-white text-[9px] font-extrabold flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
