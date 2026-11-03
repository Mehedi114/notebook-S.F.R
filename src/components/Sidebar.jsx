import React from 'react';
import {
  Plus,
  Search,
  Pin,
  MessageSquare,
  Youtube,
  ExternalLink,
  X,
  Clock,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { PLATFORMS, SCRIPT_STATUSES, SFR_CHANNEL_LINKS } from '../lib/constants';
import { formatHumanDuration, formatRelativeTime } from '../lib/scriptUtils';

export default function Sidebar({
  studio,
  memberIdentity,
  onEditIdentity,
  folders,
  scripts,
  selectedScriptId,
  onSelectScript,
  selectedFolderId,
  onSelectFolder,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onStartWrite,
  mobileVisible,
  theme,
  onToggleTheme,
  onOpenSettings,
  liveConnected,
}) {
  const statusMap = Object.fromEntries(SCRIPT_STATUSES.map((s) => [s.id, s]));
  const platformMap = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
  const channelUrl = studio.youtubeChannelUrl || SFR_CHANNEL_LINKS[0].url;

  return (
    <aside
      className={`${
        mobileVisible ? 'flex' : 'hidden'
      } lg:flex flex-col h-full w-full lg:w-[380px] xl:w-[410px] shrink-0 bg-[#F7F5F0] dark:bg-[#0B0D13] lg:border-r border-zinc-200/80 dark:border-zinc-800/80 select-none no-print`}
    >
      <div className="p-3.5 sm:p-4 space-y-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Member Chip + Settings/Theme */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEditIdentity}
            title="নাম পরিবর্তন করুন"
            className="flex items-center gap-2 min-w-0 px-2.5 py-1.5 rounded-full bg-white dark:bg-[#151924] border border-zinc-200/90 dark:border-zinc-800 hover:border-orange-500/50 transition cursor-pointer"
          >
            <img
              src="/brand/sfr-logo.png"
              alt="S.F.R"
              className="w-6 h-6 rounded-full object-cover ring-1 ring-[#FF6B00]"
            />
            <span className="font-script text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
              {memberIdentity?.name || 'Sumon'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-[#FF6B00] font-semibold">
              {memberIdentity?.role || 'Member'}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              Live
            </span>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-full bg-white dark:bg-[#151924] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-300 cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-full bg-white dark:bg-[#151924] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Sumon From Rangpur Official Banner + YouTube Channel Buttons */}
        <div className="rounded-2xl overflow-hidden bg-[#0E0B0B] border border-orange-500/30 shadow-md">
          <div className="bg-black pt-1.5 px-2 text-center">
            <img
              src="/brand/sfr-banner.png"
              alt="SUMON FROM RANGPUR"
              width="450"
              height="56"
              className="w-full h-16 sm:h-20 object-contain object-bottom mx-auto"
            />
            <div className="pb-1.5 pt-0.5 font-extrabold text-[13px] sm:text-sm tracking-[0.22em] text-white uppercase">
              SUMON FROM RANGPUR
            </div>
          </div>

          <div className="p-3 bg-gradient-to-b from-[#11141E] to-[#0C0E15] border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold tracking-wide text-white truncate">
                  {studio.studioName || 'SUMON FROM RANGPUR'}
                </p>
                <p className="font-script text-[11px] text-orange-300/90 truncate">
                  অফিশিয়াল ইউটিউব স্ক্রিপ্ট নোটবুক
                </p>
              </div>
              <button
                type="button"
                onClick={onStartWrite}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/30 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="font-script">নতুন স্ক্রিপ্ট</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold whitespace-nowrap transition"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span className="font-script">YouTube চ্যানেল</span>
              </a>

              <a
                href={`${channelUrl.replace(/\/$/, '')}/videos`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-[11px] font-semibold whitespace-nowrap transition"
              >
                <span>Videos</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>

              <a
                href={`${channelUrl.replace(/\/$/, '')}/shorts`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-[11px] font-semibold whitespace-nowrap transition"
              >
                <span>Shorts</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>

              <a
                href={`${channelUrl.replace(/\?.*$/, '')}?sub_confirmation=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold whitespace-nowrap transition"
              >
                <span>Subscribe</span>
              </a>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="স্ক্রিপ্টের নাম বা লেখকের নাম খুঁজুন..."
            className="w-full font-script pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#141822] border border-zinc-200/90 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#FF6B00]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category & Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              onSelectFolder(null);
              onSelectStatus('all');
            }}
            className={`px-3 py-1.5 rounded-full font-script text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedFolderId === null && selectedStatus === 'all'
                ? 'bg-[#FF6B00] text-white'
                : 'bg-white dark:bg-[#141822] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
            }`}
          >
            সব স্ক্রিপ্ট ({scripts.length})
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectFolder(selectedFolderId === f.id ? null : f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-script text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedFolderId === f.id
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-white dark:bg-[#141822] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
              <span>{f.name}</span>
            </button>
          ))}

          {SCRIPT_STATUSES.map((st) => (
            <button
              key={st.id}
              onClick={() => onSelectStatus(selectedStatus === st.id ? 'all' : st.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-script text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === st.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white dark:bg-[#141822] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              <span>{st.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Script Cards List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 pb-24 lg:pb-4 space-y-2.5">
        {scripts.length === 0 ? (
          <div className="text-center py-12 px-5 rounded-3xl bg-white/70 dark:bg-[#121620] border border-dashed border-zinc-300 dark:border-zinc-800 my-2">
            <img
              src="/brand/sfr-logo.png"
              alt="S.F.R"
              className="w-14 h-14 rounded-full mx-auto mb-3 ring-2 ring-[#FF6B00]/60 object-cover"
            />
            <p className="font-script text-sm font-bold text-zinc-800 dark:text-zinc-200">
              এখনো কোনো স্ক্রিপ্ট যোগ করা হয়নি
            </p>
            <p className="font-script text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              নতুন ভিডিও বা শর্টসের A-to-Z স্ক্রিপ্ট অ্যাড করলেই টিমের সবাই পড়তে ও ভয়েসে শুনতে পারবে।
            </p>
            <button
              type="button"
              onClick={onStartWrite}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-script text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্ক্রিপ্ট অ্যাড করুন</span>
            </button>
          </div>
        ) : (
          scripts.map((scr) => {
            const active = scr.id === selectedScriptId;
            const st = statusMap[scr.status] || statusMap.ready_for_shoot;
            const pf = platformMap[scr.platform] || PLATFORMS[0];
            const writerInitial = (scr.authorName || 'S').trim().charAt(0).toUpperCase();

            return (
              <button
                key={scr.id}
                type="button"
                onClick={() => onSelectScript(scr.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition active:scale-[0.99] cursor-pointer block ${
                  active
                    ? 'bg-white dark:bg-[#161B26] border-[#FF6B00] ring-1 ring-[#FF6B00]/35 shadow-md shadow-orange-500/5'
                    : 'bg-white dark:bg-[#131720] border-zinc-200/85 dark:border-zinc-800/85 hover:border-orange-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-script text-[10px] font-bold border ${st.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.shortLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <Youtube className={`w-3 h-3 ${pf.color}`} />
                      {pf.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {scr.isPinned && <Pin className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]" />}
                    <span className="text-[11px] text-zinc-400">{formatRelativeTime(scr.updatedAt)}</span>
                  </div>
                </div>

                <h3 className="font-script font-bold text-[15px] sm:text-base leading-snug text-zinc-900 dark:text-zinc-50 line-clamp-2">
                  {scr.title}
                </h3>

                {scr.previewText && (
                  <p className="font-script text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {scr.previewText}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      {writerInitial}
                    </span>
                    <span className="font-script text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                      লিখেছেন: <span className="text-[#FF6B00]">{scr.authorName || 'Sumon'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1 font-mono-code">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {formatHumanDuration(scr.estimatedDurationSec)}
                    </span>
                    {scr.unresolvedCommentCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-[#FF6B00] font-bold text-[10px]">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {scr.unresolvedCommentCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
