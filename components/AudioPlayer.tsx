import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Loader2, X, Volume2, AlertCircle, SkipBack, SkipForward, Library } from 'lucide-react';
import { fetchChapterAudio } from '../services/bibleService';
import { generateSpeechBlob } from '../services/geminiService';
import { AUDIO_BIBLE_ID } from '../constants';
import { getLocalAudioUrl } from '../services/localAudioService';

interface AudioPlayerProps {
  chapterId?: string;
  bookName: string;
  chapterNum: string;
  bookNumber?: number;
  verses?: { number: string; text: string }[];
  theme: string;
  onClose: () => void;
  onVerseChange?: (verseNumber: string) => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onToggleLibrary?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  chapterId,
  bookName,
  chapterNum,
  bookNumber,
  verses,
  theme,
  onClose,
  onVerseChange,
  onPrevChapter,
  onNextChapter,
  onToggleLibrary,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const loadAttemptRef = useRef(0);
  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'error'>('loading');
  const [currentSource, setCurrentSource] = useState<'local' | 'api' | 'tts' | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const tryLoad = useCallback(async () => {
    const attempt = loadAttemptRef.current;

    if (attempt === 0 && bookNumber) {
      setCurrentSource('local');
      const url = getLocalAudioUrl(bookNumber, bookName, parseInt(chapterNum));
      if (url && audioRef.current) {
        audioRef.current.src = url;
        return;
      }
    }

    if (attempt === 1 && chapterId) {
      setCurrentSource('api');
      try {
        const audio = await fetchChapterAudio(AUDIO_BIBLE_ID, chapterId);
        if (audio?.url && audioRef.current) {
          audioRef.current.src = audio.url;
          return;
        }
      } catch {
        // fall through to next source
      }
    }

    if (attempt === 2 && verses && verses.length > 0) {
      setCurrentSource('tts');
      setErrorMsg('Generando audio con IA...');
      try {
        const blob = await generateSpeechBlob(verses.map(v => `${v.number}. ${v.text}`).join(' '));
        if (blob && audioRef.current) {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          audioRef.current.src = url;
          setErrorMsg('');
          return;
        }
      } catch {
        // fall through to error
      }
    }

    setStatus('error');
    setErrorMsg('No se pudo reproducir el audio');
  }, [bookNumber, bookName, chapterNum, chapterId, verses]);

  useEffect(() => {
    loadAttemptRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    tryLoad();
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [chapterId, bookNumber, bookName, chapterNum]);

  const handleAudioError = () => {
    loadAttemptRef.current++;
    if (loadAttemptRef.current <= 3) {
      tryLoad();
    } else {
      setStatus('error');
      setErrorMsg('Error al reproducir');
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current?.duration) setDuration(audioRef.current.duration);
    setErrorMsg('');
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => setStatus('playing')).catch(() => setStatus('paused'));
    }
  };

  const handleEnded = () => {
    setStatus('paused');
    setProgress(0);
    setCurrentTime(0);
    if (onVerseChange && verses && verses.length > 0) {
      onVerseChange(verses[0]?.number || '1');
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
    setDuration(dur);
    if (onVerseChange && verses && verses.length > 0 && dur > 0) {
      const verseIndex = Math.floor((cur / dur) * verses.length);
      const idx = Math.min(verseIndex, verses.length - 1);
      onVerseChange(verses[idx].number);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => setStatus('paused'));
      setStatus('playing');
    } else {
      audioRef.current.pause();
      setStatus('paused');
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const loadingLabel = currentSource === 'tts' ? 'Generando audio...' : 'Cargando...';
  const bg = theme === 'dark' ? 'bg-[#0a192f]/95 border-t border-blue-900/30' : theme === 'sepia' ? 'bg-[#f4ecd8]/95 border-t border-[#e2d5b6]' : 'bg-white/95 border-t border-neutral-200';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${bg} backdrop-blur-md p-3 animate-in`}>
      <div className="mx-auto flex max-w-4xl items-center gap-2">
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-black/10">
          <X size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{bookName} {chapterNum}</span>
            <span className="shrink-0 opacity-60 text-xs">
              {status === 'loading' ? loadingLabel : status === 'error' ? errorMsg : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            {onPrevChapter && (
              <button onClick={onPrevChapter} className="shrink-0 rounded-full p-1 hover:bg-black/10 disabled:opacity-30">
                <SkipBack size={16} />
              </button>
            )}

            <button
              onClick={togglePlay}
              disabled={status === 'loading'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-50`}
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : status === 'playing' ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            {onNextChapter && (
              <button onClick={onNextChapter} className="shrink-0 rounded-full p-1 hover:bg-black/10 disabled:opacity-30">
                <SkipForward size={16} />
              </button>
            )}

            <div className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-black/10" onClick={seek}>
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-500 shadow"
                style={{ left: `${progress}%`, marginLeft: '-6px' }}
              />
            </div>

            {onToggleLibrary && (
              <button onClick={onToggleLibrary} className="shrink-0 rounded-full p-1.5 hover:bg-black/10" title="Biblioteca">
                <Library size={16} />
              </button>
            )}

            <span className="text-xs opacity-50">
              {status === 'error' ? <AlertCircle size={14} className="text-red-500" /> : <Volume2 size={14} />}
            </span>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="auto"
      />
    </div>
  );
};
