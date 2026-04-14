
import React, { useState } from 'react';
import { Play, Search, Video, Mic, Calendar, User, ArrowLeft, Filter, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SermonPlayer } from './SermonPlayer.tsx';
import { Sermon } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AdminSermonPanel } from './AdminSermonPanel';
import { Plus } from 'lucide-react';

interface SermonsPageProps {
  onBack: () => void;
  theme: 'dark' | 'light' | 'sepia';
}

export const SermonsPage: React.FC<SermonsPageProps> = ({ onBack, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      // Explicitly sort by created_at ascending (or descending for newest first)
      const { data, error } = await supabase.from('sermons').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      // Map videourl back to videoUrl if necessary depending on how the type defines it
      // The type Sermon uses videoUrl.
      const formattedData = data ? data.map((item: any) => ({
        ...item,
        id: item.video_id || item.videourl.split('v=')[1], // Fallback if video_id missing
        videoUrl: item.videoUrl || item.videourl, // Handle Postgres lowercase conversion
      })) : [];

      setSermons(formattedData);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSermons();
  }, []);

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.preacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || s.category?.normalize() === selectedCategory.normalize();
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', 'Arrepentimiento', 'Mayordomía', 'Espíritu Santo', 'Fe', 'Amor', 'Agradecimiento', 'Caminar con Dios', 'Bautismo'];

  const containerBg = theme === 'dark' ? 'bg-[#0a192f]' : (theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-neutral-50');
  const textTitle = theme === 'dark' ? 'text-white' : 'text-neutral-900';
  const textMuted = theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${containerBg}`}>
      {/* Header */}
      <div className="p-4 lg:p-6 pb-2 border-b border-white/10 flex flex-col gap-4 shrink-0 z-10 w-full relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Back button and Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={`text-xl lg:text-3xl font-black ${textTitle} flex items-center gap-2 tracking-tight whitespace-nowrap`}>
              <Play className="fill-orange-600 text-orange-600" size={24} />
              PREDICAS
            </h1>
          </div>

          {/* Search bar specifically for sermons */}
          <div className="relative w-full md:max-w-md group shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar pastores o temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border transition-all outline-none text-sm ${
                theme === 'dark' ? 'bg-[#112240] border-blue-900/30 focus:border-orange-500/50 text-white' : 
                'bg-white border-neutral-200 focus:border-orange-500/50 text-neutral-900'
              }`}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 w-full overflow-x-auto pb-2 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20' 
                  : (theme === 'dark' ? 'bg-[#112240] border-blue-900/20 text-neutral-400 hover:text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className={`${textMuted} text-sm font-medium animate-pulse`}>Cargando catálogo...</p>
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-80 min-h-[50vh]">
            <Filter size={64} className="mb-4 text-orange-500" />
            <h3 className={`text-xl font-bold ${textTitle} mb-2`}>No encontramos resultados en la aplicación</h3>
            <p className={`${textMuted} max-w-sm mb-6 text-sm`}>
              No tenemos registradas prédicas de <span className="font-bold">"{searchQuery}"</span> en nuestra selección.
            </p>
            <a 
              href={`https://www.youtube.com/results?search_query=IPUC+${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Search size={16} />
              Buscar en todo YouTube
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filteredSermons.map((sermon, idx) => (
              <motion.div
                key={sermon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`group rounded-3xl overflow-hidden border transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#112240] border-blue-900/30 hover:border-orange-500/30 shadow-2xl' : 
                  'bg-white border-neutral-200 hover:border-orange-500/30 shadow-xl shadow-neutral-200/50'
                }`}
                onClick={() => setActiveSermon(sermon)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={sermon.thumbnail} 
                    alt={sermon.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {sermon.duration}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="text-white fill-current ml-1" size={24} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedCategory(sermon.category); }}
                      className="px-2 py-0.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-[9px] font-black uppercase text-orange-500 border border-orange-500/20 transition-colors"
                    >
                      {sermon.category}
                    </button>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                      <Calendar size={12} />
                      {sermon.date}
                    </div>
                  </div>

                  <h3 className={`font-black text-lg lg:text-xl mb-3 leading-tight ${textTitle} group-hover:text-orange-500 transition-colors`}>
                    {sermon.title}
                  </h3>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-500 text-xs font-bold">
                        {sermon.preacher.split(' ').pop()?.charAt(0)}
                      </div>
                      <span className={`text-sm font-bold ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {sermon.preacher}
                      </span>
                    </div>
                    
                    <button className="text-orange-500 hover:text-orange-600 transition-colors">
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-4 text-center border-t border-white/5 ${theme === 'dark' ? 'bg-[#0d1e3a]' : 'bg-neutral-100'}`}>
        <p className={`text-[10px] font-bold tracking-widest uppercase opacity-40 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
          Misión Juvenil IPUC • Contenido Oficial • Valle del Cauca
        </p>
      </div>

      {/* Player Modal */}
      <AnimatePresence>
        {activeSermon && (
          <SermonPlayer 
            sermon={activeSermon} 
            onClose={() => setActiveSermon(null)} 
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Admin Floating Action Button */}
      {user && (
        <button
          onClick={() => setShowAdminPanel(true)}
          className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/30 border border-orange-400/20 transition-all hover:scale-110 z-50 group"
          title="Añadir nuevo video"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminSermonPanel 
          onClose={() => setShowAdminPanel(false)}
          onSuccess={() => {
            setShowAdminPanel(false);
            fetchSermons();
          }}
        />
      )}
    </div>
  );
};
