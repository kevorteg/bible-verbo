
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Loader2, List, X, Menu, Compass, RefreshCcw } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import * as UserService from '../services/userService';
import { ChurchLocation } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MapPageProps {
  theme: string;
  onOpenSidebar: () => void;
}

const MapPage: React.FC<MapPageProps> = ({ theme, onOpenSidebar }) => {
  const { user } = useAuth(); // Accedemos al usuario para leer/guardar ubicación
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [locations, setLocations] = useState<ChurchLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(true);
  const [searchStatus, setSearchStatus] = useState("Listo para explorar");
  const hasAutoLoaded = useRef(false);

  // Estilos de Tiles
  const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // Voyager es más bonito que Positron

  // Inicialización del Mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current && (window as any).L) {
      const L = (window as any).L;
      // Posición por defecto (Cali)
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, 
        attributionControl: false 
      }).setView([3.4516, -76.5320], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
        }
    });

    if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Lógica de Auto-Carga de Ubicación Guardada
  useEffect(() => {
    if (user?.location && !hasAutoLoaded.current) {
        hasAutoLoaded.current = true; // Evitar loop
        performSearch(user.location.lat, user.location.lng, false); // False = no guardar (ya está guardada)
    }
  }, [user]);

  // Efecto de Tema y Estilo "Aesthetic"
  useEffect(() => {
      if (mapInstanceRef.current && (window as any).L) {
          const map = mapInstanceRef.current;
          const L = (window as any).L;
          
          map.eachLayer((layer: any) => {
              if (layer._url) map.removeLayer(layer);
          });

          const tileUrl = theme === 'dark' ? DARK_TILES : LIGHT_TILES;
          
          const tileLayer = L.tileLayer(tileUrl, {
              subdomains: 'abcd',
              maxZoom: 20
          });

          tileLayer.addTo(map);

          // TRUCO DE ESTILO: Filtros CSS
          const container = map.getContainer();
          if (theme === 'dark') {
              // AJUSTADO: Más brillo (1.3) y menos contraste
              container.style.filter = "sepia(15%) hue-rotate(190deg) saturate(140%) brightness(1.3) contrast(0.85)";
              container.style.backgroundColor = "#0d1e3a"; 
          } else if (theme === 'sepia') {
              container.style.filter = "sepia(50%) contrast(0.95) saturate(0.8)";
              container.style.backgroundColor = "#f4ecd8";
          } else {
              container.style.filter = "none";
              container.style.backgroundColor = "#f8fafc";
          }
      }
  }, [theme]);

  // Renderizado de Marcadores
  useEffect(() => {
      if (mapInstanceRef.current && (window as any).L) {
          const map = mapInstanceRef.current;
          const L = (window as any).L;

          // Limpiar markers viejos
          map.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) map.removeLayer(layer);
          });

          if (locations.length > 0) {
              const markers: any[] = [];
              
              const orangeIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
                    width: 36px;
                    height: 36px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.4);
                  ">
                    <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
                  </div>`,
                  iconSize: [36, 48],
                  iconAnchor: [18, 48],
                  popupAnchor: [0, -50]
              });

              locations.forEach(loc => {
                  const marker = L.marker([loc.lat, loc.lng], { icon: orangeIcon })
                      .addTo(map)
                      .bindPopup(`
                          <div style="font-family: 'Inter', sans-serif; text-align: center; min-width: 200px;">
                              <div style="background: #ea580c; color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 9px; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px;">IPUC</div>
                              <h3 style="font-weight: 800; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; font-size: 13px; line-height: 1.2;">${loc.name}</h3>
                              <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">${loc.address}</p>
                              <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" target="_blank" style="
                                display: block; 
                                width: 100%;
                                padding: 8px 0;
                                background-color: #f1f5f9;
                                color: #0f172a;
                                border-radius: 8px;
                                text-decoration: none; 
                                font-size: 11px;
                                font-weight: 700;
                                transition: all 0.2s;
                              ">📍 INICIAR RUTA</a>
                          </div>
                      `);
                  markers.push(marker);
              });

              const group = L.featureGroup(markers);
              map.fitBounds(group.getBounds(), { padding: [80, 80] });
          }
      }
  }, [locations]);

  // Función centralizada de búsqueda
  const performSearch = async (latitude: number, longitude: number, shouldSave: boolean) => {
      setLoading(true);
      if (mapInstanceRef.current) mapInstanceRef.current.setView([latitude, longitude], 14);

      setSearchStatus("Consultando mapa...");

      // Guardado silencioso de ubicación (Cifrado)
      if (shouldSave && user) {
          UserService.saveUserLocation(user.id, { lat: latitude, lng: longitude });
      }
      
      const responseText = await GeminiService.generateChatResponse(
          [{ role: 'user', text: "Encuentra TODAS las iglesias IPUC cercanas a esta ubicación (incluyendo sedes de barrio como Guayaquil o Central) y dame el JSON exacto.", id: 'map-req' }], 
          null, 
          false, 
          { latitude, longitude }
      );

      const mapDataMatch = responseText.match(/<<<MAP_DATA_START>>>([\s\S]*?)<<<MAP_DATA_END>>>/);
      if (mapDataMatch) {
          try {
              const parsed = JSON.parse(mapDataMatch[1]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setLocations(parsed);
                  setSearchStatus(`${parsed.length} congregaciones halladas.`);
                  setShowList(true);
              } else {
                  setSearchStatus("No se hallaron sedes cerca.");
              }
          } catch (e) {
              setSearchStatus("Error de datos.");
          }
      } else {
          setSearchStatus("Intenta ampliar la búsqueda.");
      }
      setLoading(false);
  };

  const handleSearchNearby = () => {
    if (!navigator.geolocation) {
        alert("Geolocalización no soportada");
        return;
    }
    setSearchStatus("Obteniendo GPS...");
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            performSearch(latitude, longitude, true); // True = Guardar nueva ubicación
        },
        (error) => {
            console.error(error);
            setSearchStatus("Permiso denegado.");
        }
    );
  };

  // Clases glassmorphism adaptables
  const panelClass = theme === 'dark' 
    ? 'bg-[#0d1e3a]/90 border-white/10 text-white' 
    : theme === 'sepia'
      ? 'bg-[#f4ecd8]/95 border-[#d3c4b1] text-[#5b4636]'
      : 'bg-white/90 border-neutral-200 text-neutral-900';

  return (
    <div className={`relative w-full h-full flex flex-col md:flex-row overflow-hidden ${theme === 'dark' ? 'bg-[#0d1e3a]' : 'bg-neutral-100'}`}>
        
        {/* MAP CONTAINER - Full size absolute */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 outline-none" style={{ background: theme === 'dark' ? '#0d1e3a' : '#f0f0f0' }}></div>

        {/* MOBILE TOP BAR (Glass) */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 md:hidden pointer-events-none">
            <button onClick={onOpenSidebar} className={`p-3 backdrop-blur-md rounded-full shadow-lg pointer-events-auto transition-transform active:scale-95 ${theme === 'dark' ? 'bg-[#0d1e3a]/80 text-white' : 'bg-white/80 text-neutral-800'}`}>
                <Menu size={20} />
            </button>
        </div>

        {/* FLOATING SIDE PANEL (Desktop & Mobile Bottom Sheet) */}
        <div className={`
            absolute z-10 transition-all duration-500 ease-in-out shadow-2xl backdrop-blur-xl border
            md:top-6 md:left-6 md:bottom-6 md:w-[400px] md:rounded-3xl
            bottom-0 left-0 right-0 rounded-t-3xl md:h-auto
            flex flex-col
            ${showList ? 'translate-y-0 h-[65vh]' : 'translate-y-[85%] md:translate-y-0 md:-translate-x-[120%] h-[20vh]'}
            ${panelClass}
        `}>
            
            {/* Mobile Drag Handle */}
            <div 
                className="w-full py-3 flex justify-center md:hidden cursor-pointer" 
                onClick={() => setShowList(!showList)}
            >
                <div className="w-12 h-1.5 bg-neutral-300/50 rounded-full"></div>
            </div>

            {/* Header Panel */}
            <div className="px-6 pb-6 pt-2 md:pt-6 shrink-0 relative">
                {/* Desktop Toggle Close */}
                <button 
                    onClick={() => setShowList(false)} 
                    className="hidden md:flex absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <X size={20}/>
                </button>

                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/30">
                        <Compass size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight leading-none">Explorador</h2>
                        <span className="text-[10px] font-bold uppercase opacity-50 tracking-widest">IPUC Maps</span>
                    </div>
                </div>
                
                <div className="mt-6">
                    {/* Botón Principal (Cambia según si hay ubicación guardada o no) */}
                    {user?.location && locations.length > 0 ? (
                        <button 
                            onClick={handleSearchNearby}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><RefreshCcw size={16} /> Actualizar mi Ubicación</>}
                        </button>
                    ) : (
                        <button 
                            onClick={handleSearchNearby}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:transform-none"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Navigation size={16} /> Buscar en mi Zona</>}
                        </button>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 px-1">
                        <p className="text-[10px] font-bold uppercase opacity-40">{searchStatus}</p>
                        {locations.length > 0 && <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">{locations.length} Res.</span>}
                    </div>
                </div>
            </div>

            {/* Results List */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-3 ${showList ? 'opacity-100' : 'opacity-0 md:opacity-100'} transition-opacity duration-300`}>
                {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center opacity-30 mt-4 border-2 border-dashed border-current rounded-2xl mx-2">
                        <Search size={40} className="mb-2" />
                        <p className="text-xs font-bold uppercase max-w-[150px]">
                            {loading ? "Explorando..." : "El mapa está vacío"}
                        </p>
                    </div>
                ) : (
                    locations.map((loc, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-neutral-100 hover:border-orange-500/30 hover:shadow-lg'}`} onClick={() => {
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.setView([loc.lat, loc.lng], 16);
                                if (window.innerWidth < 768) setShowList(false);
                            }
                        }}>
                            {/* Number Badge */}
                            <div className="absolute top-4 right-4 text-[10px] font-black text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity">
                                #{idx + 1}
                            </div>

                            <h3 className="font-bold text-sm mb-1 pr-6 group-hover:text-orange-500 transition-colors">{loc.name}</h3>
                            <p className="text-xs opacity-60 line-clamp-2 mb-3 leading-relaxed">{loc.address}</p>
                            
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                                    Congregación
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Floating Toggle Button (Desktop only, when closed) */}
        {!showList && (
            <button 
                onClick={() => setShowList(true)}
                className={`hidden md:flex absolute top-6 left-6 z-10 px-5 py-3 rounded-full shadow-2xl items-center gap-2 font-black uppercase text-xs hover:scale-105 transition-transform backdrop-blur-md border ${theme === 'dark' ? 'bg-[#0d1e3a]/90 text-white border-white/10' : 'bg-white/90 text-orange-600 border-white'}`}
            >
                <List size={18} /> Ver Resultados
            </button>
        )}
    </div>
  );
};

export default MapPage;
