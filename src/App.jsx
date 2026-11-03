import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Youtube, Plus, ExternalLink, Volume2, Zap, BookOpen } from 'lucide-react';
import {
  api,
  getStoredMemberIdentity,
  setStoredMemberIdentity,
  getStoredTheme,
  setStoredTheme,
} from './lib/api';
import { SFR_CHANNEL_URL } from './lib/constants';
import PwaInstallBanner from './components/PwaInstallBanner';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ScriptHeader from './components/ScriptHeader';
import MasterScriptView from './components/MasterScriptView';
import SmartExtractView from './components/SmartExtractView';
import SmartVoiceReader from './components/SmartVoiceReader';
import TeleprompterModal from './components/TeleprompterModal';
import TeamCommentsDrawer from './components/TeamCommentsDrawer';
import NewScriptModal from './components/NewScriptModal';
import StudioSettingsModal from './components/StudioSettingsModal';
import WelcomeIdentityModal from './components/WelcomeIdentityModal';
import MobileBottomNav from './components/MobileBottomNav';

export default function App() {
  const [theme, setTheme] = useState(() => getStoredTheme() || 'dark');
  const [memberIdentity, setMemberIdentity] = useState(() => getStoredMemberIdentity());
  const [editingIdentity, setEditingIdentity] = useState(false);

  const [studio, setStudio] = useState({
    studioName: 'SUMON FROM RANGPUR',
    youtubeChannelUrl: SFR_CHANNEL_URL,
    defaultWpm: 130,
  });

  // Clean Read vs Edit toggle (NO password required!)
  const [isEditing, setIsEditing] = useState(false);

  const [folders, setFolders] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedScriptId, setSelectedScriptId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('script') || null;
    } catch {
      return null;
    }
  });

  const [mobileView, setMobileView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('script') || params.get('s') ? 'detail' : 'list';
    } catch {
      return 'list';
    }
  });

  const [activeScript, setActiveScript] = useState(null);
  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'smart'
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceInitialMode, setVoiceInitialMode] = useState('full');
  const [voiceScriptSnapshot, setVoiceScriptSnapshot] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingScript, setLoadingScript] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [liveConnected, setLiveConnected] = useState(false);

  const [newScriptModalOpen, setNewScriptModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const saveTimerRef = useRef(null);
  const pendingPatchRef = useRef({});
  const selectedScriptIdRef = useRef(selectedScriptId);

  useEffect(() => {
    selectedScriptIdRef.current = selectedScriptId;
  }, [selectedScriptId]);

  useEffect(() => {
    if (activeScript && (!voiceScriptSnapshot || voiceScriptSnapshot.id === activeScript.id)) {
      setVoiceScriptSnapshot(activeScript);
    }
  }, [activeScript, voiceScriptSnapshot]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.background = '#090B10';
    } else {
      root.classList.remove('dark');
      root.style.background = '#FAF8F5';
    }
    setStoredTheme(theme);
  }, [theme]);

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => {
      setToast((prev) => (prev === text ? null : prev));
    }, 2800);
  }, []);

  const handleSaveIdentity = (identity) => {
    const saved = setStoredMemberIdentity(identity);
    setMemberIdentity(saved);
    setEditingIdentity(false);
    showToast(`স্বাগতম, ${saved.name}!`);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('s');
      if (slug) {
        api
          .getScriptBySlug(slug)
          .then((detail) => {
            if (detail?.id) {
              setSelectedScriptId(detail.id);
              setActiveScript(detail);
              setMobileView('detail');
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedScriptId) {
        url.searchParams.set('script', selectedScriptId);
      } else {
        url.searchParams.delete('script');
      }
      window.history.replaceState({}, '', url);
    } catch {
      // ignore
    }
  }, [selectedScriptId]);

  const fetchListAndFolders = useCallback(async () => {
    try {
      const [studioRes, folderList, scriptList] = await Promise.all([
        api.getStudio(),
        api.getFolders(),
        api.getScripts(),
      ]);
      setStudio(studioRes);
      setFolders(Array.isArray(folderList) ? folderList : []);
      const list = Array.isArray(scriptList) ? scriptList : [];
      setScripts(list);

      setSelectedScriptId((curr) => {
        if (curr && list.some((s) => s.id === curr)) return curr;
        if (window.innerWidth >= 1024 && list.length > 0) return list[0].id;
        return null;
      });
    } catch (err) {
      console.error('Failed loading workspace:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchActiveScript = useCallback(async (scriptId, silent = false) => {
    if (!scriptId) {
      setActiveScript(null);
      return;
    }
    if (!silent) setLoadingScript(true);
    try {
      const detail = await api.getScript(scriptId);
      setActiveScript(detail);
    } catch {
      setActiveScript(null);
    } finally {
      if (!silent) setLoadingScript(false);
    }
  }, []);

  useEffect(() => {
    fetchListAndFolders();
  }, [fetchListAndFolders]);

  useEffect(() => {
    fetchActiveScript(selectedScriptId);
  }, [selectedScriptId, fetchActiveScript]);

  // Real-time SSE sync
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return undefined;
    }
    let es;
    try {
      es = new window.EventSource('/api/events');
      es.onopen = () => setLiveConnected(true);
      es.onerror = () => setLiveConnected(false);

      const refreshAll = (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          api.getScripts().then((list) => setScripts(Array.isArray(list) ? list : [])).catch(() => {});
          if (data.scriptId && data.scriptId === selectedScriptIdRef.current) {
            if (Object.keys(pendingPatchRef.current).length === 0) {
              fetchActiveScript(data.scriptId, true);
            }
          }
        } catch {
          // ignore
        }
      };

      es.addEventListener('connected', () => setLiveConnected(true));
      es.addEventListener('script:updated', refreshAll);
      es.addEventListener('script:deleted', (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          api.getScripts().then((list) => {
            const next = Array.isArray(list) ? list : [];
            setScripts(next);
            if (data.scriptId === selectedScriptIdRef.current) {
              setSelectedScriptId(next[0]?.id || null);
              setMobileView('list');
            }
          });
        } catch {
          // ignore
        }
      });
      es.addEventListener('comment:updated', refreshAll);
      es.addEventListener('studio:updated', () => {
        api.getStudio().then(setStudio).catch(() => {});
      });
    } catch {
      setLiveConnected(false);
    }

    return () => {
      if (es) es.close();
    };
  }, [fetchActiveScript]);

  const queueSave = useCallback(
    (scriptId, patch) => {
      if (!scriptId) return;
      const writerName = memberIdentity?.name || 'Sumon';
      pendingPatchRef.current = {
        ...pendingPatchRef.current,
        ...patch,
        lastEditedBy: writerName,
      };
      setSaveState('saving');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const payload = { ...pendingPatchRef.current };
        pendingPatchRef.current = {};
        try {
          const updated = await api.updateScript(scriptId, payload);
          setActiveScript((curr) => (curr && curr.id === scriptId ? updated : curr));
          setSaveState('saved');
          const list = await api.getScripts();
          setScripts(Array.isArray(list) ? list : []);
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveState('error');
        }
      }, 400);
    },
    [memberIdentity]
  );

  const handleChangeScriptField = (updates) => {
    if (!activeScript) return;
    setActiveScript((prev) => ({ ...prev, ...updates }));
    queueSave(activeScript.id, updates);
  };

  const handleSelectScript = (scriptId) => {
    setSelectedScriptId(scriptId);
    setIsEditing(false);
    setMobileView('detail');
  };

  const handleCreateScript = async (payload) => {
    const created = await api.createScript(payload);
    setSelectedFolderId(null);
    setSelectedStatus('all');
    setSearchQuery('');
    setScripts((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
    setSelectedScriptId(created.id);
    setActiveScript(created);
    setActiveTab('master');
    // If they left fullText empty in the modal, open directly in Edit mode so they can type!
    setIsEditing(!created.fullText?.trim());
    setMobileView('detail');

    Promise.all([api.getScripts(), api.getFolders()])
      .then(([list, folderList]) => {
        if (Array.isArray(list)) setScripts(list);
        if (Array.isArray(folderList)) setFolders(folderList);
      })
      .catch(() => {});

    showToast('✅ নতুন স্ক্রিপ্ট সেভ হয়েছে!');
  };

  const handleDuplicateScript = async () => {
    if (!activeScript) return;
    const copy = await api.duplicateScript(
      activeScript.id,
      memberIdentity?.name || activeScript.authorName || 'Sumon'
    );
    setScripts((prev) => [copy, ...prev]);
    setSelectedScriptId(copy.id);
    setActiveScript(copy);
    setIsEditing(true);
    showToast('কপি তৈরি হয়েছে');
  };

  const handleDeleteScript = async () => {
    if (!activeScript) return;
    const ok = window.confirm(`"${activeScript.title}" স্ক্রিপ্টটি ডিলিট করতে চান?`);
    if (!ok) return;
    const deletedId = activeScript.id;
    await api.deleteScript(deletedId);
    if (voiceScriptSnapshot?.id === deletedId) {
      setVoiceOpen(false);
      setVoiceScriptSnapshot(null);
    }
    const list = await api.getScripts();
    const safeList = Array.isArray(list) ? list : [];
    setScripts(safeList);
    const nextId = safeList[0]?.id || null;
    setSelectedScriptId(nextId);
    if (!nextId) setMobileView('list');
    showToast('স্ক্রিপ্ট ডিলিট করা হয়েছে');
  };

  const handleAddComment = async (payload) => {
    if (!activeScript) return;
    const createdComment = await api.addComment(activeScript.id, payload);
    setActiveScript((prev) =>
      prev ? { ...prev, comments: [...(prev.comments || []), createdComment] } : prev
    );
    const list = await api.getScripts();
    setScripts(Array.isArray(list) ? list : []);
  };

  const handleToggleResolveComment = async (commentId, nextResolved) => {
    if (!activeScript) return;
    const res = await api.toggleResolveComment(commentId, nextResolved);
    setActiveScript((prev) =>
      prev
        ? {
            ...prev,
            comments: (prev.comments || []).map((c) =>
              c.id === commentId ? { ...c, isResolved: res.isResolved } : c
            ),
          }
        : prev
    );
    const list = await api.getScripts();
    setScripts(Array.isArray(list) ? list : []);
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeScript) return;
    await api.deleteComment(commentId);
    setActiveScript((prev) =>
      prev
        ? {
            ...prev,
            comments: (prev.comments || []).filter((c) => c.id !== commentId),
          }
        : prev
    );
    const list = await api.getScripts();
    setScripts(Array.isArray(list) ? list : []);
  };

  const handleSaveStudioSettings = async (payload) => {
    await api.updateStudio(payload);
    const freshStudio = await api.getStudio();
    setStudio(freshStudio);
    showToast('সেটিংস সেভ হয়েছে');
  };

  const filteredScripts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scripts.filter((s) => {
      if (selectedFolderId && s.folderId !== selectedFolderId) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (q) {
        const hay = `${s.title} ${s.authorName || ''} ${s.previewText || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scripts, selectedFolderId, selectedStatus, searchQuery]);

  const unresolvedCount = useMemo(
    () => (activeScript?.comments || []).filter((c) => !c.isResolved).length,
    [activeScript]
  );

  const openVoiceForCurrentScript = (mode = 'full') => {
    if (!activeScript) return;
    setVoiceScriptSnapshot(activeScript);
    setVoiceInitialMode(mode);
    setVoiceOpen(true);
  };

  if (!memberIdentity?.onboarded || editingIdentity) {
    return (
      <>
        <PwaInstallBanner />
        <WelcomeIdentityModal
          open={true}
          initialIdentity={memberIdentity}
          canClose={Boolean(memberIdentity?.onboarded)}
          onClose={() => setEditingIdentity(false)}
          onSaveIdentity={handleSaveIdentity}
        />
      </>
    );
  }

  const channelUrl = studio.youtubeChannelUrl || SFR_CHANNEL_URL;
  const currentVoiceScript = voiceScriptSnapshot || activeScript;

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col overflow-hidden bg-[#FAF8F5] dark:bg-[#090B10] text-zinc-900 dark:text-zinc-100">
      <PwaInstallBanner />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          studio={studio}
          memberIdentity={memberIdentity}
          onEditIdentity={() => setEditingIdentity(true)}
          folders={folders}
          scripts={filteredScripts}
          selectedScriptId={selectedScriptId}
          onSelectScript={handleSelectScript}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onStartWrite={() => setNewScriptModalOpen(true)}
          mobileVisible={mobileView === 'list'}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onOpenSettings={() => setSettingsModalOpen(true)}
          liveConnected={liveConnected}
        />

        <div
          className={`${
            mobileView === 'detail' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col min-w-0 h-full overflow-hidden`}
        >
          <TopBar
            memberIdentity={memberIdentity}
            onEditIdentity={() => setEditingIdentity(true)}
            isEditing={isEditing}
            onToggleEditing={(next) => {
              setIsEditing(next);
              if (next) setActiveTab('master');
            }}
            onStartWrite={() => setNewScriptModalOpen(true)}
            activeScript={activeScript}
            onBackToFeed={() => setMobileView('list')}
            onOpenTeleprompter={() => activeScript && setTeleprompterOpen(true)}
            onToggleComments={() => activeScript && setCommentsOpen((v) => !v)}
            commentsOpen={commentsOpen}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />

          <main className="flex-1 overflow-y-auto pb-28 lg:pb-12">
            {loadingList || loadingScript ? (
              <div className="max-w-4xl mx-auto p-6 space-y-4 animate-pulse">
                <div className="h-8 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800/80" />
                <div className="h-44 rounded-2xl bg-zinc-200 dark:bg-zinc-800/60" />
              </div>
            ) : !activeScript ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                <img
                  src="/brand/sfr-logo.png"
                  alt="SUMON FROM RANGPUR"
                  width="96"
                  height="96"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-[#FF6B00] shadow-xl shadow-orange-500/20 mb-4"
                />
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  SUMON FROM RANGPUR
                </h2>
                <p className="font-script text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  কোনো পাসওয়ার্ড ঝামেলা ছাড়াই সরাসরি সম্পূর্ণ A–Z স্ক্রিপ্ট লিখুন—সিস্টেম নিজে থেকেই{' '}
                  <strong className="text-[#FF6B00]">শুধু ডায়ালগ ও মূল নির্দেশনা</strong> বের করে দেবে এবং{' '}
                  <strong className="text-[#FF6B00]">স্পষ্ট বাংলা HD ভয়েসে</strong> পড়ে শোনাবে!
                </p>

                <div className="grid grid-cols-3 gap-2 w-full mt-5 text-left">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200 dark:border-zinc-800">
                    <BookOpen className="w-4 h-4 text-[#FF6B00] mb-1" />
                    <p className="font-script font-bold text-xs">A–Z স্ক্রিপ্ট</p>
                    <p className="font-script text-[10px] text-zinc-400">এক ক্লিকে সেভ ও এডিট</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200 dark:border-zinc-800">
                    <Zap className="w-4 h-4 text-[#FF6B00] mb-1" />
                    <p className="font-script font-bold text-xs">অটো ডায়ালগ</p>
                    <p className="font-script text-[10px] text-zinc-400">সময় বাঁচাতে শর্ট ভিউ</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#131720] border border-zinc-200 dark:border-zinc-800">
                    <Volume2 className="w-4 h-4 text-[#FF6B00] mb-1" />
                    <p className="font-script font-bold text-xs">বাংলা HD ভয়েস</p>
                    <p className="font-script text-[10px] text-zinc-400">অ্যাপের বাইরেও শোনা যাবে</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
                  <button
                    onClick={() => setNewScriptModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 text-white font-script text-sm font-bold shadow-lg shadow-orange-500/25 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>নতুন স্ক্রিপ্ট অ্যাড করুন</span>
                  </button>

                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-script text-sm font-bold shadow-md"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>অফিশিয়াল YouTube চ্যানেল</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <ScriptHeader
                  script={activeScript}
                  isEditing={isEditing}
                  defaultWpm={studio.defaultWpm}
                  saveState={saveState}
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  voiceOpen={voiceOpen}
                  onToggleVoice={() => {
                    if (voiceOpen) {
                      setVoiceOpen(false);
                    } else {
                      openVoiceForCurrentScript(activeTab === 'smart' ? 'short' : 'full');
                    }
                  }}
                  onChangeScriptField={handleChangeScriptField}
                  onDuplicateScript={handleDuplicateScript}
                  onDeleteScript={handleDeleteScript}
                />

                {activeTab === 'master' ? (
                  <MasterScriptView
                    fullText={activeScript.fullText || ''}
                    isCreatorMode={isEditing}
                    onToggleEdit={setIsEditing}
                    onChangeFullText={(val) => handleChangeScriptField({ fullText: val })}
                    onSwitchToShortExtract={() => setActiveTab('smart')}
                  />
                ) : (
                  <SmartExtractView
                    fullText={activeScript.fullText || ''}
                    onListenShort={() => openVoiceForCurrentScript('short')}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <SmartVoiceReader
        open={voiceOpen && Boolean(currentVoiceScript)}
        fullText={currentVoiceScript?.fullText || ''}
        scriptTitle={currentVoiceScript?.title || ''}
        initialMode={voiceInitialMode}
        onClose={() => setVoiceOpen(false)}
      />

      <MobileBottomNav
        mobileView={mobileView}
        activeTab={activeTab}
        hasActiveScript={Boolean(activeScript || currentVoiceScript)}
        unresolvedCount={unresolvedCount}
        voiceOpen={voiceOpen}
        onGoHome={() => setMobileView('list')}
        onGoSmartShort={() => {
          if (!activeScript) return;
          setActiveTab('smart');
          setMobileView('detail');
        }}
        onStartWrite={() => setNewScriptModalOpen(true)}
        onToggleVoice={() => {
          if (voiceOpen) {
            setVoiceOpen(false);
          } else if (activeScript) {
            openVoiceForCurrentScript(activeTab === 'smart' ? 'short' : 'full');
          } else if (currentVoiceScript) {
            setVoiceOpen(true);
          }
        }}
        onOpenComments={() => {
          if (activeScript) {
            if (mobileView !== 'detail') setMobileView('detail');
            setCommentsOpen(true);
          }
        }}
      />

      <NewScriptModal
        open={newScriptModalOpen}
        defaultAuthorName={memberIdentity.name}
        onClose={() => setNewScriptModalOpen(false)}
        onCreate={handleCreateScript}
      />

      <StudioSettingsModal
        open={settingsModalOpen}
        studio={studio}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveStudioSettings}
      />

      <TeleprompterModal
        open={teleprompterOpen}
        script={activeScript}
        onClose={() => setTeleprompterOpen(false)}
      />

      <TeamCommentsDrawer
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={activeScript?.comments || []}
        memberIdentity={memberIdentity}
        isCreatorMode={true}
        onAddComment={handleAddComment}
        onToggleResolve={handleToggleResolveComment}
        onDeleteComment={handleDeleteComment}
      />

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-script text-xs font-bold shadow-xl border border-zinc-700/50 no-print whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
