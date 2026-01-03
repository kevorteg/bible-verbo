
import React, { useRef, useEffect, useState } from 'react';
import {
  X, Quote, ImageIcon, Copy, Volume2, StickyNote, Book,
  BookMarked, Trash2, Send, Loader2, Microscope, PenTool, HeartHandshake, MessageCircle, Sunrise, Share2, BrainCircuit, Trophy, RefreshCcw, Save, Check, MapPin, Navigation, Map as MapIcon
} from 'lucide-react';
import { ChatMessage, Verse, Bookmark, NoteMap, Book as IBook, Chapter, QuizQuestion, ChurchLocation } from '../types';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: string;
  chatMessages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  isTyping: boolean;
  onSendMessage: (customText?: string, isStudy?: boolean, location?: { latitude: number, longitude: number }) => void;
  onGenerateImage: () => void;
  onSpeak: (text: string) => Promise<void>;
  onClearChat: () => void;
  selectedVerse: Verse | null;
  currentBook: IBook | null;
  currentChapter: Chapter | null;
  onClearSelection: () => void;
  notes: NoteMap;
  onSaveNote: (content: string, id?: string) => void;
  bookmarks: Bookmark[];
  onToggleBookmark: (verse: Verse | Bookmark) => void;
  onNavigateToBookmark: (bookmark: Bookmark) => void;

  onOpenShare: () => void;
  onStartQuiz: () => void;
  quizData: QuizQuestion[];
  quizState: 'idle' | 'loading' | 'active' | 'finished';
  currentQuizIndex: number;
  quizScore: number;
  onAnswerQuiz: (idx: number) => void;
  onResetQuiz: () => void;
  onNavigateToMapPage: () => void;
  quizSelectedOption?: number | null;
  quizShowFeedback?: boolean;
  onQuizNextQuestion?: () => void;
  quizUserAnswers?: (number | null)[];
  quizDifficulty?: 'facil' | 'medio' | 'dificil';
  quizTopic?: 'general' | 'historia' | 'teologia' | 'aplicacion';
  onSetQuizDifficulty?: (d: 'facil' | 'medio' | 'dificil') => void;
  onSetQuizTopic?: (t: 'general' | 'historia' | 'teologia' | 'aplicacion') => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  isOpen, onClose, activeTab, setActiveTab, theme,
  chatMessages, inputMessage, setInputMessage, isTyping, onSendMessage, onGenerateImage, onSpeak, onClearChat,
  selectedVerse, currentBook, currentChapter, onClearSelection,
  notes, onSaveNote, bookmarks, onToggleBookmark, onNavigateToBookmark,
  onOpenShare, onStartQuiz, quizData, quizState, currentQuizIndex, quizScore, onAnswerQuiz, onResetQuiz, onNavigateToMapPage,
  quizSelectedOption, quizShowFeedback, onQuizNextQuestion, quizUserAnswers,
  quizDifficulty, quizTopic, onSetQuizDifficulty, onSetQuizTopic
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  const handleSpeak = async (text: string, messageId: string) => {
    if (audioLoadingId) return; // Evitar múltiples clicks
    setAudioLoadingId(messageId);
    try {
      await onSpeak(text);
    } catch (error) {
      console.error("Error playing audio", error);
    } finally {
      setAudioLoadingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'ia') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Clases dinámicas por tema
  const containerClasses = theme === 'dark'
    ? 'bg-[#0d1e3a] border-blue-900/40 shadow-2xl'
    : theme === 'sepia'
      ? 'bg-[#f4ecd8] border-[#e2d5b6] shadow-xl'
      : 'bg-white border-neutral-200 shadow-2xl';

  const tabTextClasses = theme === 'dark' ? 'dark:text-white' : (theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-800');

  const assistantBubbleClasses = theme === 'dark'
    ? 'bg-blue-900/10 dark:bg-blue-900/30 text-neutral-200 border-blue-800/40'
    : theme === 'sepia'
      ? 'bg-[#eaddcf] text-[#5b4636] border-[#d3c4b1]'
      : 'bg-neutral-100 text-neutral-800 border-transparent';

  const inputAreaClasses = theme === 'dark' ? 'bg-[#0d1e3a] border-blue-900/30' : (theme === 'sepia' ? 'bg-[#f4ecd8] border-[#e2d5b6]' : 'bg-white border-neutral-200');

  const textAreaClasses = theme === 'dark'
    ? 'bg-[#0a192f] border-blue-900/50 text-white'
    : theme === 'sepia'
      ? 'bg-[#fdfaf5] border-[#d3c4b1] text-[#5b4636]'
      : 'bg-white border-neutral-200 text-black';

  // Lógica para ID de Nota
  const getNoteId = () => {
    if (selectedVerse) return selectedVerse.id;
    if (currentBook && currentChapter) return `${currentBook.id}-${currentChapter.number}-GENERAL`;
    return "temp-note";
  };

  const currentNoteId = getNoteId();

  const handleManualSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const renderMessageContent = (text: string) => {
    // Eliminamos el bloque de datos del mapa si llega a aparecer
    const cleanText = text.replace(/<<<MAP_DATA_START>>>[\s\S]*?<<<MAP_DATA_END>>>/g, '');

    const parts = cleanText.split(/(\[CONTACTO:[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[CONTACTO:')) {
        const content = part.replace('[CONTACTO:', '').replace(']', '');
        const [name, phone] = content.split('|');
        return (
          <a key={index} href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-xl my-2 transition-all shadow-lg transform hover:scale-[1.02] no-underline group">
            <div className="bg-white/20 p-2 rounded-full"><MessageCircle size={20} className="fill-current" /></div>
            <div className="flex flex-col text-left"><span className="text-[10px] uppercase font-bold opacity-90">Hablar ahora con</span><span className="font-bold text-sm">{name}</span></div>
          </a>
        );
      }
      const textParts = part.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={index} className="inline">
          {textParts.map((subPart, subIndex) => {
            if (subIndex % 2 === 1) {
              const content = subPart.trim();
              const prevText = subIndex > 0 ? textParts[subIndex - 1] : null;
              const isStartOfLine = prevText === null || prevText === "" || prevText.endsWith('\n');
              const isTitle = content.endsWith(':') && isStartOfLine;
              if (isTitle) return <span key={subIndex} className="block mt-4 mb-2 font-black text-orange-500 text-[11px] uppercase tracking-widest border-l-2 border-orange-500 pl-2">{content.replace(/:$/, '')}</span>;
              else return <strong key={subIndex} className="font-black text-orange-500">{subPart}</strong>;
            }
            const lines = subPart.split('\n');
            return (
              <span key={subIndex}>
                {lines.map((line, lineIdx) => {
                  const trimmed = line.trim();
                  // Check for Markdown Links [Title](Url)
                  const linkMatch = trimmed.match(/\[(.*?)\]\((.*?)\)/);
                  if (linkMatch) {
                    return (
                      <div key={lineIdx} className="mb-2">
                        <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white transition-all border border-orange-500/20">
                          <MapPin size={16} />
                          <span className="font-bold text-sm">{linkMatch[1]}</span>
                        </a>
                      </div>
                    );
                  }

                  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) return <div key={lineIdx} className="flex items-start gap-2 ml-2 mb-1.5 w-full"><span className="text-orange-500 font-bold text-sm leading-none mt-1">•</span><span className="flex-1 text-[13px]">{trimmed.substring(2)}</span></div>;
                  const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                  if (numMatch) return <div key={lineIdx} className="flex items-start gap-2 ml-2 mb-1.5 w-full"><span className="text-orange-500 font-bold text-xs font-mono mt-0.5">{numMatch[1]}.</span><span className="flex-1 text-[13px]">{numMatch[2]}</span></div>;
                  if (!trimmed && lineIdx < lines.length - 1) return <br key={lineIdx} />;
                  if (!trimmed) return null;
                  const bibleRefParts = line.split(/((?:[123]\s?)?[A-ZÑÁÉÍÓÚ][a-zñáéíóú]+\s+\d+:\d+(?:-\d+)?)/g);
                  return <React.Fragment key={lineIdx}>{bibleRefParts.map((bp, bpIdx) => { if (bpIdx % 2 === 1) return <button key={bpIdx} onClick={() => onSendMessage(bp)} className="text-orange-500 hover:text-orange-400 font-bold hover:underline cursor-pointer" title="Ir al pasaje">{bp}</button>; return bp; })}{lineIdx < lines.length - 1 && <br />}</React.Fragment>;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <>
      <aside className={`fixed inset-y-0 right-0 z-[50] flex flex-col h-full border-l transition-all duration-300 transform 
      ${isOpen ? 'translate-x-0 w-full max-w-[380px] lg:relative lg:translate-x-0' : 'translate-x-full w-0 overflow-hidden border-none lg:w-0'} 
      ${containerClasses}`}>

        <div className={`flex border-b shrink-0 ${theme === 'dark' ? 'border-blue-900/30' : (theme === 'sepia' ? 'border-[#e2d5b6]' : 'border-neutral-200')}`}>
          {['ia', 'quiz', 'notes'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest flex justify-center items-center gap-1 ${activeTab === t ? 'text-orange-500 border-b-2 border-orange-500' : `opacity-40 hover:opacity-100 ${tabTextClasses}`}`}
            >
              {t === 'ia' && 'IA'}
              {t === 'quiz' && 'Trivia'}
              {t === 'notes' && 'Notas'}
            </button>
          ))}
          <div className="flex items-center px-2">
            {activeTab === 'ia' && <button onClick={onClearChat} className="p-3 opacity-40 hover:opacity-100 text-orange-500"><Trash2 size={18} /></button>}
            <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100 text-orange-500"><X size={20} /></button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-5 custom-scrollbar ${theme === 'dark' ? 'bg-[#0a192f]/40' : (theme === 'sepia' ? 'bg-[#f4ecd8]/40' : 'bg-neutral-50/50')}`}>

          {/* TAB: TRIVIA */}
          {activeTab === 'quiz' && (
            <div className="h-full flex flex-col items-center">
              {quizState === 'finished' && (
                <div className="flex flex-col items-center h-full animate-in zoom-in pb-10">
                  <div className="flex flex-col items-center justify-center text-center gap-4 mt-8 mb-8">
                    <Trophy size={80} className="text-yellow-500 drop-shadow-2xl" strokeWidth={1.5} />
                    <div>
                      <h3 className={`text-2xl font-black uppercase tracking-widest mb-1 text-white`}>¡Completado!</h3>
                      <p className={`text-sm opacity-70 text-blue-200`}>Tu puntuación final</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-orange-500">{quizScore}</span>
                      <span className="text-3xl font-black text-blue-200/30">/ {quizData.length}</span>
                    </div>
                  </div>

                  {/* Error Review Section */}
                  {quizScore < quizData.length && (
                    <div className="w-full mb-6 animate-in slide-in-from-bottom-5">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="bg-red-500/20 p-1 rounded">
                          <X size={14} className="text-red-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Repaso de Errores</span>
                      </div>
                      <div className="space-y-4">
                        {quizData.map((q, idx) => {
                          const userAnswer = quizUserAnswers?.[idx];
                          const isCorrect = userAnswer === q.correctIndex;

                          if (isCorrect || userAnswer === null || userAnswer === undefined) return null;

                          return (
                            <div key={idx} className="p-4 rounded-xl border border-red-500/30 bg-[#1a0f0f]">
                              <p className="text-[10px] font-black uppercase text-white/30 mb-2">Pregunta {idx + 1}</p>
                              <p className="text-sm font-bold text-red-400 mb-3">{q.question}</p>
                              <div className="bg-[#0f2416] border border-green-500/30 rounded-lg p-3">
                                <p className="text-[9px] font-black uppercase text-green-500 mb-0.5">Correcta:</p>
                                <p className="text-xs text-green-100">{q.options[q.correctIndex]}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={onResetQuiz}
                    className="w-full py-4 bg-white text-neutral-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 mt-auto shadow-xl"
                  >
                    <RefreshCcw size={16} /> Intentar Nuevo Quiz
                  </button>
                </div>
              )}
              {quizState === 'idle' && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6 mt-4 w-full px-4">
                  <BrainCircuit size={48} className="text-orange-500 animate-pulse" />
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest mb-1 text-orange-500">Trivia Bíblica</h3>
                    <p className={`text-xs opacity-70 max-w-[200px] mx-auto ${tabTextClasses}`}>Personaliza tu desafío</p>
                  </div>

                  {/* Selectors */}
                  <div className="w-full space-y-4">
                    {/* Difficulty Selector */}
                    <div className="space-y-2">
                      <p className={`text-[9px] font-black uppercase tracking-widest opacity-50 text-left ${tabTextClasses}`}>Nivel de Dificultad</p>
                      <div className="flex gap-2">
                        {[
                          { id: 'facil', label: 'Explorador', icon: '🌱' },
                          { id: 'medio', label: 'Discípulo', icon: '🔥' },
                          { id: 'dificil', label: 'Maestro', icon: '👑' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            onClick={() => onSetQuizDifficulty && onSetQuizDifficulty(d.id as any)}
                            className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${quizDifficulty === d.id ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-105' : `bg-transparent border-neutral-500/20 opacity-60 hover:opacity-100 ${tabTextClasses}`}`}
                          >
                            <span className="text-lg">{d.icon}</span>
                            <span className="text-[9px] font-bold uppercase">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Topic Selector */}
                    <div className="space-y-2">
                      <p className={`text-[9px] font-black uppercase tracking-widest opacity-50 text-left ${tabTextClasses}`}>Enfoque del Estudio</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'general', label: 'General' },
                          { id: 'historia', label: 'Historia' },
                          { id: 'teologia', label: 'Teología' },
                          { id: 'aplicacion', label: 'Práctico' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => onSetQuizTopic && onSetQuizTopic(t.id as any)}
                            className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${quizTopic === t.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : `bg-transparent border-neutral-500/20 opacity-60 hover:opacity-100 ${tabTextClasses}`}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={onStartQuiz} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-600/20 hover:scale-[1.02] transition-all mt-4 border border-orange-400/30">
                    Iniciar Desafío
                  </button>
                </div>
              )}
              {quizState === 'loading' && <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 mt-20"><Loader2 className="animate-spin text-orange-500" size={32} /><p className={`text-[10px] font-black uppercase tracking-[0.3em] ${tabTextClasses}`}>Creando desafío...</p></div>}
              {quizState === 'active' && quizData[currentQuizIndex] && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-5 pb-20">
                  {/* Header Progress */}
                  <div className="flex justify-between items-center mb-6 px-1">
                    <span className="text-[10px] font-black uppercase text-blue-300/50 tracking-widest">Pregunta {currentQuizIndex + 1} de {quizData.length}</span>
                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Puntos: {quizScore}</span>
                  </div>

                  {/* Question Card */}
                  <div className={`p-6 rounded-2xl mb-6 shadow-2xl bg-[#13233f] border border-blue-900/30 text-white min-h-[140px] flex items-center justify-center text-center`}>
                    <p className="font-bold text-lg leading-relaxed">{quizData[currentQuizIndex].question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {quizData[currentQuizIndex].options.map((opt, idx) => {
                      const isSelected = quizSelectedOption === idx;
                      const isCorrect = idx === quizData[currentQuizIndex].correctIndex;
                      const showResult = quizShowFeedback;

                      let btnClass = 'bg-[#0b1625] border-blue-900/30 text-blue-200/80 hover:border-blue-500/50'; // Default dark theme style

                      if (showResult) {
                        if (isCorrect) btnClass = 'bg-[#1a9d48] border-[#1a9d48] text-white font-bold ring-2 ring-[#1a9d48]/50 lg:scale-[1.02] shadow-lg shadow-green-900/40';
                        else if (isSelected) btnClass = 'bg-[#1a2d4d] border-red-500 text-red-400 opacity-50';
                        else btnClass = 'bg-[#0b1625] border-blue-900/30 text-blue-200/50 opacity-40';
                      } else if (isSelected) {
                        btnClass = 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-500/50';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => onAnswerQuiz(idx)}
                          disabled={showResult}
                          className={`w-full p-4 rounded-xl text-left text-sm transition-all border flex items-center justify-between group ${btnClass}`}
                        >
                          <span>{opt}</span>
                          {showResult && isCorrect && <div className="bg-white/20 p-1 rounded-full"><Check size={14} className="text-white" strokeWidth={3} /></div>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback & Next Button */}
                  {quizShowFeedback && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="p-5 rounded-xl mb-6 border bg-[#0f1f38] border-blue-800/30">
                        <div className="flex items-center gap-2 mb-2 text-blue-300/80">
                          <BrainCircuit size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Explicación:</span>
                        </div>
                        <p className="text-sm text-blue-100/90 leading-relaxed pl-6">{quizData[currentQuizIndex].explanation}</p>
                      </div>
                      <button
                        onClick={onQuizNextQuestion}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        Siguiente Pregunta <Navigation size={18} className="rotate-90" strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              )}</div>
          )}

          {/* TAB: IA CHAT */}
          <div className={`space-y-6 pb-48 ${activeTab === 'ia' ? 'block' : 'hidden'}`}>
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                <div className={`max-w-[90%] p-4 rounded-[1.5rem] text-[13px] leading-relaxed relative group ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none shadow-orange-600/10' : `${assistantBubbleClasses} rounded-bl-none border`}`}>
                  {m.image && <img src={m.image} alt="Generated" className="w-full h-auto rounded-2xl mb-4 shadow-xl" />}
                  <div className="whitespace-pre-wrap text-left w-full">
                    {renderMessageContent(String(m.text))}
                  </div>
                  {/* Actions Toolbar - Always Visible */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    {/* Speak Button (Prominent) */}
                    {m.role !== 'user' && m.text && (
                      <button
                        onClick={() => handleSpeak(m.text, m.id.toString())}
                        disabled={audioLoadingId === m.id.toString()}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider group/speak ${audioLoadingId === m.id.toString() ? 'bg-orange-600/20 text-orange-400 cursor-wait' : 'bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white'}`}
                      >
                        {audioLoadingId === m.id.toString() ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} className="group-hover/speak:animate-pulse" />
                            Escuchar
                          </>
                        )}
                      </button>
                    )}

                    {/* Copy Button (Subtle) */}
                    <button onClick={() => copyToClipboard(m.text)} className="p-1.5 hover:bg-white/10 rounded-full opacity-50 hover:opacity-100 transition-all text-current" title="Copiar">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-blue-900/30 p-3 rounded-2xl flex gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></span></div></div>}
            <div ref={chatEndRef} />
          </div>

          {/* NOTES & BOOKMARKS TABS */}
          {(activeTab === 'notes' || activeTab === 'bookmarks') && (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-orange-500/50 flex items-center gap-2">
                {activeTab === 'notes' ? <><StickyNote size={12} /> Editor de Notas</> : <><BookMarked size={12} /> Favoritos Guardados</>}
              </p>

              {activeTab === 'notes' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className={`p-3 rounded-xl border ${selectedVerse ? 'bg-orange-600/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-800/20'}`}>
                    <p className="text-[10px] font-black uppercase text-orange-500 mb-1">
                      {selectedVerse ? 'Nota sobre Versículo:' : 'Nota General del Capítulo:'}
                    </p>
                    <p className={`text-xs font-bold ${tabTextClasses}`}>
                      {selectedVerse
                        ? `${currentBook?.name} ${currentChapter?.number}:${selectedVerse.number}`
                        : `${currentBook?.name} ${currentChapter?.number}`
                      }
                    </p>
                  </div>
                  <textarea
                    className={`w-full border rounded-2xl p-5 text-sm min-h-[300px] outline-none resize-none transition-all shadow-inner ${textAreaClasses} focus:border-orange-500`}
                    placeholder={selectedVerse ? "Escribe tu revelación sobre este verso..." : "Escribe tus notas generales sobre este capítulo..."}
                    value={notes[currentNoteId] || ""}
                    onChange={(e) => onSaveNote(e.target.value, currentNoteId)}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] opacity-40 italic max-w-[70%]">
                      {selectedVerse ? "Selecciona otro verso para cambiar de nota." : "Selecciona un verso para crear una nota específica."}
                    </p>
                    <button
                      onClick={handleManualSave}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                    >
                      {saveStatus === 'saved' ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'bookmarks' && (
                bookmarks.length === 0 ? <div className="text-center py-20 opacity-40 italic text-sm text-neutral-400">Sin favoritos aún.</div> :
                  bookmarks.map(b => (
                    <div key={b.id} className={`p-4 rounded-2xl border group transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#1a2d4d] border-blue-900/40 hover:border-orange-500/50 text-white' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1] hover:border-orange-500/50 text-[#5b4636]' : 'bg-white border-neutral-200 hover:border-orange-500/50 text-neutral-800')}`} onClick={() => onNavigateToBookmark(b)}>
                      <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-orange-500 uppercase">{b.bookName} {b.chapterNum}:{b.number}</span><button onClick={(e) => { e.stopPropagation(); onToggleBookmark(b); }}><Trash2 size={12} className="opacity-40 hover:text-red-500 transition-colors" /></button></div>
                      <p className="text-xs italic opacity-60 line-clamp-2">"{b.text}"</p>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {activeTab === 'ia' && (
          <div className={`p-4 lg:p-5 border-t shrink-0 ${inputAreaClasses}`}>
            {selectedVerse && (
              <div className="p-4 rounded-2xl bg-orange-600/5 border border-orange-600/10 mb-4 animate-in slide-in-from-bottom-2 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-2"><Quote size={10} /> Estudio de: {currentBook?.name} {currentChapter?.number}:{selectedVerse.number}</p>
                  <button onClick={onClearSelection}><X size={12} className="opacity-20 text-orange-500 hover:opacity-100" /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={onGenerateImage} className="flex flex-col items-center justify-center gap-1 py-2 bg-orange-600 text-white rounded-xl text-[8px] font-black uppercase"><ImageIcon size={14} /> Imagen</button>
                  <button onClick={onOpenShare} className={`flex flex-col items-center justify-center gap-1 py-2 border border-orange-500/20 rounded-xl text-[8px] font-black uppercase ${theme === 'dark' ? 'bg-blue-900/10 dark:bg-blue-900/40 text-orange-500' : (theme === 'sepia' ? 'bg-[#eaddcf] text-orange-600' : 'bg-blue-900/10 text-orange-500')}`}><Share2 size={14} /> Compartir</button>
                  <button onClick={() => onSendMessage(`Haz un análisis teológico de ${currentBook?.name} ${currentChapter?.number}:${selectedVerse.number}`, true)} className={`flex flex-col items-center justify-center gap-1 py-2 border border-orange-500/20 rounded-xl text-[8px] font-black uppercase ${theme === 'dark' ? 'bg-blue-900/10 dark:bg-blue-900/40 text-orange-500' : (theme === 'sepia' ? 'bg-[#eaddcf] text-orange-600' : 'bg-blue-900/10 text-orange-500')}`}><Microscope size={14} /> Teología</button>
                  <button onClick={() => onSendMessage(`Realiza una exégesis de ${currentBook?.name} ${currentChapter?.number}:${selectedVerse.number}`, true)} className={`flex flex-col items-center justify-center gap-1 py-2 border border-orange-500/20 rounded-xl text-[8px] font-black uppercase ${theme === 'dark' ? 'bg-blue-900/10 dark:bg-blue-900/40 text-orange-500' : (theme === 'sepia' ? 'bg-[#eaddcf] text-orange-600' : 'bg-blue-900/10 text-orange-500')}`}><PenTool size={14} /> Exégesis</button>
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
              <button onClick={() => onSendMessage("Necesito ayuda, me siento solo/a y triste.")} className={`px-3 py-1.5 rounded-full border text-[9px] font-bold transition-all whitespace-nowrap bg-red-900/10 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-1`}>
                <HeartHandshake size={10} /> Necesito Ayuda
              </button>
              {/* BOTÓN ACTUALIZADO PARA REDIRIGIR A LA PÁGINA MAPA */}
              <button onClick={onNavigateToMapPage} className={`px-3 py-1.5 rounded-full border text-[9px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${theme === 'dark' ? 'bg-blue-900/30 border-blue-800/40 text-blue-300 hover:bg-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                <MapPin size={10} /> Ubicar IPUC
              </button>
              <button onClick={() => onSendMessage("Regálame un devocional diario corto para hoy.")} className="px-3 py-1.5 rounded-full border text-[9px] font-bold transition-all whitespace-nowrap bg-orange-600/10 border-orange-600/30 text-orange-600 dark:text-orange-500 hover:bg-orange-600 hover:text-white flex items-center gap-1"><Sunrise size={10} /> Devocional</button>
              <button onClick={() => onSendMessage("Historia MJ")} className={`px-3 py-1.5 rounded-full border text-[9px] font-bold transition-all whitespace-nowrap ${theme === 'dark' ? 'bg-blue-900/30 border-blue-800/40 text-neutral-400 hover:border-orange-500' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1] text-[#8c735a] hover:border-orange-500' : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:border-orange-500')}`}>Historia MJ</button>
            </div>

            <div className="relative group">
              <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder='Dime un pasaje, pregunta algo o pide ayuda...' className={`w-full border rounded-3xl p-5 pr-14 text-sm outline-none focus:border-orange-500 transition-all min-h-[90px] ${textAreaClasses}`} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }} />
              <button type="submit" onClick={() => onSendMessage()} disabled={!inputMessage.trim() || isTyping} className={`absolute right-4 bottom-5 p-3 rounded-xl transition-all ${!inputMessage.trim() || isTyping ? 'bg-neutral-200 dark:bg-blue-900/50 opacity-50' : 'bg-orange-600 text-white shadow-orange-600/30'}`}>{isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default RightPanel;
