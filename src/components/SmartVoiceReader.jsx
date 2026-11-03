import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  Zap,
  BookOpen,
  Minimize2,
  Maximize2,
  Radio,
  Loader2,
} from 'lucide-react';
import { buildSpeechChunks, extractSmartBreakdown } from '../lib/smartExtractor';

function buildCloudBanglaAudioUrl(text, mirror = 0) {
  const q = encodeURIComponent(text);
  if (mirror === 0) {
    return `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=bn&dt=t&q=${q}`;
  }
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=bn&q=${q}`;
}

function createNoReferrerAudio() {
  const a = new Audio();
  a.preload = 'auto';
  a.referrerPolicy = 'no-referrer';
  a.setAttribute('referrerpolicy', 'no-referrer');
  a.setAttribute('playsinline', 'true');
  return a;
}

export default function SmartVoiceReader({
  open,
  fullText = '',
  scriptTitle = '',
  initialMode = 'full', // 'full' | 'short'
  onClose,
}) {
  const [readMode, setReadMode] = useState(initialMode);
  const [minimized, setMinimized] = useState(false);
  // 'cloud' = Google Natural Bangla HD MP3 (<audio>) | 'device' = Device bn-BD speechSynthesis
  const [engineMode, setEngineMode] = useState('cloud');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [bnVoices, setBnVoices] = useState([]);

  const synthSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const rateRef = useRef(1.0);
  const engineModeRef = useRef('cloud');
  const chunksRef = useRef([]);
  const playerAudioRef = useRef(null);
  const preloadAudioRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    setReadMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    rateRef.current = rate;
    if (playerAudioRef.current) {
      playerAudioRef.current.playbackRate = rate;
    }
  }, [rate]);

  useEffect(() => {
    engineModeRef.current = engineMode;
  }, [engineMode]);

  // Build clean natural Bangla speech script for Full vs Short mode
  const targetSpeechText = useMemo(() => {
    if (!fullText.trim()) return '';
    if (readMode === 'full') {
      return scriptTitle ? `${scriptTitle}।\n${fullText}` : fullText;
    }
    const bd = extractSmartBreakdown(fullText);
    const parts = [];
    if (scriptTitle) parts.push(`${scriptTitle}, সংক্ষিপ্ত ডায়ালগ ও নির্দেশনা।`);
    if (bd.instructions.length > 0) {
      parts.push('মূল শুটিং নির্দেশনা।');
      bd.instructions.slice(0, 12).forEach((inst) => parts.push(`${inst.text}।`));
    }
    if (bd.dialogues.length > 0) {
      parts.push('এখন ডায়ালগসমূহ।');
      bd.dialogues.forEach((d) => {
        const who =
          d.speaker && d.speaker !== 'ডায়ালগ' && d.speaker !== 'ভয়েসওভার / কথা'
            ? `${d.speaker}: `
            : '';
        parts.push(`${who}${d.text}`);
      });
    }
    return parts.join('\n');
  }, [fullText, scriptTitle, readMode]);

  const chunks = useMemo(() => buildSpeechChunks(targetSpeechText, 145), [targetSpeechText]);

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  // Load ONLY genuine Bengali voices for offline fallback (NEVER force English voice on Bangla!)
  useEffect(() => {
    if (!synthSupported) return undefined;
    const loadBnVoices = () => {
      const all = window.speechSynthesis.getVoices() || [];
      const onlyBangla = all.filter(
        (v) => /^bn/i.test(v.lang) || /bengali|bangla|বাংলা/i.test(v.name)
      );
      // Sort bn-BD first, then bn-IN, then any bn
      onlyBangla.sort((a, b) => {
        const aBd = /bn[-_]BD/i.test(a.lang) ? 0 : 1;
        const bBd = /bn[-_]BD/i.test(b.lang) ? 0 : 1;
        return aBd - bBd;
      });
      setBnVoices(onlyBangla);
    };
    loadBnVoices();
    window.speechSynthesis.onvoiceschanged = loadBnVoices;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [synthSupported]);

  const releaseWakeLock = useCallback(() => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    } catch {
      // ignore
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current && document.visibilityState === 'visible') {
        wakeLockRef.current = await navigator.wakeLock.request('screen').catch(() => null);
      }
    } catch {
      // ignore
    }
  }, []);

  const stopAllPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
    releaseWakeLock();

    if (playerAudioRef.current) {
      try {
        playerAudioRef.current.onended = null;
        playerAudioRef.current.onerror = null;
        playerAudioRef.current.pause();
      } catch {
        // ignore
      }
    }

    if (synthSupported && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } catch {
      // ignore
    }
  }, [synthSupported, releaseWakeLock]);

  const updateMediaSession = useCallback(
    (idx) => {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      try {
        const total = chunksRef.current.length || 1;
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: scriptTitle || 'S.F.R বাংলা ভয়েস রিডার',
          artist: `SUMON FROM RANGPUR • লাইন ${idx + 1}/${total}`,
          album: readMode === 'short' ? 'শুধু ডায়ালগ ও নির্দেশনা' : 'সম্পূর্ণ স্ক্রিপ্ট (A–Z)',
          artwork: [
            { src: '/brand/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/brand/pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {
        // ignore
      }
    },
    [scriptTitle, readMode]
  );

  // Offline / Fallback Device bn-BD Synth (strictly Bengali lang, NEVER forced English voice!)
  const speakWithDeviceBangla = useCallback(
    (idx, speakNextFn) => {
      if (!synthSupported) {
        stopAllPlayback();
        return;
      }
      const list = chunksRef.current;
      if (!list || idx < 0 || idx >= list.length) {
        stopAllPlayback();
        currentIndexRef.current = 0;
        setCurrentIndex(0);
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      setIsBuffering(false);
      const utter = new window.SpeechSynthesisUtterance(list[idx]);
      // CRITICAL FIX: Only attach a voice object if it is genuinely Bengali!
      // Otherwise leave utter.voice unset and set utter.lang = 'bn-BD' so the OS uses Bengali!
      if (bnVoices.length > 0) {
        utter.voice = bnVoices[0];
        utter.lang = bnVoices[0].lang || 'bn-BD';
      } else {
        utter.lang = 'bn-BD';
      }
      utter.rate = rateRef.current;

      utter.onend = () => {
        if (!isPlayingRef.current) return;
        const nextIdx = idx + 1;
        if (nextIdx < chunksRef.current.length) {
          speakNextFn(nextIdx);
        } else {
          stopAllPlayback();
          currentIndexRef.current = 0;
          setCurrentIndex(0);
        }
      };

      utter.onerror = (ev) => {
        if (!isPlayingRef.current) return;
        if (ev?.error === 'interrupted' || ev?.error === 'canceled') return;
        const nextIdx = idx + 1;
        if (nextIdx < chunksRef.current.length) {
          setTimeout(() => speakNextFn(nextIdx), 150);
        } else {
          stopAllPlayback();
        }
      };

      window.speechSynthesis.speak(utter);
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    },
    [synthSupported, bnVoices, stopAllPlayback]
  );

  // Primary Engine: Natural Google Bangla HD MP3 (<audio> element — works natively in background & lock screen!)
  const playChunkAt = useCallback(
    (idx, mirrorAttempt = 0) => {
      const list = chunksRef.current;
      if (!list || idx < 0 || idx >= list.length) {
        stopAllPlayback();
        currentIndexRef.current = 0;
        setCurrentIndex(0);
        return;
      }

      currentIndexRef.current = idx;
      setCurrentIndex(idx);
      updateMediaSession(idx);

      // If user explicitly chose offline device mode or browser is offline
      if (engineModeRef.current === 'device' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        speakWithDeviceBangla(idx, (n) => playChunkAt(n, 0));
        return;
      }

      // Stop any leftover speechSynthesis
      if (synthSupported && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }

      if (!playerAudioRef.current) {
        playerAudioRef.current = createNoReferrerAudio();
      }
      const audio = playerAudioRef.current;
      audio.onended = null;
      audio.onerror = null;

      setIsBuffering(true);
      audio.src = buildCloudBanglaAudioUrl(list[idx], mirrorAttempt);
      audio.playbackRate = rateRef.current;
      if ('preservesPitch' in audio) audio.preservesPitch = true;

      // Preload next sentence in background so there is zero pause between sentences!
      if (idx + 1 < list.length) {
        try {
          if (!preloadAudioRef.current) {
            preloadAudioRef.current = createNoReferrerAudio();
          }
          preloadAudioRef.current.src = buildCloudBanglaAudioUrl(list[idx + 1], mirrorAttempt);
        } catch {
          // ignore preload error
        }
      }

      audio.onplaying = () => {
        setIsBuffering(false);
        audio.playbackRate = rateRef.current;
      };

      audio.onended = () => {
        if (!isPlayingRef.current) return;
        const nextIdx = idx + 1;
        if (nextIdx < chunksRef.current.length) {
          playChunkAt(nextIdx, 0);
        } else {
          stopAllPlayback();
          currentIndexRef.current = 0;
          setCurrentIndex(0);
        }
      };

      audio.onerror = () => {
        if (!isPlayingRef.current) return;
        if (mirrorAttempt === 0) {
          // Try mirror #2 immediately
          playChunkAt(idx, 1);
        } else {
          // Automatic fallback to bn-BD device speechSynthesis if network blocked
          setEngineMode('device');
          engineModeRef.current = 'device';
          speakWithDeviceBangla(idx, (n) => playChunkAt(n, 0));
        }
      };

      audio.play().catch(() => {
        if (!isPlayingRef.current) return;
        if (mirrorAttempt === 0) {
          playChunkAt(idx, 1);
        } else {
          setEngineMode('device');
          engineModeRef.current = 'device';
          speakWithDeviceBangla(idx, (n) => playChunkAt(n, 0));
        }
      });
    },
    [stopAllPlayback, updateMediaSession, speakWithDeviceBangla, synthSupported]
  );

  // Keep background playback alive on visibilitychange
  useEffect(() => {
    const onVisibility = () => {
      if (!isPlayingRef.current) return;
      try {
        if (engineModeRef.current === 'cloud' && playerAudioRef.current?.paused) {
          playerAudioRef.current.play().catch(() => {});
        } else if (engineModeRef.current === 'device' && window.speechSynthesis?.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Lock-screen & earphone MediaSession buttons
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return undefined;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (chunksRef.current.length === 0) return;
        isPlayingRef.current = true;
        setIsPlaying(true);
        acquireWakeLock();
        playChunkAt(currentIndexRef.current, 0);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        stopAllPlayback();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = Math.max(0, currentIndexRef.current - 1);
        currentIndexRef.current = prev;
        setCurrentIndex(prev);
        if (isPlayingRef.current) playChunkAt(prev, 0);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const next = Math.min(chunksRef.current.length - 1, currentIndexRef.current + 1);
        currentIndexRef.current = next;
        setCurrentIndex(next);
        if (isPlayingRef.current) playChunkAt(next, 0);
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        stopAllPlayback();
      });
    } catch {
      // ignore
    }
    return undefined;
  }, [acquireWakeLock, playChunkAt, stopAllPlayback]);

  useEffect(() => {
    if (!open) stopAllPlayback();
  }, [open, stopAllPlayback]);

  useEffect(() => {
    stopAllPlayback();
    currentIndexRef.current = 0;
    setCurrentIndex(0);
  }, [targetSpeechText, stopAllPlayback]);

  useEffect(() => () => stopAllPlayback(), [stopAllPlayback]);

  if (!open) return null;

  const handleTogglePlay = () => {
    if (chunks.length === 0) return;
    if (isPlaying) {
      stopAllPlayback();
    } else {
      // Unlock audio element synchronously inside user click gesture for mobile Safari/Chrome!
      if (!playerAudioRef.current) {
        playerAudioRef.current = createNoReferrerAudio();
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      acquireWakeLock();
      playChunkAt(currentIndex, 0);
    }
  };

  const handleStep = (delta) => {
    if (chunks.length === 0) return;
    const next = Math.max(0, Math.min(chunks.length - 1, currentIndex + delta));
    setCurrentIndex(next);
    currentIndexRef.current = next;
    if (isPlaying) {
      playChunkAt(next, 0);
    }
  };

  const handleCycleRate = () => {
    const rates = [1.0, 1.15, 1.3, 0.9];
    const next = rates[(rates.indexOf(rate) + 1) % rates.length] || 1.0;
    setRate(next);
    rateRef.current = next;
    if (playerAudioRef.current) {
      playerAudioRef.current.playbackRate = next;
    } else if (isPlaying && engineMode === 'device') {
      playChunkAt(currentIndex, 0);
    }
  };

  const handleToggleEngine = () => {
    const nextEngine = engineMode === 'cloud' ? 'device' : 'cloud';
    setEngineMode(nextEngine);
    engineModeRef.current = nextEngine;
    if (isPlaying) {
      playChunkAt(currentIndex, 0);
    }
  };

  const progressPct =
    chunks.length > 0
      ? Math.round(((currentIndex + (isPlaying ? 1 : 0)) / chunks.length) * 100)
      : 0;

  if (minimized) {
    return (
      <div className="fixed bottom-18 lg:bottom-5 right-3 left-3 lg:left-auto lg:w-96 z-40 rounded-2xl bg-[#121622]/98 text-white border border-[#FF6B00]/50 shadow-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>
          <div className="min-w-0">
            <p className="font-script text-xs font-bold text-white truncate">
              {scriptTitle || 'বাংলা ভয়েস রিডার'}
            </p>
            <p className="font-script text-[10px] text-orange-300 truncate">
              {isPlaying ? 'বাংলা HD ভয়েস চলছে...' : 'বিরতি'} • লাইন {currentIndex + 1}/{chunks.length || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="p-1.5 rounded-lg bg-white/10 text-zinc-200 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              stopAllPlayback();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/10 text-zinc-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-18 lg:bottom-5 right-3 left-3 lg:left-auto lg:w-[460px] z-40 rounded-3xl bg-gradient-to-br from-[#161B28] via-[#111520] to-[#0D1018] text-white border border-[#FF6B00]/50 shadow-2xl p-4 space-y-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-script font-bold text-xs sm:text-sm text-white truncate">
                বাংলা স্মার্ট ভয়েস রিডার
              </h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                <Radio className="w-2.5 h-2.5" />
                {engineMode === 'cloud' ? 'বাংলা HD' : 'অফলাইন বাংলা'}
              </span>
            </div>
            <p className="font-script text-[10px] text-zinc-400 truncate">
              মিনিমাইজ বা স্ক্রিন লক করলেও স্পষ্ট বাংলায় পড়ে শোনাবে
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <div className="inline-flex rounded-xl bg-black/45 p-0.5 border border-zinc-800">
            <button
              type="button"
              onClick={() => setReadMode('full')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-script font-bold transition cursor-pointer ${
                readMode === 'full' ? 'bg-[#FF6B00] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>পুরোটা</span>
            </button>
            <button
              type="button"
              onClick={() => setReadMode('short')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-script font-bold transition cursor-pointer ${
                readMode === 'short' ? 'bg-[#FF6B00] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>শুধু ডায়ালগ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-zinc-300 cursor-pointer"
            title="ছোট করে রাখুন"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllPlayback();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-zinc-300 cursor-pointer"
            aria-label="Close voice reader"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {chunks.length === 0 ? (
        <div className="p-3 rounded-xl bg-white/5 font-script text-xs text-zinc-400">
          এই স্ক্রিপ্টে এখনো কোনো লেখা নেই। লেখা যোগ করলেই ভয়েস শোনা যাবে।
        </div>
      ) : (
        <>
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 max-h-28 overflow-y-auto">
            <div className="flex items-center justify-between text-[10px] text-orange-300/90 font-mono-code mb-1">
              <span>
                লাইন {currentIndex + 1} / {chunks.length}
              </span>
              <span>{progressPct}%</span>
            </div>
            <p className="font-script text-xs sm:text-sm text-zinc-100 leading-relaxed">
              {chunks[currentIndex]}
            </p>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] to-amber-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-script font-bold text-xs shadow-md shadow-orange-500/25 cursor-pointer"
              >
                {isBuffering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>লোড হচ্ছে...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>থামান</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>বাংলায় শুনুন</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 disabled:opacity-30 text-white cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={currentIndex >= chunks.length - 1}
                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 disabled:opacity-30 text-white cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopAllPlayback();
                  setCurrentIndex(0);
                  currentIndexRef.current = 0;
                }}
                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-zinc-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCycleRate}
                className="px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-[11px] font-mono-code font-bold text-orange-300 cursor-pointer"
              >
                {rate}x
              </button>

              <button
                type="button"
                onClick={handleToggleEngine}
                className="px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 font-script text-[11px] font-semibold text-zinc-200 cursor-pointer"
                title="ভয়েস ইঞ্জিন পরিবর্তন করুন"
              >
                {engineMode === 'cloud' ? 'HD বাংলা' : 'ফোন ভয়েস'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
