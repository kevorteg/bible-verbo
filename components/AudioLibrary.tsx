import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronRight, Play, Pause, Check, X, Headphones, BookOpen, SkipBack, SkipForward } from 'lucide-react';
import { AUDIO_TESTAMENTS, AudioBook } from '../data/audioBooks';

interface NowPlaying {
  bookNumber: number;
  bookName: string;
  chapterNum: number;
}

interface AudioLibraryProps {
  theme: string;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  onPlay: (bookNumber: number, bookName: string, chapterNum: number) => void;
  onTogglePlay: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onClose: () => void;
}

const PROGRESS_KEY = 'verbo_audio_progress';

function getProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
  return new Set();
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  theme,
  nowPlaying,
  isPlaying,
  onPlay,
  onTogglePlay,
  onPrevChapter,
  onNextChapter,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestaments, setExpandedTestaments] = useState<Set<string>>(new Set([AUDIO_TESTAMENTS[0]?.name]));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());
  const [progress] = useState<Set<string>>(getProgress);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const toggleTestament = (name: string) => {
    setExpandedTestaments((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleBook = (num: number) => {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const filteredTestaments = useMemo(() => {
    if (!searchQuery.trim()) return AUDIO_TESTAMENTS;
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return AUDIO_TESTAMENTS.map((t) => ({
      ...t,
      sections: t.sections
        .map((s) => ({
          ...s,
          books: s.books.filter((b) => {
            const normalized = b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const numMatch = String(b.number) === q;
            return normalized.includes(q) || numMatch;
          }),
        }))
        .filter((s) => s.books.length > 0),
    })).filter((t) => t.sections.length > 0);
  }, [searchQuery]);

  const handlePlay = (book: AudioBook, chapter: number) => {
    if (nowPlaying && nowPlaying.bookNumber === book.number && nowPlaying.chapterNum === chapter) {
      return;
    }
    onPlay(book.number, book.name, chapter);
  };

  const bg = theme === 'dark' ? 'bg-[#0a192f]' : theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-900';
  const mutedColor = theme === 'dark' ? 'text-neutral-400' : theme === 'sepia' ? 'text-[#8c735a]' : 'text-neutral-500';
  const borderColor = theme === 'dark' ? 'border-blue-900/30' : theme === 'sepia' ? 'border-[#e2d5b6]' : 'border-neutral-200';
  const cardBg = theme === 'dark' ? 'bg-[#0d1e3a]' : theme === 'sepia' ? 'bg-[#eaddcf]' : 'bg-neutral-50';
  const inputBg = theme === 'dark' ? 'bg-[#0a192f] border-blue-800/40 text-white placeholder:text-neutral-500' : theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1] text-[#5b4636] placeholder:text-[#8c735a]' : 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400';

  const sectionLabel = theme === 'dark' ? 'text-blue-400' : theme === 'sepia' ? 'text-[#7a624e]' : 'text-neutral-500';

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${bg} ${textColor} overflow-hidden`}>
      <div className={`shrink-0 border-b ${borderColor} p-4`}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-black/10">
            <X size={20} />
          </button>
          <h2 className="text-lg font-bold flex-1">Biblioteca de Audio</h2>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar libro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none ${inputBg}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-4 space-y-2">
          {filteredTestaments.map((testament) => (
            <div key={testament.name} className={`rounded-2xl border ${borderColor} overflow-hidden`}>
              <button
                onClick={() => toggleTestament(testament.name)}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left font-bold text-sm uppercase tracking-wider ${sectionLabel} hover:opacity-80`}
              >
                {expandedTestaments.has(testament.name) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {testament.name}
                <span className="ml-auto text-xs opacity-50 font-normal">{testament.sections.reduce((sum, s) => sum + s.books.length, 0)} libros</span>
              </button>

              {expandedTestaments.has(testament.name) && (
                <div className="px-2 pb-2 space-y-1">
                  {testament.sections.map((section) => (
                    <div key={section.name} className={`rounded-xl ${cardBg} overflow-hidden`}>
                      <button
                        onClick={() => toggleSection(section.name)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ${sectionLabel}`}
                      >
                        {expandedSections.has(section.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {section.name}
                        <span className="ml-auto text-xs opacity-50 font-normal">{section.books.length} libros</span>
                      </button>

                      {expandedSections.has(section.name) && (
                        <div className="space-y-0.5 px-2 pb-2">
                          {section.books.map((book) => {
                            const isThisBookExpanded = expandedBooks.has(book.number);
                            const isPlaying = nowPlaying?.bookNumber === book.number;

                            return (
                              <div key={book.number}>
                                <button
                                  onClick={() => toggleBook(book.number)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:opacity-80 ${isPlaying ? 'bg-orange-500/10 text-orange-500' : ''}`}
                                >
                                  <BookOpen size={14} className="shrink-0 opacity-40" />
                                  <span className="font-medium">{String(book.number).padStart(2, '0')}</span>
                                  <span className="flex-1 text-left">{book.name}</span>
                                  <span className={`text-xs ${mutedColor}`}>{book.chapters} cap</span>
                                  {isThisBookExpanded ? <ChevronDown size={14} className="opacity-40" /> : <ChevronRight size={14} className="opacity-40" />}
                                </button>

                                {isThisBookExpanded && (
                                  <div className="ml-8 space-y-0.5 pb-1">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => {
                                      const isPlayingCh = isPlaying && nowPlaying?.chapterNum === ch;
                                      const isPlayed = progress.has(`${book.number}:${ch}`);

                                      return (
                                        <button
                                          key={ch}
                                          onClick={() => handlePlay(book, ch)}
                                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80 ${isPlayingCh ? 'bg-orange-500/15 text-orange-500 font-bold' : ''}`}
                                        >
                                          {isPlayingCh ? (
                                            <Play size={12} className="shrink-0 text-orange-500 fill-orange-500" />
                                          ) : isPlayed ? (
                                            <Check size={12} className="shrink-0 text-green-500" />
                                          ) : (
                                            <span className="w-3 shrink-0" />
                                          )}
                                          <span className="opacity-50">Capítulo</span>
                                          <span>{ch}</span>
                                          {isPlayingCh && <span className="ml-auto text-[10px] opacity-50">Sonando</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredTestaments.every((t) => t.sections.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Headphones size={48} strokeWidth={1} />
              <p className="mt-4 text-sm">No se encontraron libros</p>
            </div>
          )}
        </div>
      </div>

      {nowPlaying && (
        <div className={`shrink-0 border-t ${borderColor} p-4`}>
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{nowPlaying.bookName} {nowPlaying.chapterNum}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPrevChapter} className="rounded-full p-2 hover:bg-black/10">
                <SkipBack size={18} />
              </button>
              <button
                onClick={onTogglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <button onClick={onNextChapter} className="rounded-full p-2 hover:bg-black/10">
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
