import React, { useState } from 'react';
import { X, Settings, Youtube } from 'lucide-react';

export default function StudioSettingsModal({ open, studio, onClose, onSave }) {
  const [studioName, setStudioName] = useState(studio?.studioName || 'SUMON FROM RANGPUR');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState(
    studio?.youtubeChannelUrl || 'https://youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg'
  );
  const [defaultWpm, setDefaultWpm] = useState(studio?.defaultWpm || 130);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave({
        studioName: studioName.trim(),
        youtubeChannelUrl: youtubeChannelUrl.trim(),
        defaultWpm: Number(defaultWpm) || 130,
      });
      setMessage({ type: 'ok', text: 'সেটিংস সেভ হয়েছে!' });
    } catch (err) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131720] border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-script font-bold text-sm text-zinc-900 dark:text-zinc-100">
              S.F.R চ্যানেল সেটিংস
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              চ্যানেল / স্টুডিও নাম
            </label>
            <input
              type="text"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>অফিশিয়াল YouTube চ্যানেল লিংক</span>
            </label>
            <input
              type="url"
              required
              value={youtubeChannelUrl}
              onChange={(e) => setYoutubeChannelUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block font-script text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              কথা বলার গতি (Words Per Minute)
            </label>
            <input
              type="number"
              min="80"
              max="220"
              value={defaultWpm}
              onChange={(e) => setDefaultWpm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0D1017] border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {message && (
            <p
              className={`font-script text-xs px-3 py-2 rounded-xl ${
                message.type === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-red-500/15 text-red-500'
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-script text-xs font-bold text-zinc-500 cursor-pointer"
            >
              বন্ধ করুন
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-script text-xs font-bold bg-[#FF6B00] hover:bg-orange-600 text-white cursor-pointer"
            >
              {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
