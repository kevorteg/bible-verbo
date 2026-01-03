
import React from 'react';
import { X, Calendar, Book, Trophy, LogOut, Zap } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0d1e3a] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 border border-neutral-200 dark:border-white/10">
         <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-orange-500 transition-colors">
             <X size={24} />
         </button>

         <div className="flex flex-col items-center text-center mt-4">
             {/* Avatar Grande */}
             <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl ring-4 ring-orange-100 dark:ring-white/5">
                 {user.name.charAt(0).toUpperCase()}
             </div>
             
             <h3 className="text-xl font-black uppercase tracking-wide mb-1 text-neutral-900 dark:text-white">{user.name}</h3>
             <p className="text-xs text-neutral-500 mb-6 font-medium">{user.email}</p>
             
             <div className="flex gap-2 text-[10px] font-bold uppercase text-neutral-400 bg-neutral-100 dark:bg-white/5 px-4 py-1.5 rounded-full mb-8">
                <Calendar size={12}/> Miembro desde: {new Date(user.joinedDate).toLocaleDateString()}
             </div>

             {/* Estadísticas */}
             <div className="grid grid-cols-2 gap-3 w-full mb-8">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1a2d4d] border border-neutral-100 dark:border-white/5 flex flex-col items-center">
                    <div className="text-orange-500 mb-2"><Book size={20}/></div>
                    <span className="text-2xl font-black block text-neutral-900 dark:text-white">{user.stats?.chaptersRead || 0}</span>
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Capítulos</span>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1a2d4d] border border-neutral-100 dark:border-white/5 flex flex-col items-center">
                    <div className="text-yellow-500 mb-2"><Zap size={20}/></div>
                    <span className="text-2xl font-black block text-neutral-900 dark:text-white">{user.stats?.streakDays || 0}</span>
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Días de Avivamiento</span>
                </div>
             </div>

             <button 
                onClick={() => { onLogout(); onClose(); }} 
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-wider group"
             >
                 <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/> Cerrar Sesión
             </button>
         </div>
      </div>
    </div>
  );
};

export default ProfileModal;
