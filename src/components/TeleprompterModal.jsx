import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FlipHorizontal2,
  X,
  Minus,
  Plus,
  Zap,
  BookOpen,
} from 'lucide-react';
import { extractSmartBreakdown } from '../lib/smartExtractor';

export default function TeleprompterModal({ open, script, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(32);
  const [fontSize, setFontSize] = useState(30);
  const [mirrored, setMirrored] = useState(false);
  const [onlyDialogues, setOnlyDialogues] = useState(true);
  const scrollRef = useRef(null);
  const lastFrameRef = useRef(null);

  const fullText = script?.fullText || '';
  const breakdown = useMemo(() => extractSmartBreakdown(fullText), [fullText]);

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      return;
    }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [open, onlyDialogues]);

  useEffect(() => {
    if (!open || !isPlaying) {
      lastFrameRef.current = null;
      return;
    }
    let rafId;
    const step = (ts) => {
      if (lastFrameRef.current != null && scrollRef.current) {
        const dt = (ts - lastFrameRef.current) / 1000;
        scrollRef.current.scrollTop += speed * dt;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          setIsPlaying(false);
          return;
        }
      }
      lastFrameRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [open, isPlaying, speed]);

  if (!open || !script) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050608] text-white flex flex-col select-none">
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-3 bg-[#0D1017] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs sm:text-sm cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="font-script">{isPlaying ? 'থামান' : 'স্ক্রল চালু'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setOnlyDialogues((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-script font-bold border cursor-pointer ${
              onlyDialogues
                ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            {onlyDialogues ? <Zap className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
            <span>{onlyDialogues ? 'শুধু ডায়ালগ' : 'পুরো A–Z'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-zinc-400">Speed</span>
            <input
              type="range"
              min="12"
              max="110"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-[#FF6B00]"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
            <button
              onClick={() => setFontSize((f) => Math.max(20, f - 4))}
              className="p-1 hover:bg-zinc-800 rounded cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono-code w-7 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((f) => Math.min(64, f + 4))}
              className="p-1 hover:bg-zinc-800 rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setMirrored((m) => !m)}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              mirrored ? 'bg-orange-500/20 border-[#FF6B00] text-orange-300' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
            title="Mirror"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Eye-level Guide */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-[34%] z-10 border-y border-[#FF6B00]/40 bg-[#FF6B00]/[0.05] h-16" />

        <div
          ref={scrollRef}
          onClick={() => setIsPlaying((p) => !p)}
          className={`h-full overflow-y-auto px-5 sm:px-14 pt-[32vh] pb-[60vh] cursor-pointer ${
            mirrored ? 'teleprompter-mirror' : ''
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-script text-xl sm:text-2xl font-bold text-[#FF6B00]">{script.title}</h2>

            {onlyDialogues && breakdown.dialogues.length > 0 ? (
              breakdown.dialogues.map((d) => (
                <div key={d.id} className="space-y-1">
                  <div className="font-script text-sm font-bold text-orange-400">
                    {d.speaker} {d.cue ? `(${d.cue})` : ''}
                  </div>
                  <p style={{ fontSize: `${fontSize}px` }} className="font-script leading-[1.65] font-medium text-white">
                    {d.text}
                  </p>
                </div>
              ))
            ) : (
              <p
                style={{ fontSize: `${fontSize}px` }}
                className="font-script leading-[1.7] font-medium text-white whitespace-pre-wrap"
              >
                {fullText || '(স্ক্রিপ্ট খালি)'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
