import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, X, Volume2, ExternalLink } from 'lucide-react';
import { fetchChapterAudio } from '../services/bibleService';
import { generateSpeech } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface AudioPlayerProps {
  bibleId: string;
  chapterId: string;
  bookName: string;
  chapterNum: string;
  verses: { number: string; text: string }[];
  theme: string;
  onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  bibleId,
  chapterId,
  bookName,
  chapterNum,
  verses,
  theme,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'error' | 'tts'>('loading');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const ttsIndexRef = useRef(0);
  const ttsPlayingRef = useRef(false);

  useEffect(() => {
    loadAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [chapterId]);

  const loadAudio = async () => {
    setStatus('loading');
    const audio = await fetchChapterAudio(bibleId, chapterId);
    if (audio?.url) {
      setAudioUrl(audio.url);
      setDuration(audio.duration);
      setStatus('paused');
    } else {
      startTTSFallback();
    }
  };

  const startTTSFallback = async () => {
    setStatus('tts');
    setErrorMsg('Audio no disponible. Leyendo con IA...');
    const fullText = verses.map(v => `${v.number}. ${v.text}`).join(' ');
    await generateSpeech(fullText);
    setStatus('playing');
    setTimeout(() => setStatus('paused'), 500);
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setStatus('playing');
    } else {
      audioRef.current.pause();
      setStatus('paused');
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
  };

  const handleEnded = () => {
    setStatus('paused');
    setProgress(0);
    setCurrentTime(0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * (audioRef.current.duration || duration);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const bg = theme === 'dark' ? 'bg-[#0a192f]/95 border-t border-blue-900/30' : theme === 'sepia' ? 'bg-[#f4ecd8]/95 border-t border-[#e2d5b6]' : 'bg-white/95 border-t border-neutral-200';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${bg} backdrop-blur-md p-3 animate-in`}>
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-black/10">
          <X size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{bookName} {chapterNum}</span>
            <span className="shrink-0 opacity-60">
              {status === 'tts' ? 'IA narrando...' : status === 'loading' ? 'Cargando...' : status === 'error' ? errorMsg : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={togglePlay}
              disabled={status === 'loading' || status === 'tts'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'} text-white transition`}
            >
              {status === 'loading' || status === 'tts' ? <Loader2 size={16} className="animate-spin" /> : status === 'playing' ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            <div className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-black/10" onClick={seek}>
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <span className="text-xs opacity-50">
              {status === 'error' ? '❌' : status === 'tts' ? '🤖' : status === 'playing' ? '🔊' : '🎧'}
            </span>
          </div>
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => { setStatus('error'); setErrorMsg('Error al reproducir'); }}
          preload="auto"
        />
      )}
    </div>
  );
};
