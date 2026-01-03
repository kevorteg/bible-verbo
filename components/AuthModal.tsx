
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, RefreshCcw, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MJ_LOGO_URL } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translateError = (msg: string) => {
    if (msg.includes("Email signups are disabled")) return "El registro está desactivado en el sistema (Supabase). Activa 'Enable Email Signup'.";
    if (msg.includes("User already registered")) return "Este correo ya está registrado. Intenta iniciar sesión.";
    if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
    if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (msg.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
    if (msg.includes("Signup requires a valid password")) return "La contraseña no es válida.";
    return msg;
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithMagicCode, register, verifyOtp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP States
  const [verificationPending, setVerificationPending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'magic') {
          if (!email.trim()) throw new Error("Ingresa tu correo");
          await loginWithMagicCode(email);
          setVerificationPending(true); 
      } else {
        if (!name.trim()) throw new Error("El nombre es obligatorio");
        await register(name, email, password);
        onClose(); 
      }
    } catch (err: any) {
      if (err.message === 'CONFIRM_EMAIL') {
          setVerificationPending(true);
      } else {
          setError(translateError(err.message || "Ocurrió un error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
          if (!otpCode.trim()) throw new Error("Ingresa el código");
          await verifyOtp(email, otpCode);
          onClose();
      } catch (err: any) {
          setError("Código incorrecto o expirado.");
      } finally {
          setLoading(false);
      }
  };

  const resetForm = () => {
      setMode('login');
      setError(null);
      setVerificationPending(false);
      setOtpCode('');
      setName('');
      setEmail('');
      setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0d1e3a] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
        
        <div className="h-40 bg-gradient-to-br from-orange-600 to-orange-800 flex flex-col items-center justify-center relative">
           <button onClick={() => { onClose(); setTimeout(resetForm, 300); }} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
             <X size={24} />
           </button>
           
           <div className="bg-[#0d1e3a] p-3 rounded-full shadow-xl mb-3 border-2 border-orange-400/30">
             <img src={MJ_LOGO_URL} alt="MJ" className="w-12 h-12 object-contain" />
           </div>
           
           <h2 className="text-white font-black uppercase tracking-widest text-lg drop-shadow-md">
             {verificationPending ? 'Verificación' : (mode === 'login' ? 'Bienvenido' : (mode === 'magic' ? 'Acceso Rápido' : 'Únete a la Misión'))}
           </h2>
        </div>

        <div className="p-8">
            {verificationPending ? (
                <div className="animate-in zoom-in">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto text-orange-600">
                            <KeyRound size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Código de Acceso</h3>
                        <p className="text-sm text-neutral-500 mb-2">
                            Enviamos el código a <span className="font-bold text-orange-600">{email}</span>.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input 
                            type="text" 
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className="w-full bg-neutral-100 dark:bg-[#1a2d4d] border-transparent focus:bg-white focus:border-orange-500 border-2 rounded-xl py-4 text-center text-2xl tracking-[0.5em] outline-none transition-all text-neutral-900 dark:text-white font-black placeholder:tracking-normal placeholder:text-sm"
                            placeholder="000000"
                            autoFocus
                        />

                        <button 
                            type="submit" 
                            disabled={loading || otpCode.length < 6}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 transition-all mt-4 transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                        </button>
                    </form>
                    
                    <button onClick={() => setVerificationPending(false)} className="w-full mt-4 text-xs text-neutral-400 py-2 hover:text-neutral-600">Volver</button>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                            <AlertCircle size={16} className="shrink-0" /> <span className="flex-1">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-neutral-400 pl-2">Nombre</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input 
                                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-neutral-100 dark:bg-[#1a2d4d] border-2 border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 outline-none text-neutral-900 dark:text-white transition-all"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-neutral-400 pl-2">Correo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input 
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-100 dark:bg-[#1a2d4d] border-2 border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 outline-none text-neutral-900 dark:text-white transition-all"
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>

                        {mode !== 'magic' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-neutral-400 pl-2">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input 
                                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-neutral-100 dark:bg-[#1a2d4d] border-2 border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 outline-none text-neutral-900 dark:text-white transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 transition-all mt-4 transform active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                mode === 'magic' ? 'Enviar Código de Acceso' : 
                                (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')
                            )} 
                            {!loading && <ArrowRight size={18}/>}
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-2 text-center">
                        {mode === 'login' && (
                             <button 
                                onClick={() => { setMode('magic'); setError(null); }}
                                className="text-xs text-orange-600 font-bold hover:underline"
                             >
                                 ¿Olvidaste tu contraseña?
                             </button>
                        )}
                        
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                            {mode === 'register' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}
                            <button 
                                onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}
                                className="ml-2 font-black text-neutral-700 dark:text-white hover:underline"
                            >
                                {mode === 'register' ? 'Ingresa aquí' : 'Regístrate'}
                            </button>
                        </p>
                        
                        {mode === 'magic' && (
                            <button onClick={() => setMode('login')} className="text-xs text-neutral-400 hover:text-neutral-600 mt-2">
                                Volver a contraseña
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
