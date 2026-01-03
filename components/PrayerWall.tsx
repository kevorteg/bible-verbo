
import React, { useEffect, useState } from 'react';
import { Heart, Loader2, Send, Lock, User as UserIcon, ShieldAlert, Trash2, MoreHorizontal, Filter, Sparkles, MessageCircle, PartyPopper, CheckCircle2, X } from 'lucide-react';
import { PrayerRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as PrayerService from '../services/prayerService';
import * as GeminiService from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface PrayerWallProps {
  theme: string;
  onOpenSidebar: () => void;
}

const CATEGORIES = ['Todo', 'Espiritual', 'Salud', 'Estudios', 'Familia', 'Otros'];

const PrayerWall: React.FC<PrayerWallProps> = ({ theme, onOpenSidebar }) => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  
  // Feed Filter
  const [activeCategory, setActiveCategory] = useState('Todo');

  // Composer States
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Espiritual');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Testimony Modal State
  const [showTestimonyModal, setShowTestimonyModal] = useState<string | null>(null); // Guardamos el ID de la oración
  const [testimonyText, setTestimonyText] = useState('');
  const [submittingTestimony, setSubmittingTestimony] = useState(false);

  // 1. CARGA INICIAL
  useEffect(() => {
    loadPrayers();
  }, [user]);

  // 2. REALTIME LISTENER (NOTIFICACIONES DE DIOS RESPONDIÓ)
  useEffect(() => {
      const channel = supabase
        .channel('prayers_realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'prayers' },
          (payload) => {
            // Verificar si se agregó un testimonio nuevo (antes era null, ahora tiene texto)
            if (!payload.old.testimony && payload.new.testimony) {
                // Mostrar notificación festiva
                setCelebrationMessage(`¡Testimonio! ${payload.new.author_name} dice: "${payload.new.testimony.substring(0, 30)}..."`);
                setTimeout(() => setCelebrationMessage(null), 6000);
                
                // Recargar el feed para ver el testimonio (dorado)
                loadPrayers();
            }
          }
        )
        .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, []);

  const loadPrayers = async () => {
    if (!user) return;
    setLoading(true);
    const data = await PrayerService.getPrayers(user.id);
    setPrayers(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newContent.trim() || !user) return;
    setSubmitting(true);

    // Check AI Safety
    const isSafe = await GeminiService.checkContentSafety(newContent);
    if (!isSafe) {
        alert("Tu mensaje no cumple con las normas de la comunidad.");
        setSubmitting(false);
        return;
    }

    try {
        await PrayerService.createPrayer(
            user.id, 
            newContent, 
            newCategory, 
            isAnonymous, 
            user.name, 
            user.avatar
        );
        setNewContent('');
        loadPrayers(); 
    } catch (e) {
        console.error(e);
        alert("Error al publicar.");
    } finally {
        setSubmitting(false);
    }
  };

  const handlePrayClick = async (prayer: PrayerRequest) => {
      if (!user || prayer.has_prayed) return;
      
      // Optimistic update
      setPrayers(prev => prev.map(p => 
        p.id === prayer.id 
            ? { ...p, prayed_count: p.prayed_count + 1, has_prayed: true } 
            : p
      ));

      try {
          await PrayerService.prayForRequest(prayer.id, user.id);
      } catch (e) { console.error("Error praying", e); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("¿Estás seguro de borrar esta publicación?")) return;
      
      // Optimistic delete UI update
      const prevPrayers = [...prayers];
      setPrayers(prev => prev.filter(p => p.id !== id));

      try {
          await PrayerService.deletePrayer(id);
      } catch (e) { 
          console.error(e);
          // Si falla, revertimos
          alert("No se pudo borrar. Asegúrate de ser el autor o administrador.");
          setPrayers(prevPrayers); 
      }
  };

  const handleSubmitTestimony = async () => {
      if (!showTestimonyModal || !testimonyText.trim()) return;
      setSubmittingTestimony(true);
      try {
          await PrayerService.addTestimony(showTestimonyModal, testimonyText);
          setShowTestimonyModal(null);
          setTestimonyText('');
          loadPrayers();
      } catch (e) {
          alert("Error al guardar testimonio");
      } finally {
          setSubmittingTestimony(false);
      }
  };

  const renderAvatar = (url: string | undefined, name: string, isAnon: boolean) => {
      if (isAnon) return <UserIcon size={20}/>;
      if (!url) return name.charAt(0);
      
      // Si es URL de imagen
      if (url.startsWith('http') || url.startsWith('data:')) {
          return <img src={url} className="w-full h-full object-cover"/>;
      } 
      // Si es clase CSS (gradiente)
      return <div className={`w-full h-full ${url}`}></div>;
  };

  const filteredPrayers = activeCategory === 'Todo' 
    ? prayers 
    : prayers.filter(p => p.category === activeCategory);

  // Clases
  const bgMain = theme === 'dark' ? 'bg-[#0a192f]' : (theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-white');
  const textMain = theme === 'dark' ? 'text-white' : (theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-900');
  const borderMain = theme === 'dark' ? 'border-blue-900/30' : (theme === 'sepia' ? 'border-[#d3c4b1]' : 'border-neutral-200');
  const bgHover = theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-neutral-50';

  return (
    <div className={`flex w-full h-full ${bgMain} ${textMain} relative`}>
      
      {/* GLOBAL CELEBRATION TOAST */}
      {celebrationMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in slide-in-from-top-4">
              <div className="bg-yellow-500 text-white px-6 py-3 rounded-full font-black uppercase text-sm shadow-2xl flex items-center gap-3 border-2 border-yellow-300">
                  <PartyPopper size={20} className="animate-bounce"/>
                  <span>{celebrationMessage}</span>
              </div>
          </div>
      )}

      {/* MAIN FEED COLUMN */}
      <div className={`flex-1 flex flex-col h-full border-r ${borderMain} overflow-hidden max-w-2xl w-full relative`}>
          
          {/* Header Sticky */}
          <div className={`sticky top-0 z-10 px-4 py-3 border-b backdrop-blur-md bg-opacity-80 flex justify-between items-center ${borderMain} ${bgMain}`}>
              <h2 className="text-lg font-black uppercase tracking-tight">Comunidad</h2>
              <div className="md:hidden">
                  <button onClick={onOpenSidebar} className="p-2"><MoreHorizontal /></button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              
              {/* COMPOSER */}
              <div className={`p-4 border-b ${borderMain}`}>
                 <div className="flex gap-4">
                     <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-white overflow-hidden ${isAnonymous ? 'bg-neutral-400' : (user?.avatar?.startsWith('bg-') ? user.avatar : 'bg-gradient-to-br from-orange-400 to-orange-600')}`}>
                         {renderAvatar(user?.avatar, user?.name || 'U', isAnonymous)}
                     </div>
                     <div className="flex-1">
                         <textarea 
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="¿Cuál es tu petición de oración hoy?"
                            className={`w-full bg-transparent outline-none text-lg resize-none min-h-[80px] placeholder:opacity-50 ${textMain}`}
                         />
                         
                         {newContent.length > 0 && (
                             <div className="flex flex-wrap items-center justify-between gap-3 mt-2 animate-in fade-in">
                                 <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className={`text-xs font-bold uppercase bg-transparent outline-none border rounded-full px-2 py-1 cursor-pointer ${theme === 'dark' ? 'border-orange-500/50 text-orange-500' : 'border-orange-600 text-orange-600'}`}
                                    >
                                        {CATEGORIES.filter(c => c !== 'Todo').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    
                                    <button 
                                        onClick={() => setIsAnonymous(!isAnonymous)}
                                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition-colors ${isAnonymous ? 'bg-neutral-500 text-white' : 'text-orange-500 hover:bg-orange-500/10'}`}
                                    >
                                        {isAnonymous ? <><Lock size={12}/> Anónimo</> : <><UserIcon size={12}/> Público</>}
                                    </button>
                                 </div>

                                 <button 
                                    onClick={handleSubmit}
                                    disabled={submitting || !newContent.trim()}
                                    className="px-5 py-2 rounded-full bg-orange-600 text-white font-bold text-sm shadow-lg hover:bg-orange-700 disabled:opacity-50 transition-all"
                                 >
                                    {submitting ? <Loader2 className="animate-spin" size={18}/> : 'Publicar'}
                                 </button>
                             </div>
                         )}
                     </div>
                 </div>
              </div>

              {/* POSTS STREAM */}
              <div>
                  {loading ? (
                       <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                           <Loader2 className="animate-spin text-orange-500" size={32}/>
                           <p className="text-xs uppercase font-bold tracking-widest">Cargando Muro...</p>
                       </div>
                  ) : filteredPrayers.length === 0 ? (
                       <div className="py-20 text-center opacity-50 px-6">
                           <Sparkles className="mx-auto mb-4 text-orange-500" size={48}/>
                           <p className="text-lg font-bold mb-2">Sé el primero en encender la llama.</p>
                           <p className="text-sm">Comparte una petición para que la comunidad ore por ti.</p>
                       </div>
                  ) : (
                      filteredPrayers.map(prayer => (
                          <div key={prayer.id} className={`p-4 border-b flex gap-4 transition-colors relative ${borderMain} ${bgHover} ${prayer.testimony ? (theme === 'dark' ? 'bg-yellow-900/5' : 'bg-yellow-50/50') : ''}`}>
                              
                              {/* Avatar Column */}
                              <div className="shrink-0 flex flex-col items-center gap-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm overflow-hidden ${prayer.is_anonymous ? 'bg-neutral-400' : (prayer.avatar_url?.startsWith('bg-') ? prayer.avatar_url : 'bg-gradient-to-br from-orange-400 to-orange-600')}`}>
                                      {renderAvatar(prayer.avatar_url, prayer.author_name, prayer.is_anonymous)}
                                  </div>
                                  {/* Hilo conector visual */}
                                  {prayer.testimony && <div className="w-0.5 h-full bg-gradient-to-b from-orange-400 to-transparent opacity-20 min-h-[50px] rounded-full"></div>}
                              </div>
                              
                              {/* Content Column */}
                              <div className="flex-1 min-w-0">
                                  {/* Header Line */}
                                  <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2 truncate">
                                          <span className="font-bold text-sm truncate">{prayer.is_anonymous ? "Anónimo" : prayer.author_name}</span>
                                          {!prayer.is_anonymous && <span className={`text-xs opacity-50 truncate`}>@{prayer.author_name.split(' ')[0].toLowerCase()}</span>}
                                          <span className="text-[10px] opacity-40">• {new Date(prayer.created_at).toLocaleDateString()}</span>
                                      </div>
                                      
                                      {/* DELETE BUTTON (Owner or Admin) */}
                                      {(user?.id === prayer.user_id || user?.role === 'admin') && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(prayer.id); }} 
                                            className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                            title="Borrar publicación"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      )}
                                  </div>
                                  
                                  {/* Body */}
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{prayer.content}</p>

                                  {/* Footer Actions */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => handlePrayClick(prayer)}
                                            disabled={prayer.has_prayed}
                                            className={`flex items-center gap-2 text-xs group transition-colors ${prayer.has_prayed ? 'text-green-500' : 'text-neutral-500 hover:text-red-500'}`}
                                        >
                                            <div className={`p-2 rounded-full group-hover:bg-red-500/10 ${prayer.has_prayed ? 'bg-green-500/10' : ''}`}>
                                                <Heart size={16} className={prayer.has_prayed ? 'fill-current' : ''} />
                                            </div>
                                            <span className={prayer.has_prayed ? 'font-bold' : ''}>{prayer.prayed_count || 0}</span>
                                        </button>
                                        
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border opacity-60 ${theme === 'dark' ? 'border-white/10' : 'border-neutral-200'}`}>
                                            {prayer.category}
                                        </span>
                                    </div>

                                    {/* BUTTON: MARCAR COMO RESPONDIDA (Solo dueño y si no tiene testimonio aun) */}
                                    {user?.id === prayer.user_id && !prayer.testimony && (
                                        <button 
                                            onClick={() => setShowTestimonyModal(prayer.id)}
                                            className="text-[10px] font-bold uppercase text-orange-500 hover:bg-orange-500/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle2 size={12}/> ¡Dios respondió!
                                        </button>
                                    )}
                                  </div>

                                  {/* TESTIMONY BLOCK (NEW COMMENT STYLE) */}
                                  {prayer.testimony && (
                                      <div className="mt-4 animate-in slide-in-from-top-2">
                                          <div className="flex gap-3">
                                              {/* Mini Avatar of Author */}
                                              <div className="shrink-0 flex flex-col items-center">
                                                   {/* Visual connector from main post */}
                                                   <div className={`w-0.5 h-2 mb-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-neutral-200'}`}></div>
                                                   
                                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[9px] shadow-sm overflow-hidden ${prayer.is_anonymous ? 'bg-neutral-400' : (prayer.avatar_url?.startsWith('bg-') ? prayer.avatar_url : 'bg-gradient-to-br from-orange-400 to-orange-600')}`}>
                                                        {renderAvatar(prayer.avatar_url, prayer.author_name, prayer.is_anonymous)}
                                                   </div>
                                              </div>

                                              {/* Comment Bubble */}
                                              <div className={`flex-1 p-3 rounded-2xl rounded-tl-none border relative ${theme === 'dark' ? 'bg-[#1a2d4d] border-orange-500/30' : 'bg-white border-orange-100 shadow-sm'}`}>
                                                   <div className="flex items-center gap-2 mb-1">
                                                       <span className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1">
                                                           <PartyPopper size={12} className="animate-bounce" /> Dios Respondió
                                                       </span>
                                                       <span className="text-[9px] opacity-40">• Actualización</span>
                                                   </div>
                                                   <p className="text-sm italic opacity-90 leading-relaxed">"{prayer.testimony}"</p>
                                                   
                                                   {/* 24h Warning */}
                                                   <div className="mt-2 flex items-center gap-1 opacity-40">
                                                      <div className="w-full h-px bg-current"></div>
                                                      <span className="text-[8px] whitespace-nowrap">Expira en 24h</span>
                                                   </div>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* TESTIMONY MODAL */}
          {showTestimonyModal && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                  <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-[#0d1e3a] border border-white/10' : 'bg-white'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-black uppercase tracking-tight text-orange-500 flex items-center gap-2">
                              <PartyPopper size={20}/> ¡Dios lo hizo!
                          </h3>
                          <button onClick={() => setShowTestimonyModal(null)}><X className="opacity-50 hover:opacity-100"/></button>
                      </div>
                      <p className="text-xs mb-4 opacity-70">Comparte brevemente cómo Dios respondió a esta petición para edificar la fe de otros.</p>
                      <textarea 
                          value={testimonyText}
                          onChange={(e) => setTestimonyText(e.target.value)}
                          placeholder="Escribe tu testimonio aquí..."
                          className={`w-full h-24 p-3 rounded-xl resize-none outline-none border text-sm mb-4 ${theme === 'dark' ? 'bg-[#1a2d4d] border-white/10' : 'bg-neutral-100 border-neutral-200'}`}
                      />
                      <button 
                          onClick={handleSubmitTestimony}
                          disabled={!testimonyText.trim() || submittingTestimony}
                          className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold uppercase text-xs hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                      >
                          {submittingTestimony ? <Loader2 className="animate-spin"/> : 'Publicar Testimonio'}
                      </button>
                  </div>
              </div>
          )}

      </div>

      {/* RIGHT COLUMN (Desktop Only) - TRENDS */}
      <div className={`hidden lg:flex flex-col w-[350px] p-4 gap-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a192f]' : (theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-neutral-50')}`}>
          
          <div className={`p-3 rounded-full flex items-center gap-3 border ${theme === 'dark' ? 'bg-[#112240] border-transparent' : 'bg-white border-neutral-200'}`}>
              <Filter size={18} className="opacity-50"/>
              <span className="text-sm opacity-50 font-medium">Filtrar peticiones...</span>
          </div>

          <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-[#112240] border-white/5' : 'bg-white border-neutral-200'}`}>
              <h3 className="font-black uppercase text-lg mb-4 px-2">Categorías</h3>
              <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                      <button
                         key={cat}
                         onClick={() => setActiveCategory(cat)}
                         className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex justify-between items-center transition-all ${
                             activeCategory === cat 
                             ? 'bg-orange-600 text-white' 
                             : `${bgHover}`
                         }`}
                      >
                          <span>{cat}</span>
                          {cat === activeCategory && <Heart size={14} className="fill-current"/>}
                      </button>
                  ))}
              </div>
          </div>

          <div className="px-4 text-xs opacity-50 leading-relaxed">
              <p>© 2025 Misión Juvenil D5.</p>
              <p>Este muro es monitoreado por IA para asegurar un ambiente seguro y de fe.</p>
          </div>
      </div>

    </div>
  );
};

export default PrayerWall;
