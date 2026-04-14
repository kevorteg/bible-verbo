import React, { useState } from 'react';
import { X, Search, Video, Save, Loader2, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

interface AdminSermonPanelProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PREACHERS = [
  'Pr. Wilson Rojas',
  'Pr. Jhon Fabio García',
  'Pr. Vicente Arango',
  'Pr. Álvaro Torres',
  'Pr. Reinel Galvis',
  'Pr. Gerardo Murillo',
  'Pr. Alberto Morales',
  'Pr. Mario Carmona',
  'Otro Pastor'
];

const CATEGORIES = [
  'Arrepentimiento', 
  'Mayordomía', 
  'Espíritu Santo', 
  'Fe', 
  'Amor', 
  'Agradecimiento', 
  'Caminar con Dios', 
  'Bautismo'
];

export const AdminSermonPanel: React.FC<AdminSermonPanelProps> = ({ onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [preacher, setPreacher] = useState(PREACHERS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [duration, setDuration] = useState('00:00');
  
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; thumbnail: string; id: string } | null>(null);
  const [error, setError] = useState('');

  const fetchMetadata = async () => {
    if (!url) return;
    try {
      setLoadingMeta(true);
      setError('');
      
      // Extract ID from URL
      const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
      const videoId = match ? match[1] : null;
      
      if (!videoId) {
        throw new Error('No pudimos extraer el ID del video. Manda un link válido de YouTube.');
      }

      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await res.json();

      if (data.error) {
        throw new Error('Video no encontrado o privado.');
      }

      // Use hqdefault as standard thumbnail policy in our app
      const hqThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      setMetadata({
        title: data.title || '',
        thumbnail: hqThumbnail,
        id: videoId
      });
    } catch (err: any) {
      setError(err.message || 'Error al obtener datos');
      setMetadata(null);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSave = async () => {
    if (!metadata) return;
    try {
      setSaving(true);
      setError('');

      const today = new Date().toISOString().split('T')[0];

      const { error: insertError } = await supabase.from('sermons').insert([{
        video_id: metadata.id,
        title: metadata.title,
        preacher: preacher,
        date: today,
        thumbnail: metadata.thumbnail,
        videourl: `https://www.youtube.com/watch?v=${metadata.id}`,
        category: category,
        duration: duration
      }]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError('Error al guardar en base de datos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a192f] border border-blue-900/50 rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="text-orange-500" />
              Añadir Video Prédica
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            {/* URL Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-neutral-300">Enlace de YouTube</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#112240] border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={fetchMetadata}
                  disabled={loadingMeta || !url}
                  className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMeta ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Buscar
                </button>
              </div>
            </div>

            {/* Config metadata fields - Only visible if metadata fetched successfully */}
            {metadata && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-4 border-t border-white/10 pt-4"
              >
                {/* Preview Box */}
                <div className="flex gap-4 p-4 rounded-xl bg-[#112240] border border-white/5 items-center">
                  <img src={metadata.thumbnail} alt="Thumbnail preview" className="w-24 h-16 object-cover rounded-lg" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-white text-sm font-bold truncate">{metadata.title}</h4>
                    <p className="text-xs text-neutral-400 font-mono mt-1">ID: {metadata.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pastor / Predicador</label>
                    <select 
                      value={preacher}
                      onChange={(e) => setPreacher(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#112240] border border-white/10 text-white focus:outline-none focus:border-orange-500 appearance-none"
                    >
                      {PREACHERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categoría</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#112240] border border-white/10 text-white focus:outline-none focus:border-orange-500 appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Duración (opcional)</label>
                  <input 
                    type="text" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="45:00"
                    className="w-full px-4 py-3 rounded-xl bg-[#112240] border border-white/10 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving || !metadata.title}
                  className="w-full py-4 mt-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {saving ? 'Guardando...' : 'Añadir al Catálogo'}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
