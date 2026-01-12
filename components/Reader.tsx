
import React, { useEffect, useRef, useState } from 'react';
import { Menu, MessageCircle, Loader2, ChevronLeft, ChevronRight, Bookmark, ArrowLeft, Grid, ChevronDown, Type, Minus, Plus, Sun, Moon, Coffee, Check, CheckCircle2, BrainCircuit, Headphones, Play, Pause, X, Mic2, Zap, ScrollText, Feather, BookOpen, Quote, Download } from 'lucide-react';
import { Book, Chapter, Verse, Theme, Bookmark as BookmarkType, ReadProgressMap } from '../types';
import { generatePodcastEpisode } from '../services/aiFeatures';

interface ReaderProps {
  currentBook: Book | null;
  currentChapter: Chapter | null;
  verses: Verse[];
  chaptersList: Chapter[];
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSelectChapter: (chapter: Chapter) => void;
  loading: boolean;
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: number;
  setFontSize?: (s: number) => void;
  fontFamily: string;
  setFontFamily?: (f: string) => void;
  showChapterGrid: boolean;
  setShowChapterGrid: (show: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (o: boolean) => void;
  selectedVerse: Verse | null;
  setSelectedVerse: (v: Verse | null) => void;
  bookmarks: BookmarkType[];
  onToggleBookmark: (v: Verse) => void;
  highlightedVerseId: string | null;
  onQuickAction?: (customText?: string) => void;
  onClearHighlight: () => void;
  // New props for tracker
  readChapters: ReadProgressMap;
  onToggleReadChapter: (bookId: string, chapterNum: string) => void;
  onStartQuiz: () => void;
}

// Lista de fuentes disponibles con sus valores CSS
const AVAILABLE_FONTS = [
  { name: 'Crimson Text', value: "'Crimson Text', serif", type: 'Serif Clásica' },
  { name: 'Merriweather', value: "'Merriweather', serif", type: 'Serif Lectura' },
  { name: 'Lora', value: "'Lora', serif", type: 'Serif Elegante' },
  { name: 'Libre Baskerville', value: "'Libre Baskerville', serif", type: 'Serif Tradicional' },
  { name: 'Inter', value: "'Inter', sans-serif", type: 'Sans UI' },
  { name: 'Lato', value: "'Lato', sans-serif", type: 'Sans Amigable' },
  { name: 'Open Sans', value: "'Open Sans', sans-serif", type: 'Sans Neutra' },
  { name: 'Roboto Slab', value: "'Roboto Slab', serif", type: 'Slab Robusta' },
];

const Reader: React.FC<ReaderProps> = ({
  currentBook, currentChapter, verses, chaptersList,
  onPrevChapter, onNextChapter, onSelectChapter,
  loading, theme, setTheme, fontSize, setFontSize, fontFamily, setFontFamily,
  showChapterGrid, setShowChapterGrid,
  sidebarOpen, setSidebarOpen, rightPanelOpen, setRightPanelOpen,
  selectedVerse, setSelectedVerse, bookmarks, onToggleBookmark, highlightedVerseId,
  onClearHighlight, readChapters, onToggleReadChapter, onStartQuiz
}) => {
  const verseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  // --- PODCAST STATE ---
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [podcastBlob, setPodcastBlob] = useState<Blob | null>(null);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Estados para el modal de personalización del Podcast
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [podcastTone, setPodcastTone] = useState<'fun' | 'deep' | 'meditative'>('fun');
  const [podcastScope, setPodcastScope] = useState<'chapter' | 'selection'>('chapter');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lógica principal de generación del Podcast
  // 1. Recibe el texto (capítulo completo o selección).
  // 2. Llama al servicio de IA (aiFeatures.ts) pasando el texto y el tono.
  // 3. Recibe el buffer de audio y lo reproduce.
  const handleGeneratePodcast = async () => {
    if (!currentBook || !currentChapter) return;
    setShowPodcastModal(false); // Cerramos el modal
    setGeneratingPodcast(true);

    // Decidimos qué texto enviar: ¿Todo el capítulo o solo lo seleccionado?
    let textToProcess = "";
    let title = "";

    if (podcastScope === 'selection' && selectedVerse) {
      textToProcess = selectedVerse.text;
      title = `${currentBook.name} ${currentChapter.number}:${selectedVerse.number}`;
    } else {
      // Por defecto: Capítulo completo
      textToProcess = verses.map(v => v.text).join(" ");
      title = `${currentBook.name} ${currentChapter.number}`;
    }

    try {
      // AQUÍ ESTÁ LA MAGIA: Llamamos a la función que orquesta a Gemini (Guionista + Locutores)
      // Puedes ver esta función en: services/aiFeatures.ts
      const result = await generatePodcastEpisode(textToProcess, title, podcastTone);

      if (result) {
        const audioUrl = URL.createObjectURL(result.blob);
        setPodcastUrl(audioUrl);
        setPodcastBlob(result.blob);
        // Play automatically
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlayingPodcast(true);
          }
        }, 100);
      } else {
        // Manejo de error si no devolvió audio
        console.error("No se generó audio");
      }
    } catch (error) {
      console.error("Error en podcast:", error);
    } finally {
      setGeneratingPodcast(false);
    }
  };

  const downloadPodcast = () => {
    if (!podcastBlob || !currentBook || !currentChapter) return;
    const url = URL.createObjectURL(podcastBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VerboCast_${currentBook.name}_${currentChapter.number}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPodcastModal = () => {
    // Si hay un versículo seleccionado, damos la opción de elegir scope. Si no, forzamos capítulo.
    if (selectedVerse) {
      setPodcastScope('selection');
    } else {
      setPodcastScope('chapter');
    }
    setShowPodcastModal(true);
  };

  // --- OLD AUDIO CONTEXT LOGIC REMOVED ---
  // --- NEW HTML AUDIO ELEMENT LOGIC ---

  const togglePodcastPlayback = () => {
    if (audioRef.current) {
      if (isPlayingPodcast) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingPodcast(!isPlayingPodcast);
    }
  };

  const closePodcast = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPodcastUrl(null);
    setPodcastBlob(null);
    setIsPlayingPodcast(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const toggleSpeed = () => {
    const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // Helper to check if chapter is read
  const isChapterRead = (bookId: string | undefined, chapNum: string) => {
    if (!bookId) return false;
    return readChapters[bookId]?.includes(chapNum);
  };

  const currentIsRead = isChapterRead(currentBook?.id, currentChapter?.number || "0");

  // Efecto robusto para el scroll al versículo resaltado
  useEffect(() => {
    if (!highlightedVerseId) return;
    isAutoScrolling.current = true;
    let attempts = 0;
    const maxAttempts = 15;

    const tryScroll = () => {
      const element = verseRefs.current[highlightedVerseId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Centramos el versículo
        setTimeout(() => { isAutoScrolling.current = false; }, 1000);
        // Force highlight cleanup after 5 seconds
        setTimeout(() => onClearHighlight(), 5000);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 200); // Ligeramente más tiempo entre intentos
      } else {
        isAutoScrolling.current = false;
      }
    };
    setTimeout(tryScroll, 300); // Esperamos un poco más al renderizado
  }, [highlightedVerseId, verses, loading]);

  const handleScroll = () => {
    if (!isAutoScrolling.current && highlightedVerseId) {
      onClearHighlight();
    }
  };

  const currentChapterIndex = chaptersList.findIndex(c => c.id === currentChapter?.id);

  const handleIncreaseFont = () => setFontSize && setFontSize(Math.min(fontSize + 2, 36));
  const handleDecreaseFont = () => setFontSize && setFontSize(Math.max(fontSize - 2, 14));
  const handleFontFamily = (font: string) => setFontFamily && setFontFamily(font);

  return (
    <main className={`flex-1 flex flex-col relative overflow-hidden bg-pattern transition-colors duration-300 ${theme === 'sepia' ? 'bg-[#f4ecd8]' : ''}`}>
      <header className={`h-16 flex items-center justify-between px-4 lg:px-6 border-b z-10 backdrop-blur-md ${theme === 'dark' ? 'bg-[#0a192f]/95 border-blue-900/30' : (theme === 'sepia' ? 'bg-[#f4ecd8]/95 border-[#e2d5b6]' : 'bg-white/95 border-neutral-200')}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl transition-colors hover:bg-blue-800/20 text-orange-500">
            <Menu size={20} />
          </button>

          <div className={`flex items-center gap-3 border-l pl-3 ml-1 ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <span className="text-sm lg:text-base font-black uppercase tracking-widest text-orange-500 truncate max-w-[120px] sm:max-w-none">
              {currentBook?.name || "..."}
            </span>

            <div className="relative">
              <button
                onClick={() => setShowChapterGrid(!showChapterGrid)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-blue-900/30 border-blue-800/50 text-neutral-300 hover:border-orange-500 hover:text-white' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1] text-[#5b4636] hover:border-orange-500' : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:border-orange-500 hover:text-orange-600')}`}
              >
                <Grid size={13} className={theme === 'dark' ? "text-orange-500" : "text-orange-600"} />
                <span>Cap. {currentChapter?.number || "-"}</span>
                <ChevronDown size={11} className="opacity-50" />
                {currentIsRead && <CheckCircle2 size={12} className="text-green-500" />}
              </button>

              {showChapterGrid && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowChapterGrid(false)}></div>
                  <div className={`absolute top-full left-0 mt-2 w-[280px] sm:w-[340px] max-h-[60vh] overflow-y-auto rounded-xl shadow-2xl border z-50 p-4 animate-in fade-in slide-in-from-top-2 custom-scrollbar ${theme === 'dark' ? 'bg-[#0b1625] border-blue-700/50' : (theme === 'sepia' ? 'bg-[#f4ecd8] border-[#e2d5b6]' : 'bg-white border-neutral-200')}`}>
                    <div className={`flex justify-between items-center mb-3 border-b pb-2 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                      <span className="text-[10px] font-black uppercase text-orange-500">Seleccionar Capítulo</span>
                      <span className={`text-[10px] font-bold opacity-50 ${theme === 'sepia' ? 'text-[#5b4636]' : ''}`}>{currentBook?.name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {chaptersList.map(c => {
                        const isRead = isChapterRead(currentBook?.id, c.number);
                        return (
                          <button
                            key={c.id}
                            onClick={() => { onSelectChapter(c); setShowChapterGrid(false); }}
                            className={`p-2 rounded-lg text-xs font-bold transition-all relative ${currentChapter?.id === c.id
                              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105'
                              : (theme === 'dark' ? 'bg-[#1a2d4d] text-neutral-300 hover:bg-blue-800 hover:text-white' : (theme === 'sepia' ? 'bg-[#eaddcf] text-[#5b4636] hover:bg-[#d3c4b1]' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'))
                              }`}
                          >
                            {c.number}
                            {isRead && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowAppearanceMenu(!showAppearanceMenu)}
              className={`p-2.5 rounded-full transition-all ${showAppearanceMenu ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-blue-800/20 text-orange-500'}`}
            >
              <Type size={20} />
            </button>

            {showAppearanceMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowAppearanceMenu(false)}></div>
                <div className={`absolute top-full right-0 mt-2 w-[280px] rounded-xl shadow-2xl border z-50 p-4 animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'bg-[#0b1625] border-blue-700/50 text-white' : (theme === 'sepia' ? 'bg-[#f4ecd8] border-[#e2d5b6] text-[#5b4636]' : 'bg-white border-neutral-200 text-neutral-800')}`}>

                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase opacity-50 block mb-2">Tamaño de Texto</span>
                    <div className={`flex items-center justify-between p-1 rounded-lg border ${theme === 'dark' ? 'bg-[#1a2d4d] border-blue-900/50' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-neutral-100 border-neutral-200')}`}>
                      <button onClick={handleDecreaseFont} className="p-2 hover:text-orange-500 transition-colors"><Minus size={16} /></button>
                      <span className="font-bold text-sm">{fontSize}px</span>
                      <button onClick={handleIncreaseFont} className="p-2 hover:text-orange-500 transition-colors"><Plus size={16} /></button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase opacity-50 block mb-2">Tipografía</span>
                    <div className={`grid grid-cols-1 gap-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1`}>
                      {AVAILABLE_FONTS.map((font) => (
                        <button
                          key={font.name}
                          onClick={() => handleFontFamily(font.value)}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all text-left group ${fontFamily === font.value
                            ? (theme === 'dark' ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white')
                            : (theme === 'dark' ? 'hover:bg-[#1a2d4d]' : 'hover:bg-black/5')}`}
                          style={{ fontFamily: font.value }}
                        >
                          <span>{font.name}</span>
                          {fontFamily === font.value && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase opacity-50 block mb-2">Tema</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setTheme('light')} className={`p-2 rounded-lg border flex justify-center ${theme === 'light' ? 'border-orange-500 bg-neutral-100 text-orange-500' : 'border-neutral-200 bg-neutral-100 text-neutral-400'}`}><Sun size={18} /></button>
                      <button onClick={() => setTheme('sepia')} className={`p-2 rounded-lg border flex justify-center ${theme === 'sepia' ? 'border-orange-500 bg-[#f4ecd8] text-[#5b4636]' : 'border-[#e2d5b6] bg-[#f4ecd8] text-[#d3c4b1]'}`}><Coffee size={18} /></button>
                      <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg border flex justify-center ${theme === 'dark' ? 'border-orange-500 bg-[#0a192f] text-orange-500' : 'border-blue-900/50 bg-[#0a192f] text-blue-800'}`}><Moon size={18} /></button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={openPodcastModal}
              disabled={generatingPodcast}
              className={`p-2.5 rounded-full transition-all ${generatingPodcast ? 'animate-pulse text-orange-500 bg-orange-100' : 'hover:bg-blue-800/20 text-orange-500'}`}
              title="Crear Podcast VerboCast"
            >
              {generatingPodcast ? <Loader2 size={20} className="animate-spin" /> : <Headphones size={20} />}
            </button>
          </div>

          {/* --- MODAL DE PERSONALIZACIÓN DE PODCAST (Rediseñado - Premium) --- */}
          {/* --- MODAL DE PERSONALIZACIÓN DE PODCAST (Pixel Perfect v4) --- */}
          {showPodcastModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-32 px-4 animate-in fade-in duration-200" style={{ margin: 0 }}>
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-transparent"
                onClick={() => setShowPodcastModal(false)}
              ></div>

              {/* Modal Card */}
              <div
                className={`w-full max-w-[320px] relative z-20 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col overflow-hidden ring-1 ring-white/10 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-[#0f172a] text-white'}`}
                onClick={e => e.stopPropagation()}
              >

                {/* Header */}
                <div className="px-5 pt-5 pb-2 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic2 size={16} className="text-white" />
                    <span className="font-black text-sm uppercase tracking-widest text-white">VERBOCAST</span>
                  </div>
                  <button
                    onClick={() => setShowPodcastModal(false)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>

                <div className="w-full h-px bg-white/10 mx-auto mb-4 scale-x-90"></div>

                {/* Content */}
                <div className="px-5 pb-6 space-y-5">

                  {/* ORIGEN */}
                  <section>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ORIGEN</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPodcastScope('chapter')}
                        className={`flex-1 py-1.5 px-3 rounded-full border text-xs font-bold transition-all uppercase tracking-wide flex items-center justify-center gap-2 ${podcastScope === 'chapter'
                          ? 'bg-orange-600 border-orange-600 text-white'
                          : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400'}`}
                      >
                        <BookOpen size={12} /> CAP.
                      </button>

                      <button
                        onClick={() => setPodcastScope('selection')}
                        disabled={!selectedVerse}
                        className={`flex-1 py-1.5 px-3 rounded-full border text-xs font-bold transition-all uppercase tracking-wide flex items-center justify-center gap-2 ${podcastScope === 'selection' && selectedVerse
                          ? 'bg-orange-600 border-orange-600 text-white'
                          : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400'} ${!selectedVerse ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <Quote size={12} /> VERSO
                      </button>
                    </div>
                  </section>

                  {/* ESTILO */}
                  <section>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ESTILO</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setPodcastTone('fun')}
                        className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all group ${podcastTone === 'fun'
                          ? 'border-white/20 bg-white/5 text-white ring-1 ring-white/20'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <Zap size={16} className={podcastTone === 'fun' ? 'text-blue-400' : 'opacity-50'} />
                        <span className="text-sm font-bold">Divertido (MJ)</span>
                      </button>

                      <button
                        onClick={() => setPodcastTone('deep')}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all group ${podcastTone === 'deep'
                          ? 'border-white/20 bg-white/5 text-white ring-1 ring-white/20'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <ScrollText size={16} className={podcastTone === 'deep' ? 'text-purple-400' : 'opacity-50'} />
                        <span className="text-sm font-bold">Teológico</span>
                      </button>

                      <button
                        onClick={() => setPodcastTone('meditative')}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all group ${podcastTone === 'meditative'
                          ? 'border-white/20 bg-white/5 text-white ring-1 ring-white/20'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <Feather size={16} className={podcastTone === 'meditative' ? 'text-green-400' : 'opacity-50'} />
                        <span className="text-sm font-bold">Meditativo</span>
                      </button>
                    </div>
                  </section>

                  {/* GENERATE BUTTON */}
                  <button
                    onClick={handleGeneratePodcast}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs mt-2"
                  >
                    <Headphones size={16} />
                    <span>PRODUCIR EPISODIO</span>
                  </button>

                </div>
              </div>
            </div>
          )}



          <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`p-2.5 rounded-full transition-all ${rightPanelOpen ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-blue-800/20 text-orange-500'}`}><MessageCircle size={20} /></button>
        </div >
      </header >

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
            <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Cargando Palabra...</p>
          </div>
        ) : (
          <div className={`max-w-2xl mx-auto py-6 lg:py-8 px-5 lg:px-6`}>
            <div className="text-center mb-6">
              <h2 className="text-lg font-black mb-3 uppercase tracking-widest text-orange-500/90">{currentBook?.name}</h2>
              <div className="flex items-center justify-center gap-6">
                <button onClick={onPrevChapter} className="p-2.5 bg-blue-900/20 rounded-full hover:bg-orange-600 hover:text-white transition-all text-orange-500"><ChevronLeft size={18} /></button>
                <span className="text-3xl italic font-black text-orange-500 select-none">{currentChapter?.number}</span>
                <button onClick={onNextChapter} className="p-2.5 bg-blue-900/20 rounded-full hover:bg-orange-600 hover:text-white transition-all text-orange-500"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="space-y-4 mb-16" style={{ fontSize: `${fontSize}px`, lineHeight: 1.65, fontFamily: fontFamily }}>
              {verses.map(v => {
                const isHighlighted = highlightedVerseId === v.number;
                const isSelected = selectedVerse?.id === v.id;

                return (
                  <div
                    key={v.id}
                    id={`verse-${v.number}`}
                    ref={el => { verseRefs.current[v.number] = el; }}
                    className={`group flex gap-3 p-4 rounded-xl transition-all cursor-pointer relative duration-500
                      ${isHighlighted
                        ? 'bg-[#1a2d4d] border-l-4 border-orange-500 shadow-2xl scale-[1.02] z-10 my-4'
                        : (isSelected ? 'bg-orange-600/10 border-l-4 border-orange-600/50' : 'hover:bg-blue-800/10 border-l-4 border-transparent')
                      }`}
                    onClick={() => setSelectedVerse(v)}
                  >
                    {isHighlighted && (
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-orange-500 text-white p-1 rounded-full shadow-lg animate-bounce hidden lg:block z-20">
                        <ArrowLeft size={20} strokeWidth={3} />
                      </div>
                    )}

                    <div className="w-8 shrink-0 text-right pt-1">
                      <span className={`font-black text-[0.65em] font-mono ${isHighlighted ? 'text-orange-500 scale-110' : 'text-orange-500/50'}`}>{v.number}</span>
                    </div>
                    <p className={`flex-1 ${theme === 'dark' ? 'text-neutral-200' : (theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-800')} leading-relaxed`}>
                      {v.text.trim()}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleBookmark(v); }}
                      className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${bookmarks.find(b => b.id === v.id) ? 'text-orange-500' : 'text-neutral-500'}`}
                    >
                      <Bookmark size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* TRACKER BUTTON */}
            {!loading && verses.length > 0 && (
              <div className="flex flex-col gap-6 border-t pt-8 pb-48 border-orange-500/20">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => currentBook && currentChapter && onToggleReadChapter(currentBook.id, currentChapter.number)}
                    className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentIsRead
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'bg-orange-600/10 text-orange-600 border border-orange-600/20 hover:bg-orange-600 hover:text-white'
                      }`}
                  >
                    {currentIsRead ? <><CheckCircle2 size={20} /> Capítulo Leído</> : <><Check size={20} /> Marcar como Leído</>}
                  </button>

                  <button
                    onClick={onStartQuiz}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <BrainCircuit size={20} strokeWidth={2.5} /> Reflexionar
                  </button>
                </div>

                <div className={`flex items-center justify-between`}>
                  <button onClick={onPrevChapter} className="flex flex-col items-start p-4 rounded-2xl hover:bg-blue-900/20 group max-w-[45%]">
                    <span className="text-[10px] font-black uppercase opacity-40 group-hover:text-orange-500">Anterior</span>
                    <div className="flex items-center gap-2 text-orange-500 font-bold text-sm">
                      <ChevronLeft size={16} /> <span className="truncate">{currentChapterIndex === 0 ? 'Libro Anterior' : `Cap. ${parseInt(currentChapter?.number || '1') - 1}`}</span>
                    </div>
                  </button>
                  <button onClick={onNextChapter} className="flex flex-col items-end p-4 rounded-2xl hover:bg-blue-900/20 group max-w-[45%]">
                    <span className="text-[10px] font-black uppercase opacity-40 group-hover:text-orange-500">Siguiente</span>
                    <div className="flex items-center gap-2 text-orange-500 font-bold text-sm">
                      <span className="truncate">{currentChapterIndex === chaptersList.length - 1 ? 'Siguiente Libro' : `Cap. ${parseInt(currentChapter?.number || '1') + 1}`}</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {
        podcastUrl && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50 animate-in slide-in-from-bottom-6">
            <div className={`rounded-3xl shadow-2xl p-5 flex flex-col gap-4 border border-white/10 relative overflow-hidden backdrop-blur-md ${theme === 'dark' ? 'bg-[#0b1625]/90 text-white shadow-black/50' : 'bg-white/95 text-neutral-900 shadow-neutral-200/50'}`}>

              <audio
                ref={audioRef}
                src={podcastUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlayingPodcast(false)}
                className="hidden"
              />

              {/* Top Row: Info & Close */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isPlayingPodcast ? 'bg-orange-500 text-white animate-pulse' : 'bg-neutral-200 dark:bg-white/10 text-neutral-500'}`}>
                    <Headphones size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-0.5">VerboCast</p>
                    <p className="text-sm font-bold truncate leading-tight">{currentBook?.name} {currentChapter?.number}</p>
                  </div>
                </div>
                <button onClick={closePodcast} className="p-2 opacity-50 hover:opacity-100 hover:text-red-500 transition-colors -mr-2 -mt-2">
                  <X size={20} />
                </button>
              </div>

              {/* Seek Bar */}
              <div className="w-full relative py-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md transition-all"
                />
                <div className="flex justify-between text-[10px] font-bold opacity-40 mt-1 tabular-nums tracking-wider">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <button onClick={toggleSpeed} className="w-10 text-[10px] font-black opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest">{playbackRate}x</button>

                <div className="flex items-center gap-4">
                  <button onClick={skipBackward} className="p-2 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-all" title="-10s">
                    <div className="transform rotate-180"><ArrowLeft size={20} /></div>
                  </button>

                  <button
                    onClick={togglePodcastPlayback}
                    className="w-14 h-14 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlayingPodcast ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                  </button>

                  <button onClick={skipForward} className="p-2 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-all" title="+10s">
                    <ArrowLeft size={20} className="" />
                  </button>
                </div>

                <button
                  onClick={downloadPodcast}
                  className={`p-2 rounded-full transition-all opacity-50 hover:opacity-100 ${theme === 'dark' ? 'text-white hover:text-orange-500 hover:bg-white/10' : 'text-neutral-500 hover:text-orange-600 hover:bg-neutral-200'}`}
                  title="Descargar MP3"
                >
                  <Download size={20} />
                </button>
              </div>

            </div>
          </div>
        )
      }
    </main >
  );
};

export default Reader;
