import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Smartphone, CheckCircle2, X } from 'lucide-react';

function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true
  );
}

function checkIsInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export default function PwaInstallBanner() {
  const [isStandalone, setIsStandalone] = useState(() => checkIsStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== 'undefined' ? window.__sfrDeferredPwaPrompt : null)
  );
  const [swReady, setSwReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showModalOnEntry, setShowModalOnEntry] = useState(() => !checkIsStandalone());
  const [inIframe] = useState(() => checkIsInIframe());

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  useEffect(() => {
    const syncPrompt = () => {
      if (window.__sfrDeferredPwaPrompt) {
        setDeferredPrompt(window.__sfrDeferredPwaPrompt);
      }
    };
    const onInstalled = () => {
      setIsStandalone(true);
      setShowModalOnEntry(false);
      window.__sfrDeferredPwaPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('sfr-pwa-ready', syncPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => setSwReady(true))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('sfr-pwa-ready', syncPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__sfrDeferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsStandalone(true);
          setShowModalOnEntry(false);
        }
        window.__sfrDeferredPwaPrompt = null;
        setDeferredPrompt(null);
      } catch {
        setShowModalOnEntry(false);
      }
      return;
    }

    // If inside an iframe preview, open full top-level tab where Chrome/Android shows native PWA install!
    if (inIframe) {
      window.open(window.location.href, '_blank', 'noopener');
      setShowModalOnEntry(false);
    }
  };

  // Immediate Hard PWA Launch Dialog right upon entering web!
  if (showModalOnEntry) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
        <div className="w-full max-w-sm rounded-3xl bg-[#111520] text-white border border-[#FF6B00]/50 shadow-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/brand/pwa-192.png"
                alt="Sumon S.F.R"
                className="w-12 h-12 rounded-2xl ring-2 ring-[#FF6B00] object-cover shrink-0"
              />
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mb-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  {swReady ? 'Hard PWA Ready' : 'PWA App Mode'}
                </span>
                <h3 className="font-extrabold text-sm tracking-wide text-white">
                  SUMON FROM RANGPUR
                </h3>
                <p className="font-script text-[11px] text-orange-300">
                  অ্যাপ হিসেবে চালু করলে ব্যাকগ্রাউন্ডেও ভয়েস শোনা যাবে!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModalOnEntry(false)}
              className="p-1.5 rounded-full bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-3 font-script text-xs text-zinc-300 leading-relaxed">
            {deferredPrompt ? (
              <span>
                নিচের বাটনে চাপ দিলেই তোমার ফোনে <strong>Sumon S.F.R App</strong> সরাসরি ইনস্টল হয়ে যাবে—ব্রাউজার থেকে বের হলেও ভয়েস চালু থাকবে।
              </span>
            ) : inIframe ? (
              <span>
                তুমি এখন প্রিভিউ ফ্রেমে আছো। <strong>ফুল অ্যাপ মোড ও ইনস্টল</strong> চালু করতে নিচের বাটনে চাপ দিয়ে সরাসরি ব্রাউজারে ওপেন করো।
              </span>
            ) : isIOS ? (
              <span>
                iPhone-এ অ্যাপ হিসেবে চালাতে নিচের <strong>Share (⬆️)</strong> বাটনে চাপ দিয়ে <strong>Add to Home Screen</strong> সিলেক্ট করো।
              </span>
            ) : (
              <span>
                অফলাইন ও ব্যাকগ্রাউন্ড অডিও সাপোর্ট চালু হয়েছে! ব্রাউজারের মেনু থেকে <strong>Install App / Add to Home screen</strong> চাপলে অ্যাপ হয়ে যাবে।
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(deferredPrompt || inIframe) && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 text-white font-script font-bold text-xs shadow-lg shadow-orange-500/30 cursor-pointer"
              >
                {deferredPrompt ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>অ্যাপ ইনস্টল করুন (PWA)</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>ফুল PWA অ্যাপে খুলুন</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowModalOnEntry(false)}
              className={`${
                deferredPrompt || inIframe ? 'px-3.5' : 'w-full'
              } py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-zinc-200 font-script font-bold text-xs cursor-pointer`}
            >
              এখানেই চালান
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compact top bar strip if modal was minimized so user can install anytime in 1 tap
  return (
    <div className="bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white px-3 py-1.5 flex items-center justify-between gap-2 text-xs no-print shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="font-script font-bold truncate">
          ব্যাকগ্রাউন্ড ভয়েসের জন্য S.F.R App মোড ব্যবহার করুন
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {(deferredPrompt || inIframe) && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-2.5 py-0.5 rounded-lg bg-black/30 hover:bg-black/45 font-script font-bold text-[11px] cursor-pointer"
          >
            {deferredPrompt ? 'Install App' : 'Open App'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 hover:bg-black/20 rounded cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
