import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, User, X } from 'lucide-react';
import { TEAM_ROLES } from '../lib/constants';

export default function WelcomeIdentityModal({
  open,
  initialIdentity,
  canClose = false,
  onClose,
  onSaveIdentity,
}) {
  const [name, setName] = useState(initialIdentity?.name || '');
  const [role, setRole] = useState(initialIdentity?.role || 'Team Member');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialIdentity?.name || '');
    setRole(initialIdentity?.role || 'Team Member');
    setError('');
  }, [open, initialIdentity]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('অনুগ্রহ করে তোমার নাম লেখো।');
      return;
    }
    onSaveIdentity({ name: cleanName, role });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#06070A]/92 backdrop-blur-md overflow-y-auto no-print">
      <div className="relative w-full max-w-md rounded-3xl bg-[#11141D] text-white border border-orange-500/30 shadow-[0_0_60px_-15px_rgba(255,107,0,0.4)] overflow-hidden my-auto">
        <div className="relative pt-7 pb-5 px-6 text-center bg-gradient-to-b from-orange-500/20 via-orange-500/5 to-transparent">
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative w-24 h-24 mx-auto mb-3 rounded-full p-1 bg-gradient-to-tr from-[#FF6B00] via-orange-400 to-white shadow-lg shadow-orange-500/30">
            <img
              src="/brand/sfr-logo.png"
              alt="Sumon From Rangpur Logo"
              className="w-full h-full rounded-full object-cover bg-black"
            />
          </div>

          <h2 className="font-extrabold text-lg tracking-wider uppercase text-white">
            SUMON FROM RANGPUR
          </h2>
          <p className="font-script text-xs text-orange-300/90 mt-1">
            কোনো অ্যাকাউন্ট বা পাসওয়ার্ড লাগবে না • শুধু একবার নাম দিলেই হবে
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5 font-script">
              <User className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>তোমার নাম লেখো</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: সুমন / মেহেদী / রাকিব..."
              autoFocus
              maxLength={40}
              className="w-full font-script text-base px-4 py-3 rounded-2xl bg-[#0A0C12] border border-zinc-700/90 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/25"
            />
            <p className="font-script text-[11px] text-zinc-400 mt-1.5">
              কে কোন স্ক্রিপ্ট লিখেছে তা দেখানোর জন্য এই নামটি ব্যবহার হবে।
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 font-script">
              টিমে তোমার ভূমিকা (Role)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEAM_ROLES.map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm shadow-orange-500/30'
                        : 'bg-[#0A0C12] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="font-script text-xs text-red-300 bg-red-500/15 border border-red-500/30 px-3.5 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-script text-base">
              {canClose ? 'নাম সেভ করো' : 'নোটবুকে প্রবেশ করো'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
