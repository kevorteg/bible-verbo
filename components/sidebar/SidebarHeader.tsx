import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { MJ_LOGO_URL } from '../../constants';

interface SidebarHeaderProps {
    onClose: () => void;
    textClasses: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose, textClasses }) => {
    const [logoError, setLogoError] = useState(false);

    return (
        <div className="p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
                <div className="w-14 h-14 shrink-0 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {!logoError ? (
                        <img src={MJ_LOGO_URL} alt="Logo MJ" className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" onError={() => setLogoError(true)} />
                    ) : (
                        <Zap className="text-orange-500 w-8 h-8 fill-current relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                    )}
                </div>
                <h1 className={`text-lg font-black tracking-tighter uppercase leading-none whitespace-nowrap ${textClasses} transition-all duration-300 group-hover:tracking-normal`}>
                    Verbo<br /><span className="text-orange-600">Bible</span>
                </h1>
            </div>
            <button onClick={onClose} className={`lg:hidden p-2 opacity-50 ${textClasses}`}><X size={20} /></button>
        </div>
    );
};
