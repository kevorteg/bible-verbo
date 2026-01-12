
import React, { useState, useEffect } from 'react';
import { User, Bookmark, NoteMap, ChatMessage } from '../types';
import {
    Edit2, Save, X, Book, StickyNote, MessageSquare, Trophy, Calendar,
    ChevronRight, LogOut, Trash2, Zap, Link as LinkIcon, Palette, Loader2,
    BadgeCheck, Shield, Users, MapPin, Globe, User as UserIcon, Camera,
    Bell, ShieldCheck, Check, ChevronLeft, Mail, Info, Key, Smartphone,
    Star, Activity, Clock, Eye, RefreshCw
} from 'lucide-react';
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
    onNavigateToAdmin: () => void;
    onNavigateToLeaders: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    user, theme, notes, bookmarks, chatHistory, onNavigateToLocation, onBackToReader, onNavigateToAdmin, onNavigateToLeaders
}) => {
    const { logout, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'bookmarks' | 'chat'>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    // Theme adaptations
    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';

    // Base Colors based on Theme
    const bgBase = isDark ? 'bg-[#0a192f] text-slate-200' : (isSepia ? 'bg-[#f4ecd8] text-[#5b4636]' : 'bg-[#F1F5F9] text-slate-900');
    const cardBg = isDark ? 'bg-[#112240] border-white/10' : (isSepia ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-white border-slate-200');
    const primaryColor = 'orange'; // Turning Emerald to Orange
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDark ? 'border-white/10' : 'border-slate-200';

    useEffect(() => {
        setEditName(user.name);
    }, [user.name]);

    const handleSaveName = async () => {
        if (editName.trim() !== user.name) {
            setIsSaving(true);
            await updateProfile({ name: editName });
            setIsSaving(false);
        }
        setIsEditing(false);
    };

    const chaptersRead = user.stats?.chaptersRead || 0;
    let level = "Creyente";
    let nextLevel = 10;
    if (chaptersRead > 10) { level = "Discípulo"; nextLevel = 50; }
    if (chaptersRead > 50) { level = "Maestro"; nextLevel = 100; }
    if (chaptersRead > 100) { level = "Sabio"; nextLevel = 500; }
    const progress = Math.min((chaptersRead / nextLevel) * 100, 100);

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

    const menuItems = [
        { id: 'overview', label: 'General', icon: UserIcon },
        { id: 'notes', label: 'Mis Notas', icon: StickyNote },
        { id: 'bookmarks', label: 'Favoritos', icon: Book },
        { id: 'chat', label: 'Historial IA', icon: MessageSquare },
    ];

    return (
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${bgBase} font-sans antialiased transition-colors duration-300`}>
            {/* Header Mobile */}
            <div className={`lg:hidden flex items-center justify-between p-4 border-b sticky top-0 z-20 shadow-sm ${cardBg} ${borderColor}`}>
                <div className="flex items-center">
                    <button onClick={onBackToReader} className="mr-2 text-orange-600"><ChevronLeft className="w-5 h-5" /></button>
                    <h1 className="font-bold text-base">Mi Perfil</h1>
                </div>
                <div className="flex gap-2">
                    <div className="p-2 bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Trophy className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto lg:py-8 lg:px-8 flex flex-col lg:flex-row gap-6">

                {/* SIDEBAR NAVIGATION */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="mb-6">
                        <button onClick={onBackToReader} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
                            <ChevronLeft size={16} /> Volver a Lectura
                        </button>
                    </div>

                    <nav className="space-y-1.5">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === item.id
                                        ? 'bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none'
                                        : `${textMuted} hover:bg-white dark:hover:bg-white/5 hover:text-orange-600`
                                    }`}
                            >
                                <item.icon className="w-4.5 h-4.5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8 space-y-3">
                        <div className={`p-5 rounded-2xl border shadow-sm ${cardBg} ${borderColor}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-orange-500" />
                                <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Estado de Cuenta</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                {user.role.toUpperCase()}
                            </div>
                            {/* Actions Panel */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
                                {(user.role === 'admin' || user.role === 'leader') && (
                                    <>
                                        {user.role === 'admin' && (
                                            <button onClick={onNavigateToAdmin} className="w-full text-left text-[11px] font-bold flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors">
                                                <Shield size={12} /> Panel Admin
                                            </button>
                                        )}
                                        <button onClick={onNavigateToLeaders} className="w-full text-left text-[11px] font-bold flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors">
                                            <Users size={12} /> Líderes
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-100/50 dark:border-red-900/30">
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className={`flex-1 lg:rounded-[2rem] lg:border shadow-xl shadow-slate-200/40 dark:shadow-black/20 overflow-hidden mb-12 ${cardBg} ${borderColor}`}>

                    {/* COVER HEADER */}
                    <div className="relative">
                        <div className="h-40 lg:h-48 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white rounded-full blur-3xl" />
                                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-400 rounded-full blur-2xl" />
                            </div>

                            <div className="absolute top-4 left-4 lg:left-8 flex gap-2">
                                <div className="bg-white/10 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-white/20 flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5" /> Nivel {level}
                                </div>
                            </div>
                        </div>

                        {/* AVATAR */}
                        <div className="absolute -bottom-12 left-8 lg:left-10">
                            <div className="relative group">
                                <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-[1.75rem] border-[5px] overflow-hidden shadow-lg cursor-pointer ${isDark ? 'border-[#112240] bg-[#0a192f]' : 'border-white bg-slate-100'}`} onClick={() => setIsEditing(true)}>
                                    {renderAvatar(user.avatar)}
                                </div>
                                {(user.role === 'admin' || user.isVerified) && (
                                    <div className="absolute -right-1.5 -top-1.5 bg-blue-500 p-1.5 rounded-xl border-[3px] border-white dark:border-[#112240] shadow-md" title="Verificado">
                                        <BadgeCheck className="w-4 h-4 text-white fill-current" />
                                    </div>
                                )}
                                <button className="absolute -bottom-1.5 -right-1.5 p-2 bg-orange-600 text-white rounded-xl shadow-md hover:scale-105 transition-transform border-[3px] border-white dark:border-[#112240]" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT FORM */}
                    <div className="mt-16 lg:mt-20 px-6 lg:px-10 pb-10">

                        {/* OVERVIEW TAB (PERFIL) */}
                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-in fade-in duration-300">
                                <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${borderColor}`}>
                                    <div>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="text-xl font-bold bg-transparent border-b border-orange-500 outline-none w-full max-w-xs"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveName} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16} /></button>
                                                <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500 text-white rounded-lg"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{user.name}</h2>
                                        )}
                                        <p className="text-slate-500 text-[13px] font-medium mt-1">Miembro desde {new Date().getFullYear()} • {user.email}</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex gap-4">
                                        <div className={`px-4 py-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="block text-xl font-black text-orange-500">{chaptersRead}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Capítulos</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="block text-xl font-black text-blue-500">{Object.keys(notes).length}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Notas</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="block text-xl font-black text-yellow-500">{user.stats?.streakDays || 0}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Racha</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                                    {/* Progress Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Progreso Actual</h3>

                                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-sm">Nivel {level}</span>
                                                <span className="font-bold text-sm text-orange-500">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                                            </div>
                                            <p className="mt-2 text-xs opacity-60 text-right">{chaptersRead} / {nextLevel} XP para subir</p>
                                        </div>

                                        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                                <TargetIcon size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Meta de Lectura</h4>
                                                <p className="text-xs opacity-60">¡Sigue así! Estás siendo constante.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Details */}
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Detalles de la Cuenta</h3>

                                        <div className={`rounded-2xl p-6 border space-y-4 shadow-inner ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50/80 border-slate-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] text-slate-400 font-bold flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Rol</span>
                                                <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider shadow-sm shadow-orange-100 dark:shadow-none">{user.role}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] text-slate-400 font-bold flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
                                                <span className="text-[12px] font-bold opacity-80">{user.email}</span>
                                            </div>
                                            <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'} space-y-3`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[12px] text-slate-400 font-semibold flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Último Acceso</span>
                                                    <span className="text-[12px] opacity-60 font-medium tracking-tight">Hoy</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTES TAB */}
                        {activeTab === 'notes' && (
                            <div className="animate-in fade-in duration-300">
                                <div className={`flex items-center justify-between pb-6 border-b ${borderColor} mb-6`}>
                                    <div>
                                        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Mis Notas</h2>
                                        <p className="text-slate-500 text-[13px] font-medium mt-1">Tus reflexiones personales.</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                        <StickyNote className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(notes).length === 0 ? (
                                        <p className="col-span-full text-center py-20 opacity-50">No hay notas guardadas.</p>
                                    ) : (
                                        Object.entries(notes).map(([key, content]) => (
                                            <div key={key} className={`p-5 rounded-2xl border hover:border-orange-500/50 transition-all group ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase">
                                                        {key.includes('GENERAL') ? 'General' : 'Versículo'}
                                                    </span>
                                                    <button onClick={() => { onNavigateToLocation(key.split('-')[0] || ""); onBackToReader(); }} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                                <h4 className="font-bold text-sm mb-2">{key}</h4>
                                                <p className={`text-xs leading-relaxed line-clamp-3 ${textMuted}`}>{content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BOOKMARKS TAB */}
                        {activeTab === 'bookmarks' && (
                            <div className="animate-in fade-in duration-300">
                                <div className={`flex items-center justify-between pb-6 border-b ${borderColor} mb-6`}>
                                    <div>
                                        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Versículos Guardados</h2>
                                        <p className="text-slate-500 text-[13px] font-medium mt-1">Tu colección de favoritos.</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl">
                                        <Book className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {bookmarks.length === 0 ? (
                                        <p className="text-center py-20 opacity-50">No tienes favoritos.</p>
                                    ) : (
                                        bookmarks.map(b => (
                                            <div key={b.id} className={`p-4 rounded-xl border flex gap-4 group cursor-pointer hover:border-red-500/50 transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`} onClick={() => { onNavigateToLocation(`${b.bookName} ${b.chapterNum}:${b.number}`); onBackToReader(); }}>
                                                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center font-black text-lg shrink-0">
                                                    {b.number}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm text-red-500 mb-1">{b.bookName} {b.chapterNum}</h4>
                                                    <p className={`text-sm italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{b.text}"</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CHAT TAB */}
                        {activeTab === 'chat' && (
                            <div className="animate-in fade-in duration-300">
                                <div className={`flex items-center justify-between pb-6 border-b ${borderColor} mb-6`}>
                                    <div>
                                        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Historial de Ayuda</h2>
                                        <p className="text-slate-500 text-[13px] font-medium mt-1">Conversaciones con tu asistente.</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-500' : 'bg-purple-600'}`}>
                                                {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Zap size={14} className="text-white" />}
                                            </div>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-50 dark:bg-orange-900/20 text-slate-800 dark:text-slate-200' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

// Helper icon
const TargetIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

export default ProfilePage;
