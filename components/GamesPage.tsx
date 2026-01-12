
import React from 'react';
import { ArrowLeft, Sparkles, BrainCircuit, Grid3X3, Zap, Trophy, Lock } from 'lucide-react';

interface GamesPageProps {
    onBack: () => void;
    onStartQuiz: () => void;
    theme: string;
}

export const GamesPage: React.FC<GamesPageProps> = ({ onBack, onStartQuiz, theme }) => {
    const isDark = theme === 'dark';
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

    const games = [
        {
            id: 'trivia',
            title: 'Trivia Bíblica',
            description: 'Pon a prueba tus conocimientos con preguntas desafiantes generadas por IA.',
            icon: <BrainCircuit size={32} className="text-white" />,
            gradient: 'from-purple-500 to-indigo-600',
            active: true,
            action: onStartQuiz
        },
        {
            id: 'soup',
            title: 'Sopa de Letras',
            description: 'Encuentra las palabras ocultas de los versículos bíblicos.',
            icon: <Grid3X3 size={32} className="text-white" />,
            gradient: 'from-orange-400 to-pink-600',
            active: false,
            comingSoon: true
        },
        {
            id: 'memory',
            title: 'Memoria Sagrada',
            description: 'Entrena tu mente emparejando personajes y eventos bíblicos.',
            icon: <Zap size={32} className="text-white" />,
            gradient: 'from-emerald-400 to-teal-600',
            active: false,
            comingSoon: true
        }
    ];

    return (
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 ${isDark ? 'bg-[#0a192f]' : 'bg-slate-50'}`}>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-6 mb-12">
                    <button onClick={onBack} className={`p-3 rounded-full transition-all group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                        <ArrowLeft size={24} className={isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-black'} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                                <Trophy size={16} className="text-white fill-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Zona de Juegos</span>
                        </div>
                        <h1 className={`text-3xl lg:text-4xl font-black tracking-tight ${textPrimary}`}>
                            Arcade Bíblico
                        </h1>
                    </div>
                </div>

                {/* Featured Game (Trivia) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => game.active && game.action?.()}
                            disabled={!game.active}
                            className={`relative p-8 rounded-[2rem] text-left transition-all duration-300 group overflow-hidden border ${game.active
                                    ? 'hover:scale-[1.02] hover:shadow-2xl cursor-pointer'
                                    : 'opacity-80 cursor-not-allowed grayscale-[0.5]'
                                } ${isDark ? 'bg-[#112240] border-white/5' : 'bg-white border-slate-200'}`}
                        >
                            {/* Background Gradient Blur */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.gradient} rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />

                            <div className="relative z-10">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {game.icon}
                                </div>

                                <h3 className={`text-2xl font-black mb-2 ${textPrimary}`}>{game.title}</h3>
                                <p className={`text-sm leading-relaxed mb-6 font-medium ${textSecondary}`}>{game.description}</p>

                                {game.active ? (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 ${textPrimary}`}>
                                        <Sparkles size={14} className="text-yellow-500" /> Jugar Ahora
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-black/20 text-slate-500">
                                        <Lock size={14} /> Próximamente
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};
