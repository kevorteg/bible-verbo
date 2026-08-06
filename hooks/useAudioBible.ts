import { useState } from 'react';
import { fetchAudioUrl } from '../services/audioBibleService';

export function useAudioBible() {
  const [isPlaying] = useState(false);
  const [position] = useState(0);
  const [duration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>('Audio no disponible');

  const loadAudio = async () => {
    setIsLoading(true);
    setError('Audio no disponible - servicio suspendido');
    setIsLoading(false);
  };

  const play = async () => {};
  const pause = async () => {};
  const seek = async (_millis: number) => {};
  const togglePlayPause = async () => {};

  return {
    audioInfo: null,
    isPlaying,
    position,
    duration,
    isLoading,
    error,
    loadAudio,
    play,
    pause,
    seek,
    togglePlayPause,
  };
}
