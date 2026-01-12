import React, { useState } from 'react';
import { Sparkles, Users, Target, MapPin, Box, Zap, BookOpen, Crown, Smile, Trophy, Heart, Gamepad2, Mic2, Sun, TreePine, Smartphone, Layers, ArrowRight, X, Copy, Share2, ArrowLeft } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { Book, Chapter } from '../types';

interface LeaderToolsProps {
    theme: 'dark' | 'light' | 'sepia';
    onBack: () => void;
    currentBook: Book | null;
    currentChapter: Chapter | null;
}

type Step = 'type' | 'format' | 'target' | 'result';

export const LeaderTools: React.FC<LeaderToolsProps> = ({ theme, onBack, currentBook, currentChapter }) => {
    const [currentStep, setCurrentStep] = useState<Step>('type');
    const [loading, setLoading] = useState(false);
    const [generatedIdea, setGeneratedIdea] = useState<string | null>(null);

    // Form State
    const [activityType, setActivityType] = useState('');
    const [format, setFormat] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [customTopic, setCustomTopic] = useState('');

    const isDark = theme === 'dark';

    // UI3 Design Tokens
    const glassCard = isDark
        ? 'bg-[#15202b]/60 backdrop-blur-xl border-white/10 shadow-2xl hover:border-orange-500/50 hover:bg-[#15202b]/80'
        : 'bg-white/60 backdrop-blur-xl border-white/40 shadow-xl hover:border-orange-500/30 hover:bg-white/80';

    const activeGlassCard = isDark
        ? 'bg-orange-600/20 border-orange-500 ring-1 ring-orange-500/50 shadow-[0_0_30px_-10px_rgba(234,88,12,0.3)]'
        : 'bg-orange-50 border-orange-500 ring-1 ring-orange-500/50 shadow-orange-500/20';

    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

    const handleGenerate = async () => {
        setLoading(true);
        setCurrentStep('result');
        try {
            const result = await GeminiService.generateLeaderActivity(
                activityType,
                format,
                targetAudience,
                customTopic || "Tema Libre",
                currentBook?.name || "",
                currentChapter?.number || ""
            );
            setGeneratedIdea(result);
        } catch (e) {
            setGeneratedIdea("Hubo un error al generar la idea.");
        } finally {
            setLoading(false);
        }
    };

    const renderOption = (id: string, label: string, icon: React.ReactNode, selectedValue: string, setter: (v: string) => void, colorClass: string) => (
        <button
            onClick={() => setter(id)}
            className={`p-5 rounded-3xl border transition-all duration-300 group flex flex-col gap-4 relative overflow-hidden text-left w-full
            ${selectedValue === id ? activeGlassCard : glassCard}`}
        >
            <div className={`p-4 rounded-2xl w-fit transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${selectedValue === id ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white' : `${colorClass} text-white`}`}>
                {icon}
            </div>
            <div>
                <span className={`font-bold text-base block mb-1 ${textPrimary}`}>{label}</span>
                {selectedValue === id && <span className="text-[10px] font-black uppercase text-orange-500 animate-pulse">Seleccionado</span>}
            </div>
            {/* Background Glow Effect */}
            {selectedValue === id && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/20 blur-2xl rounded-full pointer-events-none" />}
        </button>
    );

    return (
        <div className={`flex flex-col h-full w-full max-w-7xl mx-auto p-4 lg:p-6 animate-in fade-in slide-in-from-bottom-4`}>

            {/* Navigation Header */}
            <div className="flex items-center gap-6 mb-8 pt-2">
                <button onClick={onBack} className={`p-3 rounded-full transition-all group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                    <ArrowLeft size={24} className={isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-black'} strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-4">
                    <div className="min-w-[48px] h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Sparkles size={24} className="text-white fill-white" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 block mb-0.5">Leader Tools AI</span>
                        <h1 className={`text-2xl lg:text-3xl font-black tracking-tight leading-none ${textPrimary}`}>
                            Generador de Dinámicas
                        </h1>
                    </div>
                </div>
            </div>

            {/* Steps Progress (Apple-style segmented control visual) */}
            <div className="w-full max-w-md mx-auto mb-10">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full -z-10" />
                    <div
                        className={`absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full -z-10 transition-all duration-500 ease-out`}
                        style={{ width: currentStep === 'type' ? '0%' : currentStep === 'format' ? '33%' : currentStep === 'target' ? '66%' : '100%' }}
                    />

                    {['type', 'format', 'target', 'result'].map((step, idx) => {
                        const isActive = ['type', 'format', 'target', 'result'].indexOf(currentStep) >= idx;
                        return (
                            <div key={step} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${isActive ? 'bg-orange-500 border-orange-500 scale-125' : 'bg-gray-200 dark:bg-gray-800 border-transparent'}`} />
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">

                {/* STEP 1: TYPE */}
                {currentStep === 'type' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className={`text-2xl font-bold mb-6 text-center ${textPrimary}`}>¿Qué experiencia quieres crear hoy?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {renderOption('icebreaker', 'Rompehielo', <Smile size={28} />, activityType, setActivityType, 'bg-cyan-500')}
                            {renderOption('teaching', 'Enseñanza Activa', <Box size={28} />, activityType, setActivityType, 'bg-indigo-500')}
                            {renderOption('teambuilding', 'Trabajo en Equipo', <Users size={28} />, activityType, setActivityType, 'bg-emerald-500')}
                            {renderOption('reflexion', 'Reflexión Profunda', <Heart size={28} />, activityType, setActivityType, 'bg-rose-500')}
                            {renderOption('game', 'Juego Competitivo', <Trophy size={28} />, activityType, setActivityType, 'bg-amber-500')}
                            {renderOption('evangelism', 'Evangelismo', <Sun size={28} />, activityType, setActivityType, 'bg-violet-500')}
                        </div>
                        <div className="flex justify-center mt-10">
                            <button
                                disabled={!activityType}
                                onClick={() => setCurrentStep('format')}
                                className="px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Siguiente <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: FORMAT */}
                {currentStep === 'format' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className={`text-2xl font-bold mb-6 text-center ${textPrimary}`}>¿Cuál es el escenario?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {renderOption('indoor', 'Salón / Lugar Cerrado', <Layers size={28} />, format, setFormat, 'bg-blue-500')}
                            {renderOption('outdoor', 'Aire Libre / Parque', <TreePine size={28} />, format, setFormat, 'bg-green-500')}
                            {renderOption('noprop', 'Sin Materiales (Express)', <Zap size={28} />, format, setFormat, 'bg-yellow-500')}
                            {renderOption('board', 'Grupos Pequeños / Mesa', <Gamepad2 size={28} />, format, setFormat, 'bg-purple-500')}
                        </div>
                        <div className="flex justify-between items-center mt-10 px-4">
                            <button onClick={() => setCurrentStep('type')} className={`font-bold ${textSecondary} hover:${textPrimary}`}>Atrás</button>
                            <button
                                disabled={!format}
                                onClick={() => setCurrentStep('target')}
                                className="px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-black uppercase tracking-widest text-sm hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Siguiente <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: TARGET */}
                {currentStep === 'target' && (
                    <div className="max-w-3xl mx-auto space-y-10">
                        <div>
                            <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>¿A quiénes vas a dirigir?</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {renderOption('university', 'Universitarios', <Crown size={24} />, targetAudience, setTargetAudience, 'bg-pink-500')}
                                {renderOption('teens', 'Adolescentes', <Smartphone size={24} />, targetAudience, setTargetAudience, 'bg-blue-500')}
                                {renderOption('mixed', 'Grupo Mixto', <Users size={24} />, targetAudience, setTargetAudience, 'bg-teal-500')}
                            </div>
                        </div>

                        <div>
                            <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>Tema Específico (Opcional)</h2>
                            <div className={`p-1 rounded-2xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 ${customTopic ? 'p-[2px] bg-gradient-to-r from-orange-500 to-pink-500' : ''}`}>
                                <input
                                    type="text"
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    placeholder="Ej: Fe en la Universidad, Identidad, Presión Social..."
                                    className={`w-full p-5 rounded-xl border-none outline-none text-lg transition-all ${isDark ? 'bg-[#0f2444] text-white placeholder:text-slate-600' : 'bg-white text-slate-900 placeholder:text-slate-400'}`}
                                />
                            </div>
                            <p className="text-xs mt-3 flex items-center gap-2 opacity-60">
                                <BookOpen size={12} /> Usaremos {currentBook?.name} {currentChapter?.number} si lo dejas vacío.
                            </p>
                        </div>

                        <div className="flex justify-between items-center px-4">
                            <button onClick={() => setCurrentStep('format')} className={`font-bold ${textSecondary} hover:${textPrimary}`}>Atrás</button>
                            <button
                                disabled={!targetAudience}
                                onClick={handleGenerate}
                                className="px-12 py-4 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-full font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_-10px_rgba(234,88,12,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <Sparkles size={20} className="animate-pulse" /> Generar Magia
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: RESULT */}
                {currentStep === 'result' && (
                    <div className="h-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                                    <Sparkles size={64} className="text-orange-500 animate-spin-slow relative z-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className={`text-2xl font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent animate-pulse delay-75`}>Diseñando Experiencia...</h3>
                                    <p className={`mt-2 ${textSecondary}`}>Nuestros servidores creativos están cocinando algo genial</p>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto pb-20">
                                {generatedIdea && (() => {
                                    try {
                                        const idea = JSON.parse(generatedIdea);
                                        return (
                                            <div className="space-y-8 animate-in zoom-in-95 duration-500">

                                                {/* HERO CARD UI3 */}
                                                <div className={`relative p-8 md:p-12 rounded-[2.5rem] overflow-hidden border ${isDark ? 'border-white/5 bg-[#0b121b]' : 'border-white bg-white'} shadow-2xl`}>
                                                    {/* Decorative Gradients */}
                                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
                                                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

                                                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 mb-6 border border-orange-500/20">
                                                                <Target size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{idea.objective}</span>
                                                            </div>
                                                            <h2 className={`text-4xl md:text-6xl font-black leading-[0.9] mb-4 tracking-tight ${textPrimary}`}>
                                                                <span className="inline-block align-middle mr-4 transform -rotate-6 filter drop-shadow-lg">
                                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white border-2 border-white/20">
                                                                        <Sparkles size={32} strokeWidth={2.5} />
                                                                    </div>
                                                                </span>
                                                                {idea.title}
                                                            </h2>
                                                        </div>
                                                        <div className="flex flex-row md:flex-col gap-3 shrink-0">
                                                            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                                                <div className="p-2.5 bg-orange-500/20 text-orange-500 rounded-xl">
                                                                    <Mic2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <span className={`block text-[10px] font-black uppercase tracking-wider opacity-40 ${textPrimary}`}>Duración</span>
                                                                    <span className={`block font-bold text-lg ${textPrimary}`}>{idea.time}</span>
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                                                <div className="p-2.5 bg-blue-500/20 text-blue-500 rounded-xl">
                                                                    <Box size={20} />
                                                                </div>
                                                                <div>
                                                                    <span className={`block text-[10px] font-black uppercase tracking-wider opacity-40 ${textPrimary}`}>Materiales</span>
                                                                    <span className={`block font-bold text-lg ${textPrimary}`}>{idea.materials?.length || 0} Items</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                                    {/* MATERIALS LIST */}
                                                    <div className="lg:col-span-4">
                                                        <div className={`p-8 rounded-3xl border h-full ${isDark ? 'bg-[#1e293b]/40 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-sm`}>
                                                            <h3 className={`font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-sm ${textSecondary}`}>
                                                                <Box size={16} className="text-orange-500" /> Que necesitas
                                                            </h3>
                                                            <ul className="space-y-3">
                                                                {idea.materials?.length > 0 ? idea.materials.map((m: string, i: number) => (
                                                                    <li key={i} className={`flex items-start gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                                                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-lg shadow-orange-500/20">{i + 1}</div>
                                                                        <span className={`text-sm font-medium leading-snug ${textPrimary}`}>{m}</span>
                                                                    </li>
                                                                )) : (
                                                                    <div className="text-center py-12 opacity-40">
                                                                        <Zap size={32} className="mx-auto mb-3" />
                                                                        <p className="text-xs uppercase font-bold tracking-widest">Sin materiales</p>
                                                                    </div>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {/* BIBLE CARD */}
                                                    <div className="lg:col-span-8">
                                                        <div className={`p-10 rounded-3xl h-full relative overflow-hidden flex flex-col justify-center border ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                                                            {/* Background Pattern */}
                                                            <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-1/4 -translate-y-1/4">
                                                                <BookOpen size={400} />
                                                            </div>

                                                            <div className="relative z-10">
                                                                <h3 className="font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-blue-500 text-sm">
                                                                    <Sun size={16} /> Fundamento Bíblico
                                                                </h3>
                                                                <div className="flex gap-6">
                                                                    <div className="hidden md:block w-1 rounded-full bg-blue-500/30 shrink-0"></div>
                                                                    <p className={`text-xl md:text-2xl font-serif italic leading-relaxed ${isDark ? 'text-blue-100/90' : 'text-blue-900'}`}>
                                                                        "{idea.biblicalConnection}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* DYNAMIC TIMELINE STEPS UI3 */}
                                                <div className={`p-8 md:p-12 rounded-[2.5rem] border ${isDark ? 'bg-[#0f172a]/60 border-white/5' : 'bg-white border-gray-100'} shadow-xl backdrop-blur-sm`}>
                                                    <h3 className={`text-xl font-black uppercase tracking-widest mb-12 flex items-center gap-4 ${textPrimary}`}>
                                                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20"><Layers size={20} /></div>
                                                        La Dinámica
                                                    </h3>

                                                    <div className="space-y-0 relative">
                                                        {/* Continuous Line */}
                                                        <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-orange-500 via-orange-500/20 to-transparent opacity-50"></div>

                                                        {idea.steps?.map((step: any, idx: number) => (
                                                            <div key={idx} className="relative pl-20 pb-12 last:pb-0 group">
                                                                {/* Number Node */}
                                                                <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 shadow-xl border-4 ${isDark ? 'bg-gray-900 border-gray-800 group-hover:border-orange-500' : 'bg-white border-white group-hover:border-orange-500'}`}>
                                                                    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-orange-500`}>{idx + 1}</span>
                                                                </div>

                                                                {/* Content */}
                                                                <div className={`p-6 rounded-2xl border transition-all duration-300 hover:translate-x-2 ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-lg'}`}>
                                                                    <h4 className={`text-xl font-bold mb-3 ${textPrimary}`}>{step.title}</h4>
                                                                    <p className={`${textSecondary} leading-relaxed text-lg`}>{step.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* QUESTIONS GRID */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {idea.questions?.map((q: string, idx: number) => (
                                                        <div key={idx} className={`p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'}`}>
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg mb-4">?</div>
                                                            <p className={`font-medium ${textPrimary} leading-relaxed`}>{q}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* ACTION BAR */}
                                                <div className="flex justify-center pt-8 pb-10">
                                                    <button onClick={() => { setGeneratedIdea(null); setCurrentStep('type'); }} className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-black text-white rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3">
                                                        <Sparkles size={18} /> Crear Nueva Dinámica
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } catch (e) {
                                        return (
                                            <div className={`text-center py-20 ${textSecondary}`}>
                                                <X size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>Error al renderizar la idea.</p>
                                                <button onClick={() => setCurrentStep('type')} className="text-orange-500 font-bold mt-4">Reiniciar</button>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
