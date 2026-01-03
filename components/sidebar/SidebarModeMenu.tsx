import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Book } from '../../types';

interface SidebarModeMenuProps {
    currentView: string;
    onBackToReader: () => void;
    theme: string;
    textClasses: string;
}

export const SidebarModeMenu: React.FC<SidebarModeMenuProps> = ({ currentView, onBackToReader, theme, textClasses }) => {
    return (
        <div className="flex-1 flex flex-col px-4 pt-4">
            <button
                onClick={onBackToReader}
                className={`w-full text-left p-4 rounded-xl text-sm transition-all flex items-center gap-3 font-bold mb-4 border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-neutral-300' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'}`}
            >
                <ArrowLeft size={16} /> Volver a la Lectura
            </button>

            <div className={`p-6 rounded-2xl text-center ${theme === 'dark' ? 'bg-blue-900/10' : 'bg-neutral-100'}`}>
                <p className={`text-xs uppercase font-black tracking-widest mb-2 opacity-50 ${textClasses}`}>Modo Actual</p>
                <h2 className="text-xl font-black text-orange-500 uppercase">
                    {currentView === 'community' ? 'Comunidad' : (currentView === 'map' ? 'Mapa' : (currentView === 'admin' ? 'Admin Panel' : 'Perfil'))}
                </h2>
            </div>
        </div>
    );
};
