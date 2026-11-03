import React, { useEffect, useState } from 'react';
import { X, Send, CheckCircle2, Trash2, MessageSquare } from 'lucide-react';
import { TEAM_ROLES } from '../lib/constants';
import { formatRelativeTime } from '../lib/scriptUtils';

export default function TeamCommentsDrawer({
  open,
  onClose,
  comments = [],
  memberIdentity,
  isCreatorMode,
  onAddComment,
  onToggleResolve,
  onDeleteComment,
}) {
  const [authorName, setAuthorName] = useState(memberIdentity?.name || '');
  const [authorRole, setAuthorRole] = useState(memberIdentity?.role || TEAM_ROLES[1]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (memberIdentity?.name) setAuthorName(memberIdentity.name);
    if (memberIdentity?.role) setAuthorRole(memberIdentity.role);
  }, [memberIdentity]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment({
        authorName: authorName.trim(),
        authorRole,
        content: content.trim(),
      });
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/65 backdrop-blur-xs no-print">
      <div className="w-full max-w-md h-full bg-white dark:bg-[#11151E] border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-script font-bold text-sm text-zinc-900 dark:text-zinc-100">
              টিম নোট ও ফিডব্যাক ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="font-script text-sm font-medium text-zinc-600 dark:text-zinc-300">
                এখনো কোনো মন্তব্য নেই
              </p>
              <p className="font-script text-xs text-zinc-400 mt-1">
                শুটিং বা ডায়ালগ নিয়ে কোনো পরামর্শ থাকলে নিচে লিখে পাঠান।
              </p>
            </div>
          ) : (
            comments.map((c) => {
              const resolved = Boolean(c.isResolved);
              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    resolved
                      ? 'bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-65'
                      : 'bg-zinc-50 dark:bg-[#171C28] border-zinc-200/80 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-script font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-[#FF6B00] font-semibold">
                          {c.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{formatRelativeTime(c.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleResolve(c.id, !resolved)}
                        className={`p-1 rounded-md cursor-pointer ${
                          resolved ? 'text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      {isCreatorMode && (
                        <button
                          onClick={() => onDeleteComment(c.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-script text-sm text-zinc-800 dark:text-zinc-200 mt-2 whitespace-pre-wrap leading-relaxed">
                    {c.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#0D1017] space-y-2.5 pb-safe"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="আপনার নাম *"
              className="font-script px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#161B26] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            />
            <select
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-white dark:bg-[#161B26] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="মন্তব্য বা শুটিং নোট লিখুন..."
              className="flex-1 font-script px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#161B26] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00] resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !authorName.trim() || !content.trim()}
              className="px-3.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
