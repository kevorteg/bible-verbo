
import React, { useState, useEffect } from 'react';
import { User, Bookmark, NoteMap, ChatMessage } from '../types';
import { Edit2, Save, X, Book, StickyNote, MessageSquare, Trophy, Calendar, ChevronRight, LogOut, Trash2, Zap, Link as LinkIcon, Palette, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as UserService from '../services/userService';

interface ProfilePageProps {
  user: User;
  theme: string;
  notes: NoteMap;
  bookmarks: Bookmark[];
  chatHistory: ChatMessage[];
  onNavigateToLocation: (location: string) => void;
  onBackToReader: () => void;
}

const DEFAULT_AVATARS = [
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-gray-600 to-black",
    "bg-gradient-to-br from-yellow-400 to-yellow-600"
];

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, theme, notes, bookmarks, chatHistory, onNavigateToLocation, onBackToReader 
}) => {
  const { logout, updateProfile } = useAuth(); // Usamos updateProfile del contexto
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'bookmarks' | 'chat'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Sincronizar nombre si el usuario cambia externamente
  useEffect(() => {
      setEditName(user.name);
  }, [user.name]);

  const bgClass = theme === 'dark' ? 'bg-[#0a192f] text-white' : (theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 'bg-neutral-50 text-neutral-900');
  const cardClass = theme === 'dark' ? 'bg-[#112240] border-blue-900/30' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-white border-neutral-200');
  const textMuted = theme === 'dark' ? 'text-neutral-400' : (theme === 'sepia' ? 'text-[#8c735a]' : 'text-neutral-500');

  const chaptersRead = user.stats?.chaptersRead || 0;
  let level = "Creyente";
  let nextLevel = 10;
  if (chaptersRead > 10) { level = "Discípulo"; nextLevel = 50; }
  if (chaptersRead > 50) { level = "Maestro"; nextLevel = 100; }
  if (chaptersRead > 100) { level = "Sabio"; nextLevel = 500; }
  
  const progress = Math.min((chaptersRead / nextLevel) * 100, 100);

  const handleUpdateAvatar = async (newAvatar: string) => {
      setIsSaving(true);
      await updateProfile({ avatar: newAvatar });
      setIsSaving(false);
      setShowAvatarMenu(false);
  };

  const handleSaveName = async () => {
    if (editName.trim() !== user.name) {
        setIsSaving(true);
        await updateProfile({ name: editName });
        setIsSaving(false);
    }
    setIsEditing(false);
  };

  const renderAvatar = (avatarStr: string | undefined, size: string = "w-full h-full", textSize: string = "text-4xl") => {
      if (!avatarStr) {
          return (
             <div className={`${size} bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${textSize} font-black text-white`}>
                 {user.name.charAt(0).toUpperCase()}
             </div>
          );
      }
      if (avatarStr.startsWith('http') || avatarStr.startsWith('data:')) {
          return <img src={avatarStr} alt="Avatar" className={`${size} object-cover`} />;
      } else {
          return (
             <div className={`${size} ${avatarStr} flex items-center justify-center ${textSize} font-black text-white`}>
                 {user.name.charAt(0).toUpperCase()}
             </div>
          );
      }
  };

  return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 ${bgClass}`}>
      
      <div className="max-w-5xl mx-auto">
        <button onClick={onBackToReader} className="flex items-center gap-2 mb-6 text-orange-500 font-bold hover:underline">
            <ChevronRight className="rotate-180" size={20}/> Volver a la Lectura
        </button>

        <div className={`rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-xl border relative ${cardClass}`}>
           
           <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <button 
             onClick={logout} 
             className="absolute top-6 right-6 p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
             title="Cerrar Sesión"
           >
               <LogOut size={18} />
           </button>

           <div className="relative group shrink-0 z-20">
              <div className="w-32 h-32 rounded-full border-4 border-orange-500/30 overflow-hidden shadow-2xl flex items-center justify-center bg-neutral-200 dark:bg-black/20">
                  {isSaving ? <Loader2 className="animate-spin text-orange-500" size={32}/> : renderAvatar(user.avatar)}
              </div>
              <button 
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="absolute bottom-0 right-0 p-2 bg-orange-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                title="Personalizar"
              >
                  <Palette size={18} />
              </button>

              {showAvatarMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-4 rounded-2xl shadow-2xl border z-30 animate-in fade-in slide-in-from-top-2 bg-white dark:bg-[#0b1625] dark:border-white/10">
                      <h4 className="text-[10px] font-black uppercase text-neutral-400 mb-3">Elige un estilo</h4>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                          {DEFAULT_AVATARS.map((bg, idx) => (
                              <button 
                                key={idx} 
                                className={`w-10 h-10 rounded-full ${bg} hover:scale-110 transition-transform border-2 border-transparent hover:border-white`}
                                onClick={() => handleUpdateAvatar(bg)}
                              />
                          ))}
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-neutral-400 mb-2">O pega una URL</h4>
                      <div className="flex gap-2">
                          <input 
                             type="text" 
                             placeholder="https://..." 
                             className="w-full text-xs p-2 rounded-lg border bg-neutral-100 dark:bg-black/20 dark:border-white/10 outline-none text-neutral-900 dark:text-neutral-100"
                             value={avatarUrlInput}
                             onChange={(e) => setAvatarUrlInput(e.target.value)}
                          />
                          <button 
                             onClick={() => handleUpdateAvatar(avatarUrlInput)}
                             className="p-2 bg-orange-600 text-white rounded-lg"
                             disabled={!avatarUrlInput}
                          >
                              <LinkIcon size={14}/>
                          </button>
                      </div>
                  </div>
              )}
           </div>

           <div className="flex-1 text-center md:text-left w-full z-10">
               {isEditing ? (
                   <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                       <input 
                         value={editName} 
                         onChange={(e) => setEditName(e.target.value)} 
                         className={`text-3xl font-black bg-transparent border-b-2 border-orange-500 outline-none w-full max-w-[300px] text-neutral-900 dark:text-neutral-100`}
                         autoFocus
                       />
                       <button onClick={handleSaveName} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                           {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                       </button>
                       <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X size={18}/></button>
                   </div>
               ) : (
                   <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
                       {user.name} 
                       <button onClick={() => setIsEditing(true)} className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/10 transition-all ${textMuted}`}><Edit2 size={18}/></button>
                   </h1>
               )}
               
               <p className={`font-medium mb-6 flex items-center justify-center md:justify-start gap-2 ${textMuted}`}>
                   <Calendar size={14} /> Miembro desde {new Date(user.joinedDate).toLocaleDateString()}
               </p>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'}`}>
                       <Book className="mx-auto mb-2 text-orange-500" size={24} />
                       <span className="block text-2xl font-black">{user.stats?.chaptersRead || 0}</span>
                       <span className={`text-[10px] uppercase font-bold ${textMuted}`}>Capítulos</span>
                   </div>
                   <div className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'}`}>
                       <StickyNote className="mx-auto mb-2 text-blue-500" size={24} />
                       <span className="block text-2xl font-black">{Object.keys(notes).length}</span>
                       <span className={`text-[10px] uppercase font-bold ${textMuted}`}>Notas</span>
                   </div>
                   <div className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'}`}>
                       <Zap className="mx-auto mb-2 text-yellow-500" size={24} />
                       <span className="block text-2xl font-black">{user.stats?.streakDays || 0}</span>
                       <span className={`text-[10px] uppercase font-bold ${textMuted}`}>Avivamiento</span>
                   </div>
                   <div className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'}`}>
                       <Trophy className="mx-auto mb-2 text-purple-500" size={24} />
                       <span className="block text-2xl font-black truncate">{level}</span>
                       <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-purple-500" style={{ width: `${progress}%` }}></div>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* TABS Y CONTENIDO SIGUE IGUAL (OMITIDO PARA BREVEDAD, PERO NECESARIO MANTENER) */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {[
                { id: 'overview', label: 'Resumen', icon: Trophy },
                { id: 'notes', label: 'Mis Notas', icon: StickyNote },
                { id: 'bookmarks', label: 'Favoritos', icon: Book },
                { id: 'chat', label: 'Historial Chat', icon: MessageSquare },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                        : `hover:bg-black/5 dark:hover:bg-white/5 ${textMuted}`
                    }`}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4">
             {activeTab === 'notes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(notes).length === 0 ? (
                        <p className={`col-span-full text-center py-20 opacity-50 ${textMuted}`}>Aún no tienes notas guardadas.</p>
                    ) : (
                        Object.entries(notes).map(([key, content]) => {
                            const isGeneral = key.includes("GENERAL");
                            let title = "Nota";
                            let location = "";
                            if (isGeneral) {
                                const parts = key.split('-');
                                if (parts.length >= 2) title = `${parts[0]} ${parts[1]} (General)`;
                                location = `${parts[0]} ${parts[1]}`;
                            } else {
                                title = key; 
                                location = key;
                            }
                            return (
                                <div key={key} className={`p-6 rounded-2xl border flex flex-col justify-between h-64 ${cardClass}`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-black uppercase text-orange-500">{isGeneral ? 'General' : 'Versículo'}</span>
                                            <StickyNote size={16} className="opacity-20"/>
                                        </div>
                                        <h3 className="font-bold text-lg mb-2 truncate">{title}</h3>
                                        <p className={`text-sm line-clamp-4 leading-relaxed ${textMuted}`}>{content}</p>
                                    </div>
                                    <button 
                                        onClick={() => { onNavigateToLocation(location); onBackToReader(); }}
                                        className="mt-4 w-full py-2 rounded-lg bg-blue-900/5 dark:bg-blue-900/30 hover:bg-orange-600 hover:text-white transition-all text-xs font-bold uppercase"
                                    >
                                        Ir al Capítulo
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'bookmarks' && (
                <div className="space-y-3">
                    {bookmarks.length === 0 ? (
                        <p className={`text-center py-20 opacity-50 ${textMuted}`}>No has guardado versículos favoritos.</p>
                    ) : (
                        bookmarks.map(b => (
                            <div key={b.id} className={`p-4 rounded-xl border flex items-center justify-between group ${cardClass}`}>
                                <div className="cursor-pointer flex-1" onClick={() => { onNavigateToLocation(`${b.bookName} ${b.chapterNum}:${b.number}`); onBackToReader(); }}>
                                    <h4 className="font-black text-orange-500 uppercase text-sm mb-1">{b.bookName} {b.chapterNum}:{b.number}</h4>
                                    <p className={`text-sm italic ${textMuted}`}>"{b.text}"</p>
                                </div>
                                <button className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
                    <div className="p-4 bg-orange-500/10 border-b border-orange-500/10"><h3 className="font-bold text-orange-500 flex items-center gap-2"><MessageSquare size={18}/> Historial</h3></div>
                    <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-neutral-100 dark:bg-white/5 rounded-bl-none'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    {msg.image && <img src={msg.image} className="mt-2 rounded-lg max-w-full" alt="AI Generated" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'overview' && (
                <div className="text-center py-20">
                    <Trophy size={64} className="mx-auto text-yellow-500 mb-6 animate-pulse" />
                    <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Nivel: {level}</h2>
                    <p className={`max-w-md mx-auto mb-8 ${textMuted}`}>Sigue leyendo para subir de nivel.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
