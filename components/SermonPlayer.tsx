
import React from 'react';
import { X, Share2, Bookmark, Heart, MoreVertical, Maximize, Play, Pause, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sermon } from '../types';

interface SermonPlayerProps {
  sermon: Sermon;
  onClose: () => void;
  theme: 'dark' | 'light' | 'sepia';
}

export const SermonPlayer: React.FC<SermonPlayerProps> = ({ sermon, onClose, theme }) => {
  // Extract YouTube ID
  const getUrlId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getUrlId(sermon.videoUrl);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 bg-black/95 backdrop-blur-xl"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 lg:top-12 lg:right-12 text-white/50 hover:text-white transition-colors z-[110]"
      >
        <X size={32} />
      </button>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-6xl flex flex-col gap-6"
      >
        {/* Video Container */}
        <div className="relative aspect-video w-full rounded-2xl lg:rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-black">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&modestbranding=1`}
              title={sermon.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 bg-neutral-900">
              <p>No se pudo cargar el video</p>
            </div>
          )}
        </div>

        {/* Info & Global Custom Controls Mockup */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-[10px] font-black uppercase text-white tracking-widest">
                {sermon.category}
              </span>
              <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                IPUC • {sermon.date}
              </span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-black text-white leading-tight mb-2 tracking-tight">
              {sermon.title}
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-black">
                {sermon.preacher.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold">{sermon.preacher}</p>
                <p className="text-orange-500 text-xs font-bold">Ministro de la Palabra</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button className="flex-1 lg:flex-none px-6 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2">
              <Share2 size={16} /> Compartir
            </button>
            <div className="flex gap-2">
              <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                <Bookmark size={20} />
              </button>
              <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all">
                <Heart size={20} />
              </button>
              <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Related Mockup (Small) */}
        <div className="hidden lg:flex flex-col gap-4 mt-8 opacity-50 bg-white/5 p-6 rounded-3xl border border-white/5">
           <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
              <Play size={12} className="fill-current" /> Siguiente en Prédicas IPUC
           </div>
           <p className="text-white/30 text-xs italic">Cargando recomendaciones personalizadas basadas en tu estudio bíblico...</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
