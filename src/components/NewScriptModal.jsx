import React, { useEffect, useState } from 'react';
import { X, Youtube, AlertCircle } from 'lucide-react';
import { PLATFORMS } from '../lib/constants';

export default function NewScriptModal({
  open,
  defaultAuthorName = '',
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [platform, setPlatform] = useState('youtube');
  const [fullText, setFullText] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setAuthorName(defaultAuthorName || 'Sumon');
      setFullText('');
      setError('');
    }
  }, [open, defaultAuthorName]);

  if (!open) return null;

  const canSubmit = Boolean(title.trim() || fullText.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('অনুগ্রহ করে ভিডিওর টাইটেল অথবা স্ক্রিপ্ট লিখুন।');
      return;
    }

    setError('');
    setCreating(true);
    try {
      const derivedTitle =
        title.trim() ||
        fullText
          .split('\n')
          .map((l) => l.trim())
          .find(Boolean)
          ?.slice(0, 70) ||
        'নতুন স্ক্রিপ্ট';

      const pf = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
      await onCreate({
        title: derivedTitle,
        authorName: (authorName || defaultAuthorName || 'Sumon').trim(),
        folderId: platform === 'shorts' ? 'fld_reels' : 'fld_youtube',
        platform,
        aspectRatio: pf.aspect,
        status: 'ready_for_shoot',
        fullText,
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'স্ক্রিপ্ট সেভ করা যায়নি! আবার চেষ্টা করুন।');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131720] border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/sfr-logo.png"
              alt="S.F.R"
              className="w-8 h-8 rounded-full ring-1 ring-[#FF6B00] object-cover"
            />
            <div>
              <h3 className="font-script font-bold text-base text-zinc-900 dark:text-zinc-50">
                নতুন স্ক্রিপ্ট অ্যাড করুন
              </h3>
              <p className="font-script text-[11px] text-zinc-500 dark:text-zinc-400">
                A–Z লিখুন, সিস্টেম নিজেই ডায়ালগ ও নির্দেশনা আলাদা করে দেবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          <div>
            <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              ভিডিওর টাইটেল
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: রংপুরের ঈদ স্পেশাল কমেডি..."
              className="w-full font-script px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                স্ক্রিপ্ট লেখকের নাম
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="যেমন: Sumon"
                className="w-full font-script px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                চ্যানেল ফরম্যাট
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PLATFORMS.map((pf) => (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => setPlatform(pf.id)}
                    className={`flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      platform === pf.id
                        ? 'border-[#FF6B00] bg-orange-500/12 text-[#FF6B00]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>{pf.id === 'shorts' ? 'Shorts' : 'Video'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              সম্পূর্ণ স্ক্রিপ্ট (A–Z) লিখুন বা পেস্ট করুন
            </label>
            <textarea
              rows={6}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="এখানে পুরো স্ক্রিপ্ট পেস্ট বা টাইপ করুন..."
              className="w-full font-script px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00] resize-y"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/12 border border-red-500/30 font-script text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1 flex items-center gap-2.5 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-script text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={creating || !canSubmit}
              className="flex-[2] py-3 rounded-xl font-script text-sm font-bold bg-[#FF6B00] hover:bg-orange-600 disabled:opacity-50 text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
            >
              {creating ? 'সেভ হচ্ছে...' : 'স্ক্রিপ্ট সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
