
import React, { useRef, useState } from 'react';
import { X, Download, Share2, Image as ImageIcon, Palette } from 'lucide-react';
import { Verse, Book, Chapter } from '../types';
import { MJ_LOGO_URL } from '../constants';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse;
  book: Book | null;
  chapter: Chapter | null;
}

const BACKGROUNDS = [
  "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", // Orange MJ
  "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)", // Deep Blue
  "linear-gradient(135deg, #0f172a 0%, #000000 100%)", // Midnight
  "linear-gradient(135deg, #831843 0%, #500724 100%)", // Pink/Red
  "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop')", // Nature 1
  "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop')", // Stars
  "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')", // Sea
];

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, verse, book, chapter }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!previewRef.current || !(window as any).html2canvas) return;
    setIsCapturing(true);
    
    try {
      // @ts-ignore
      const canvas = await (window as any).html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      
      const link = document.createElement('a');
      link.download = `VerboBible_${book?.name}_${chapter?.number}_${verse.number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Error capturing image", e);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0d1e3a] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b dark:border-white/10 flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <Share2 size={16}/> Compartir Palabra
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors dark:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-[#0b1625] flex flex-col items-center gap-6">
          
          {/* PREVIEW AREA */}
          <div 
            ref={previewRef}
            className="w-full aspect-square max-w-[320px] shadow-2xl rounded-xl flex flex-col justify-center items-center p-8 text-center relative overflow-hidden transition-all duration-500"
            style={{ 
              background: BACKGROUNDS[bgIndex],
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
             {/* Overlay for readability on images */}
             <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>

             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-white font-serif text-xl sm:text-2xl leading-relaxed drop-shadow-lg font-medium italic">
                    "{verse.text.trim()}"
                  </p>
                </div>
                
                <div className="mt-6 border-t border-white/40 pt-4">
                  <p className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">
                    {book?.name} {chapter?.number}:{verse.number}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
                    <img src={MJ_LOGO_URL} alt="MJ Logo" className="h-6 w-auto" crossOrigin="anonymous" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">VerboBible</span>
                  </div>
                </div>
             </div>
          </div>

          {/* CONTROLS */}
          <div className="w-full">
            <p className="text-[10px] font-black uppercase text-neutral-400 mb-2 flex items-center gap-1"><Palette size={12}/> Estilo de Fondo</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
               {BACKGROUNDS.map((bg, idx) => (
                 <button 
                   key={idx}
                   onClick={() => setBgIndex(idx)}
                   className={`w-10 h-10 rounded-full border-2 transition-all shrink-0 ${bgIndex === idx ? 'border-orange-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                   style={{ background: bg, backgroundSize: 'cover' }}
                 />
               ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t dark:border-white/10 bg-white dark:bg-[#0d1e3a]">
          <button 
            onClick={handleDownload}
            disabled={isCapturing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
          >
            {isCapturing ? <span className="animate-pulse">Generando...</span> : <><Download size={18} /> Descargar Imagen</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
