
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Shield, LogOut, Search, Bell, 
  ChevronDown, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  Menu, X, Lock, Eye, KeyRound, AlertTriangle, FileText, CheckCircle2,
  Download, MessageSquare, Trash2, Heart
} from 'lucide-react';
import { User, PrayerRequest } from '../types';
import * as UserService from '../services/userService';
import * as PrayerService from '../services/prayerService';
import { decryptData } from '../services/encryptionService'; 

interface AdminDashboardProps {
  currentUser: User;
  onBack: () => void;
  theme: string;
}

const MASTER_KEY_HASH = "MJ-LIFE-KEY-2025"; 

// --- SUB-COMPONENTES UI PARA ESTILO TPRO ---

const StatCard = ({ title, value, subtext, trend, trendValue, color, chartData }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 relative overflow-hidden group hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-3xl font-bold text-neutral-800 mb-1">{value}</h3>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{title}</p>
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
         <div className={`w-3 h-3 rounded-full ${color}`}></div>
      </div>
    </div>
    
    {/* Sparkline SVG Simulado */}
    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
        <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none">
            <path d={chartData} fill="none" stroke="currentColor" strokeWidth="2" className={color.replace('bg-', 'text-')} />
            <path d={`${chartData} V 25 H 0 Z`} fill="currentColor" className={color.replace('bg-', 'text-')} style={{ opacity: 0.2 }} />
        </svg>
    </div>

    {trend && (
        <div className="flex items-center gap-1 text-xs font-bold mt-2 relative z-10">
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            </span>
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>{trendValue}</span>
            <span className="text-neutral-400 font-medium ml-1">{subtext}</span>
        </div>
    )}
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'safety' | 'community'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop default
  const [searchTerm, setSearchTerm] = useState('');

  // Safety Logic
  const [selectedUserChat, setSelectedUserChat] = useState<User | null>(null);
  const [encryptedChats, setEncryptedChats] = useState<any[]>([]);
  const [decryptedChats, setDecryptedChats] = useState<any[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allPrayers] = await Promise.all([
          UserService.getAllUsers(),
          isAdmin ? PrayerService.getAllPrayersForAdmin() : Promise.resolve([])
      ]);
      setUsers(allUsers);
      setPrayers(allPrayers);
    } catch (e) {
      console.error("Error loading admin data", e);
    } finally {
      setLoading(false);
    }
  };

  // --- CÁLCULO DE ESTADÍSTICAS REALES ---
  const calculateStats = () => {
      const totalUsers = users.length;
      const totalChapters = users.reduce((acc, u) => acc + (u.stats?.chaptersRead || 0), 0);
      const totalStreak = users.reduce((acc, u) => acc + (u.stats?.streakDays || 0), 0);
      const adminsCount = users.filter(u => u.role === 'admin' || u.role === 'leader').length;

      // Crecimiento (Nuevos en los últimos 30 días)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const newUsersCount = users.filter(u => new Date(u.joinedDate) > thirtyDaysAgo).length;
      const growthRate = totalUsers > 0 ? Math.round((newUsersCount / totalUsers) * 100) : 0;

      // Usuarios Activos (Actividad en los últimos 7 días)
      const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
      const activeUsersCount = users.filter(u => u.stats?.lastActivityDate && new Date(u.stats.lastActivityDate) > sevenDaysAgo).length;
      const retentionRate = totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 0;

      // Top Lectores (Real Data)
      const topReaders = [...users]
          .sort((a, b) => (b.stats?.chaptersRead || 0) - (a.stats?.chaptersRead || 0))
          .slice(0, 7); // Top 7 para la gráfica

      return {
          totalUsers, totalChapters, totalStreak, adminsCount,
          newUsersCount, growthRate, activeUsersCount, retentionRate,
          topReaders
      };
  };

  const stats = calculateStats();

  // --- FUNCIONES ---

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
    try {
        await UserService.updateUserRole(userId, newRole as any);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (e) {
        alert("Error al actualizar rol");
    }
  };

  const handleDeletePrayer = async (id: string) => {
      if (!confirm("¿Borrar esta petición del muro permanentemente?")) return;
      try {
          await PrayerService.deletePrayer(id);
          setPrayers(prayers.filter(p => p.id !== id));
      } catch (e) { alert("Error al borrar"); }
  };

  const handleExportCSV = () => {
      const headers = ["ID", "Nombre", "Rol", "Fecha Ingreso", "Caps Leidos", "Racha Dias", "Ultima Actividad"];
      const rows = users.map(u => [
          u.id, 
          u.name, 
          u.role || 'user', 
          new Date(u.joinedDate).toLocaleDateString(),
          u.stats?.chaptersRead || 0,
          u.stats?.streakDays || 0,
          u.stats?.lastActivityDate || 'N/A'
      ]);

      const csvContent = [
          headers.join(","),
          ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Verbo_Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleViewChats = async (user: User) => {
    if (!isAdmin) return;
    setSelectedUserChat(user);
    setEncryptedChats([]);
    setDecryptedChats([]);
    setIsEmergencyMode(false);
    setMasterKeyInput('');
    try {
        const chats = await UserService.getEncryptedChatHistory(user.id);
        setEncryptedChats(chats);
    } catch (e) { alert("Error cargando historial"); }
  };

  const handleEmergencyUnlock = () => {
    if (masterKeyInput !== MASTER_KEY_HASH) {
        setUnlockError("Llave maestra incorrecta.");
        return;
    }
    const unlocked = encryptedChats.map(c => ({ ...c, text: decryptData(c.encrypted_content) }));
    setDecryptedChats(unlocked);
    setIsEmergencyMode(true);
    setUnlockError('');
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-[#f3f4f6] font-sans text-neutral-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`bg-[#111827] text-white flex flex-col transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'} h-full shrink-0 shadow-xl`}>
        <div className="h-16 flex items-center justify-center border-b border-white/10 relative">
             {sidebarOpen ? (
                 <h1 className="text-xl font-bold tracking-tight">Verbo<span className="text-orange-500">Admin</span></h1>
             ) : (
                 <span className="text-orange-500 font-black text-xl">V</span>
             )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-bold uppercase text-neutral-500 px-3 mb-2 tracking-wider">Apps</div>
            
            <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-900/20' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
                <LayoutDashboard size={20} />
                {sidebarOpen && <span className="font-medium text-sm">Dashboard</span>}
            </button>

            <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
                <Users size={20} />
                {sidebarOpen && <span className="font-medium text-sm">Usuarios</span>}
            </button>

            {isAdmin && (
                <>
                <button 
                    onClick={() => setActiveTab('community')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'community' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-900/20' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <MessageSquare size={20} />
                    {sidebarOpen && <span className="font-medium text-sm">Moderación</span>}
                </button>

                <button 
                    onClick={() => setActiveTab('safety')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'safety' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/20' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <Shield size={20} />
                    {sidebarOpen && <span className="font-medium text-sm">Seguridad</span>}
                </button>
                </>
            )}

            <div className="mt-8 text-[10px] font-bold uppercase text-neutral-500 px-3 mb-2 tracking-wider">Sistema</div>
            <button 
                onClick={onBack}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:bg-white/5 hover:text-white transition-all group"
            >
                <LogOut size={20} className="group-hover:text-red-400"/>
                {sidebarOpen && <span className="font-medium text-sm">Salir al App</span>}
            </button>
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#0f1522]">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-lg">
                    {currentUser.name.charAt(0)}
                </div>
                {sidebarOpen && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">{currentUser.role || 'Admin'}</p>
                    </div>
                )}
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* TOP HEADER */}
          <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-8 shadow-sm z-10">
              <div className="flex items-center gap-4">
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors">
                      <Menu size={20} />
                  </button>
                  <div className="relative hidden md:block w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Buscar en el panel..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all"
                      />
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 pr-2 border-l pl-4 border-neutral-200">
                      <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-neutral-800">Misión Juvenil</p>
                          <p className="text-[10px] text-neutral-400">Distrito 5</p>
                      </div>
                      <ChevronDown size={14} className="text-neutral-300"/>
                  </div>
              </div>
          </header>

          {/* DASHBOARD CONTENT SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              
              {/* VISTA OVERVIEW */}
              {activeTab === 'overview' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Resumen General</h2>
                      
                      {/* STATS CARDS REALES */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                          <StatCard 
                             title="Usuarios Totales" 
                             value={stats.totalUsers} 
                             subtext="vs mes pasado" 
                             trend="up" 
                             trendValue={`+${stats.growthRate}%`} 
                             color="bg-purple-600" 
                             chartData="M0,25 C30,25 30,10 50,15 S70,5 100,10"
                          />
                          <StatCard 
                             title="Capítulos Leídos" 
                             value={stats.totalChapters} 
                             subtext="lectura global" 
                             trend="up" 
                             trendValue="Total" 
                             color="bg-orange-500" 
                             chartData="M0,25 C20,20 40,25 50,10 S80,0 100,5"
                          />
                          <StatCard 
                             title="Días de Racha (Global)" 
                             value={stats.totalStreak} 
                             subtext="fidelidad" 
                             trend="down" 
                             trendValue="Global" 
                             color="bg-blue-500" 
                             chartData="M0,20 L20,15 L40,20 L60,10 L80,15 L100,0"
                          />
                           <StatCard 
                             title="Equipo Líder" 
                             value={stats.adminsCount} 
                             subtext="activos" 
                             trend="up" 
                             trendValue="Stable" 
                             color="bg-green-500" 
                             chartData="M0,25 H100"
                          />
                      </div>

                      {/* CHARTS ROW */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* REAL DATA BAR CHART: TOP READERS */}
                          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                              <div className="flex justify-between items-center mb-6">
                                  <div>
                                      <h3 className="font-bold text-lg text-neutral-800">Top 7 Lectores (Ranking)</h3>
                                      <p className="text-xs text-neutral-400">Basado en capítulos leídos</p>
                                  </div>
                              </div>
                              <div className="h-64 flex items-end justify-between gap-2 px-4">
                                  {stats.topReaders.length === 0 ? (
                                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">Sin datos aún</div>
                                  ) : (
                                      stats.topReaders.map((u, i) => {
                                          const maxReads = stats.topReaders[0]?.stats?.chaptersRead || 1;
                                          const height = Math.max(((u.stats?.chaptersRead || 0) / maxReads) * 100, 5); // Min 5% height
                                          
                                          return (
                                              <div key={u.id} className="w-full flex flex-col justify-end group cursor-pointer" title={`${u.name}: ${u.stats?.chaptersRead} caps`}>
                                                  <div 
                                                    className="w-full bg-orange-100 rounded-t-lg group-hover:bg-orange-500 transition-all relative"
                                                    style={{ height: `${height}%` }}
                                                  >
                                                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                                          {u.stats?.chaptersRead} caps
                                                      </div>
                                                  </div>
                                                  <div className="text-[10px] text-center text-neutral-400 mt-2 font-bold truncate px-1">{u.name.split(' ')[0]}</div>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                          </div>

                          {/* REAL DATA DONUT CHART: RETENTION */}
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center relative">
                               <h3 className="absolute top-6 left-6 font-bold text-lg text-neutral-800">Retención Real</h3>
                               
                               <div className="relative w-48 h-48 mt-8">
                                   <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                                       {/* Segmento Activo */}
                                       <circle 
                                            cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="12" strokeLinecap="round" 
                                            strokeDasharray={`${(stats.retentionRate * 251) / 100} 251`} 
                                            className="drop-shadow-lg transition-all duration-1000" 
                                        />
                                   </svg>
                                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                                       <span className="text-3xl font-black text-neutral-800">{stats.retentionRate}%</span>
                                       <span className="text-[10px] font-bold uppercase text-neutral-400">Activos (7d)</span>
                                   </div>
                               </div>

                               <div className="flex justify-center gap-6 w-full mt-8">
                                   <div className="text-center">
                                       <span className="block text-xs text-neutral-400 uppercase font-bold">Nuevos (30d)</span>
                                       <span className="block text-lg font-bold text-neutral-800">{stats.newUsersCount}</span>
                                   </div>
                                   <div className="text-center">
                                       <span className="block text-xs text-neutral-400 uppercase font-bold">Activos Hoy</span>
                                       <span className="block text-lg font-bold text-neutral-800">{stats.activeUsersCount}</span>
                                   </div>
                               </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* VISTA USUARIOS */}
              {activeTab === 'users' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden animate-in fade-in">
                      <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                          <h2 className="font-bold text-lg">Base de Usuarios ({filteredUsers.length})</h2>
                          <div className="flex gap-2">
                             <button 
                                onClick={handleExportCSV}
                                className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
                             >
                                 <Download size={14}/> Exportar CSV
                             </button>
                             <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20">+ Añadir Usuario</button>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-xs">
                                  <tr>
                                      <th className="px-6 py-4">Usuario</th>
                                      <th className="px-6 py-4">Rol</th>
                                      <th className="px-6 py-4">Progreso</th>
                                      <th className="px-6 py-4">Última Act.</th>
                                      <th className="px-6 py-4 text-right">Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                  {filteredUsers.map(u => (
                                      <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-600 text-xs">
                                                      {u.name.charAt(0)}
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-neutral-800">{u.name}</p>
                                                      <p className="text-xs text-neutral-400">{u.id.substring(0,8)}...</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                  u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                                                  (u.role === 'leader' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500')
                                              }`}>
                                                  {u.role || 'user'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-1">
                                                  <div className="h-full bg-orange-500" style={{ width: `${Math.min((u.stats?.chaptersRead || 0), 100)}%` }}></div>
                                              </div>
                                              <span className="text-[10px] text-neutral-400 font-bold">{u.stats?.chaptersRead || 0} capítulos</span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className="text-xs font-mono text-neutral-500">
                                                  {u.stats?.lastActivityDate || 'N/A'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              {isAdmin && (
                                                  <select 
                                                      value={u.role || 'user'} 
                                                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                      className="text-xs border rounded-lg p-1 outline-none focus:border-orange-500 bg-white"
                                                  >
                                                      <option value="user">User</option>
                                                      <option value="leader">Líder</option>
                                                      <option value="admin">Admin</option>
                                                  </select>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* VISTA MODERACIÓN COMUNIDAD (NUEVA) */}
              {activeTab === 'community' && isAdmin && (
                   <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden animate-in fade-in">
                       <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                           <h2 className="font-bold text-lg flex items-center gap-2"><MessageSquare size={18}/> Moderación de Muro</h2>
                           <span className="text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{prayers.length} Peticiones</span>
                       </div>
                       <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold text-xs">
                                   <tr>
                                       <th className="px-6 py-4">Autor</th>
                                       <th className="px-6 py-4 w-1/2">Contenido</th>
                                       <th className="px-6 py-4">Categoría</th>
                                       <th className="px-6 py-4 text-right">Acción</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-neutral-100">
                                   {prayers.map(p => (
                                       <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                                           <td className="px-6 py-4">
                                               <div className="font-bold text-neutral-800">{p.is_anonymous ? 'Anónimo' : p.author_name}</div>
                                               <div className="text-[10px] text-neutral-400">{new Date(p.created_at).toLocaleDateString()}</div>
                                           </td>
                                           <td className="px-6 py-4">
                                               <p className="line-clamp-2 text-neutral-600">{p.content}</p>
                                               {p.testimony && <p className="text-[10px] text-orange-600 font-bold mt-1">Has Testimonio: {p.testimony.substring(0,20)}...</p>}
                                           </td>
                                           <td className="px-6 py-4">
                                               <span className="px-2 py-1 bg-neutral-100 rounded text-[10px] uppercase font-bold">{p.category}</span>
                                           </td>
                                           <td className="px-6 py-4 text-right">
                                               <button 
                                                  onClick={() => handleDeletePrayer(p.id)}
                                                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                  title="Borrar Petición"
                                               >
                                                   <Trash2 size={16}/>
                                               </button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
              )}

              {/* VISTA SAFETY */}
              {activeTab === 'safety' && isAdmin && (
                  <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)]">
                      {/* Listado Izquierdo */}
                      <div className="w-full xl:w-80 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden flex flex-col shrink-0">
                          <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                              <h3 className="font-bold text-neutral-800 text-sm">Auditoría de Chat</h3>
                          </div>
                          <div className="flex-1 overflow-y-auto">
                              {users.map(u => (
                                  <button 
                                      key={u.id}
                                      onClick={() => handleViewChats(u)}
                                      className={`w-full text-left p-4 border-b border-neutral-50 hover:bg-neutral-50 transition-all flex items-center gap-3 ${selectedUserChat?.id === u.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                                  >
                                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                                      <span className="text-sm font-medium text-neutral-700 truncate">{u.name}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Chat Viewer Derecho */}
                      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden flex flex-col relative">
                          {!selectedUserChat ? (
                              <div className="flex flex-col items-center justify-center h-full opacity-30">
                                  <Shield size={64} className="mb-4 text-neutral-400"/>
                                  <p className="font-bold text-neutral-500">Selecciona un usuario para auditar</p>
                              </div>
                          ) : (
                              <>
                                  <div className="h-16 border-b border-neutral-100 flex items-center justify-between px-6 bg-neutral-50/50">
                                      <div>
                                          <h3 className="font-bold text-neutral-800">{selectedUserChat.name}</h3>
                                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-neutral-400">
                                              {isEmergencyMode ? <span className="text-red-500 flex items-center gap-1"><Eye size={10}/> Desbloqueado</span> : <span className="text-green-600 flex items-center gap-1"><Lock size={10}/> Cifrado AES-256</span>}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
                                      {!isEmergencyMode ? (
                                          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
                                               <div className="p-4 bg-red-50 rounded-full mb-4 text-red-500"><AlertTriangle size={32}/></div>
                                               <h3 className="font-bold text-lg text-neutral-800 mb-2">Contenido Protegido</h3>
                                               <p className="text-sm text-neutral-500 mb-6">El historial de chat es privado. Para acceder, debes ingresar la Llave Maestra de Misión Juvenil. Esta acción queda registrada.</p>
                                               
                                               <div className="w-full relative">
                                                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16}/>
                                                   <input 
                                                      type="password" 
                                                      placeholder="Llave Maestra"
                                                      value={masterKeyInput}
                                                      onChange={(e) => setMasterKeyInput(e.target.value)}
                                                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm font-mono mb-2"
                                                   />
                                               </div>
                                               {unlockError && <p className="text-xs text-red-500 font-bold mb-2">{unlockError}</p>}
                                               <button onClick={handleEmergencyUnlock} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl text-sm shadow-lg hover:bg-red-700 transition-all">
                                                   Desbloquear Contenido
                                               </button>
                                          </div>
                                      ) : (
                                          <div className="space-y-4">
                                              {decryptedChats.map((msg, idx) => (
                                                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-neutral-100 text-neutral-700 rounded-bl-sm'}`}>
                                                          <p>{msg.text}</p>
                                                          <span className="text-[9px] opacity-50 block mt-2 text-right">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              )}

          </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
