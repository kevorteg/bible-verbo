import React, { useEffect, useState } from 'react';
import { Bell, Check, Info, Verified } from 'lucide-react';

interface ToastProps {
    message: string | null;
    onClose: () => void;
    theme: string;
}

export const ToastNotification: React.FC<ToastProps> = ({ message, onClose, theme }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [message, onClose]);

    if (!message && !visible) return null;

    const bgClass = theme === 'dark' ? 'bg-black/80 text-white border-white/10' : 'bg-black/90 text-white border-transparent';

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div className={`
                relative flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md border
                transition-all duration-500 ease-spring
                ${visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-90'}
                ${bgClass}
                min-w-[200px] max-w-[90vw]
            `}>
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 animate-pulse">
                    <Verified size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate pr-2">{message}</p>
                </div>
            </div>
        </div>
    );
};
