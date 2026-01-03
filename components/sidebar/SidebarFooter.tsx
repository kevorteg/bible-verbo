import React from 'react';
import { Globe, LogIn, LayoutDashboard, Map, Heart, Shield } from 'lucide-react';
import { MJ_WEBSITE_URL } from '../../constants';
import { User } from '../../types';

interface SidebarFooterProps {
    isAdminOrLeader: boolean;
    onNavigateToAdmin: () => void;
    user: User | null;
    onNavigateToProfile: () => void;
    onOpenAuth: () => void;
    onNavigateToCommunity: () => void;
    onNavigateToMap: () => void;
    currentView: string;
    theme: string;
    textClasses: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
    isAdminOrLeader, onNavigateToAdmin, user, onNavigateToProfile, onOpenAuth, onNavigateToCommunity, onNavigateToMap, currentView, theme, textClasses
}) => {
    return (
        <div className={`p-4 border-t shrink-0 space-y-3 ${theme === 'dark' ? 'border-blue-900/30' : (theme === 'sepia' ? 'border-[#e2d5b6]' : 'border-neutral-200')}`}>

            {/* BOTÓN ADMIN (SOLO VISIBLE SI ES ADMIN/LIDER) */}
            {isAdminOrLeader && (
                <button
                    onClick={onNavigateToAdmin}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-center gap-2 mb-2 transition-all text-[10px] font-black uppercase border border-transparent 
                   ${currentView === 'admin' ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                >
                    <Shield size={14} /> Panel Administrativo
                </button>
            )}

            {user ? (
                <button onClick={onNavigateToProfile} className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all mb-2 border group ${theme === 'dark' ? 'bg-[#1a2d4d] border-blue-800/40 hover:bg-[#253d63]' : (theme === 'sepia' ? 'bg-[#eaddcf] border-[#d3c4b1] hover:bg-[#dccbc0]' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100')}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-black text-sm shadow-md overflow-hidden">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="U" /> : user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <p className={`text-xs font-bold truncate ${textClasses}`}>{user.name}</p>
                        <p className="text-[9px] uppercase font-bold text-orange-500 flex items-center gap-1"><LayoutDashboard size={10} /> Mi Panel</p>
                    </div>
                </button>
            ) : (
                <button onClick={onOpenAuth} className="w-full bg-orange-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-all text-[11px] font-black uppercase shadow-lg shadow-orange-600/20 mb-2">
                    <LogIn size={16} /> Únete a la Misión
                </button>
            )}

            <div className="grid grid-cols-3 gap-2">
                <button onClick={onNavigateToCommunity} className={`p-2.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all text-[10px] font-black uppercase border border-transparent ${currentView === 'community' ? 'bg-red-500 text-white shadow-red-500/20' : (theme === 'dark' ? 'bg-blue-900/20 text-red-400 hover:bg-[#1a2d4d]' : 'bg-neutral-100 text-red-500 hover:bg-white')}`}>
                    <Heart size={14} className={currentView === 'community' ? 'fill-current' : ''} /> Muro
                </button>
                <button onClick={onNavigateToMap} className={`p-2.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all text-[10px] font-black uppercase border border-transparent ${currentView === 'map' ? 'bg-orange-600 text-white shadow-orange-500/20' : (theme === 'dark' ? 'bg-blue-900/20 text-orange-500 hover:bg-[#1a2d4d]' : 'bg-neutral-100 text-orange-600 hover:bg-white')}`}>
                    <Map size={14} /> Mapa
                </button>
                <button className={`p-2.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all text-[10px] font-black uppercase border border-transparent ${theme === 'dark' ? 'bg-blue-900/20 text-blue-200 hover:bg-[#1a2d4d]' : 'bg-neutral-100 text-neutral-600 hover:bg-white'}`} onClick={() => window.open(MJ_WEBSITE_URL, '_blank')}>
                    <Globe size={14} /> Web
                </button>
            </div>
        </div>
    );
};
