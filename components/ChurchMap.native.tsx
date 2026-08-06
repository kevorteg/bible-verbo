import { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, Linking, Dimensions, ScrollView, TextInput, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Navigation, Phone, Cross, MapPin, Clock, X, Search, Church as ChurchIcon } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getRoute, RouteResult } from '../services/routingService';
import { Church } from '../services/churchService';
import { FLAT_MAP_STYLE } from '../data/mapStyle';

const IPUC_COLOR = '#449BD1';
const IPUIC_COLOR = '#F58634';
const ROUTE_COLOR = '#449BD1';

interface ChurchMapProps {
  churches: Church[];
  userLocation?: { lat: number; lng: number } | null;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export default function ChurchMap({ churches, userLocation, initialRegion }: ChurchMapProps) {
  const { colors } = useTheme();
  return <NativeChurchMap churches={churches} userLocation={userLocation} initialRegion={initialRegion} colors={colors} />;
}

function NativeChurchMap({
  churches,
  userLocation,
  initialRegion,
  colors,
}: ChurchMapProps & { colors: any }) {
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const snapPoints = useMemo(() => ['30%', '55%', '85%'], []);

  const churchColor = (c: Church) => c.type === 'IPUC' ? IPUC_COLOR : IPUIC_COLOR;

  const handleMarkerPress = useCallback((church: Church) => {
    setSelectedChurch(church);
    setRouteResult(null);
    setShowRoute(false);
    bottomSheetRef.current?.snapToIndex(0);
    mapRef.current?.animateToRegion({
      latitude: church.lat,
      longitude: church.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 400);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    setSelectedChurch(null);
    setRouteResult(null);
    setShowRoute(false);
  }, []);

  const handleGetDirections = useCallback(async () => {
    if (!selectedChurch || !userLocation) return;
    setRouteLoading(true);
    setShowRoute(true);
    bottomSheetRef.current?.snapToIndex(1);

    const result = await getRoute(
      userLocation.lat,
      userLocation.lng,
      selectedChurch.lat,
      selectedChurch.lng,
    );

    setRouteResult(result);
    setRouteLoading(false);

    if (result?.coordinates.length) {
      const mid = result.coordinates[Math.floor(result.coordinates.length / 2)];
      mapRef.current?.animateToRegion({
        latitude: mid[1],
        longitude: mid[0],
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }, 500);
    }
  }, [selectedChurch, userLocation]);

  const handleCall = useCallback((phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  }, []);

  const handleOpenExternalMaps = useCallback((church: Church) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${church.lat},${church.lng}`,
      android: `geo:${church.lat},${church.lng}?q=${church.lat},${church.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`,
    })!;
    Linking.openURL(url);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={Platform.OS === 'android' ? FLAT_MAP_STYLE : undefined}
        showsUserLocation
        showsMyLocationButton
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : undefined}
        onPress={handleClose}
      >
        {churches.map(church => {
          const color = churchColor(church);
          return (
            <Marker
              key={church.id}
              coordinate={{ latitude: church.lat, longitude: church.lng }}
              onPress={() => handleMarkerPress(church)}
              tracksViewChanges={false}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 0,
                elevation: 8,
                transform: [{ rotate: '45deg' }],
              }}>
                <View style={{ transform: [{ rotate: '-45deg' }] }}>
                  <Cross size={20} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Tu ubicacion"
            pinColor={colors.primary}
          />
        )}

        {showRoute && routeResult?.coordinates.length && (
          <Polyline
            coordinates={routeResult.coordinates.map(c => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor={ROUTE_COLOR}
            strokeWidth={4}
          />
        )}
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        backgroundStyle={{
          backgroundColor: colors.surfaceLowest,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 16,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.onSurfaceVariant,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
          {selectedChurch && !showRoute && (
            <ChurchInfo
              church={selectedChurch}
              color={churchColor(selectedChurch)}
              colors={colors}
              onGetDirections={handleGetDirections}
              onCall={handleCall}
              onOpenExternal={handleOpenExternalMaps}
            />
          )}
          {selectedChurch && showRoute && (
            <RouteInfo
              church={selectedChurch}
              route={routeResult}
              loading={routeLoading}
              color={churchColor(selectedChurch)}
              colors={colors}
              expandedStep={expandedStep}
              onToggleStep={setExpandedStep}
              onBack={() => {
                setShowRoute(false);
                setRouteResult(null);
                bottomSheetRef.current?.snapToIndex(0);
              }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

function WebChurchMap({
  churches,
  userLocation,
  colors,
}: {
  churches: Church[];
  userLocation?: { lat: number; lng: number } | null;
  colors: any;
}) {
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = churches.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const churchColor = (c: Church) => c.type === 'IPUC' ? IPUC_COLOR : IPUIC_COLOR;

  const handleGetDirections = useCallback(async (church: Church) => {
    if (!userLocation) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`);
      return;
    }
    setSelectedChurch(church);
    setShowRoute(true);
    setRouteLoading(true);

    const result = await getRoute(
      userLocation.lat,
      userLocation.lng,
      church.lat,
      church.lng,
    );
    setRouteResult(result);
    setRouteLoading(false);
  }, [userLocation]);

  const startingLat = userLocation?.lat ?? 4.5709;
  const startingLng = userLocation?.lng ?? -74.2973;

  const html = buildMapHtml(filtered, startingLat, startingLng);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />

      <View style={{
        position: 'absolute',
        top: 10,
        left: 16,
        right: 16,
        zIndex: 10,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceLowest,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 6,
        }}>
          <Search size={16} color={colors.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar iglesia..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans',
              color: colors.onSurface,
              outlineStyle: 'none',
            }}
          />
        </View>
      </View>

      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: 220,
        backgroundColor: colors.surfaceLowest,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 16,
      }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 10 }}
        >
          {filtered.map(church => {
            const color = churchColor(church);
            const isSelected = selectedChurch?.id === church.id;
            return (
              <Pressable
                key={church.id}
                onPress={() => {
                  setSelectedChurch(church);
                  setShowRoute(false);
                }}
                style={{
                  width: 200,
                  backgroundColor: isSelected ? color + '15' : colors.surfaceHigh,
                  borderRadius: 14,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: color,
                }}
              >
                <Text style={{
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontSize: 13,
                  color: colors.onSurface,
                }} numberOfLines={1}>
                  {church.name}
                </Text>
                <Text style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 11,
                  color: colors.onSurfaceVariant,
                  marginTop: 2,
                }} numberOfLines={1}>
                  {church.address}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}>
                  <Text style={{
                    fontFamily: 'SpaceGrotesk',
                    fontSize: 10,
                    color,
                  }}>
                    {church.type}
                  </Text>
                  <Pressable
                    onPress={() => handleGetDirections(church)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Navigation size={14} color="#FFF" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedChurch && showRoute && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            {routeLoading ? (
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: colors.onSurfaceVariant,
                textAlign: 'center',
              }}>
                Calculando ruta...
              </Text>
            ) : routeResult ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                backgroundColor: colors.surfaceHigh,
                borderRadius: 12,
                padding: 10,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontFamily: 'SpaceGrotesk',
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                  }}>
                    Distancia
                  </Text>
                  <Text style={{
                    fontFamily: 'BricolageGrotesque',
                    fontSize: 16,
                    color: colors.onSurface,
                  }}>
                    {routeResult.distance}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontFamily: 'SpaceGrotesk',
                    fontSize: 10,
                    color: colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                  }}>
                    Duracion
                  </Text>
                  <Text style={{
                    fontFamily: 'BricolageGrotesque',
                    fontSize: 16,
                    color: colors.onSurface,
                  }}>
                    {routeResult.duration}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: colors.onSurfaceVariant,
                textAlign: 'center',
              }}>
                No se pudo calcular la ruta
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function buildMapHtml(
  churches: Church[],
  centerLat: number,
  centerLng: number,
): string {
  const markers = churches.map(c => ({
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    type: c.type,
    address: c.address,
  }));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0}
    #m{width:100vw;height:100vh}
    .leaflet-tile-pane{filter:saturate(0.3) hue-rotate(200deg) brightness(1.05)}
    .ipuc{background:#449BD1}
    .ipuic{background:#F58634}
    .pin{
      width:36px;height:36px;border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
      transform:rotate(45deg);cursor:pointer;
    }
    .pin span{transform:rotate(-45deg);color:#fff;font-size:18px;font-weight:700}
    .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
    .leaflet-popup-content{margin:10px 14px;font-family:sans-serif;font-size:13px}
  </style>
</head>
<body>
  <div id="m"></div>
  <script>
    var m = L.map('m',{zoomControl:true,attributionControl:false});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(m);
    var ch = ${JSON.stringify(markers)};
    var b = [];
    ch.forEach(function(c){
      var p = L.marker([c.lat,c.lng],{
        icon:L.divIcon({
          className:'',
          html:'<div class="pin '+(c.type==='IPUIC'?'ipuic':'ipuc')+'"><span>+</span></div>',
          iconSize:[36,36],iconAnchor:[18,18]
        })
      }).addTo(m).bindPopup('<strong>'+c.name+'</strong><br/>'+c.address+'<br/><small>'+c.type+'</small>');
      b.push([c.lat,c.lng]);
    });
    if(b.length>0)m.fitBounds(b,{padding:[40,40]});
    else m.setView([${centerLat},${centerLng}],5);
  </script>
</body>
</html>`;
}

function ChurchInfo({
  church,
  color,
  colors,
  onGetDirections,
  onCall,
  onOpenExternal,
}: {
  church: Church;
  color: string;
  colors: any;
  onGetDirections: () => void;
  onCall: (phone?: string) => void;
  onOpenExternal: (church: Church) => void;
}) {
  return (
    <View style={{ paddingTop: 8, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: color + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Cross size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'BricolageGrotesque', fontSize: 18, color: colors.onSurface }}>
            {church.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={12} color={colors.onSurfaceVariant} />
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.onSurfaceVariant }}>
              {church.address}, {church.city}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ backgroundColor: color + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk', fontSize: 11, color }}>{church.type}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Clock size={12} color={colors.onSurfaceVariant} />
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: colors.onSurfaceVariant }}>
            {church.schedule}
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.surfaceHigh,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}>
        <Text style={{
          fontFamily: 'SpaceGrotesk',
          fontSize: 11,
          color: colors.primary,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          Horarios de culto
        </Text>
        <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.onSurface, lineHeight: 20 }}>
          {church.schedule}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          onPress={onGetDirections}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 14,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 0,
            elevation: 6,
          }}
        >
          <Navigation size={18} color={colors.onPrimary} />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: colors.onPrimary }}>
            Como llegar (dentro de la app)
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {church.phone && (
            <Pressable
              onPress={() => onCall(church.phone)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.surfaceHigh,
                borderRadius: 12,
                paddingVertical: 12,
              }}
            >
              <Phone size={16} color={colors.primary} />
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: colors.primary }}>
                Llamar
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onOpenExternal(church)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: colors.surfaceHigh,
              borderRadius: 12,
              paddingVertical: 12,
            }}
          >
            <MapPin size={16} color={colors.primary} />
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: colors.primary }}>
              Maps externo
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RouteInfo({
  church,
  route,
  loading,
  color,
  colors,
  expandedStep,
  onToggleStep,
  onBack,
}: {
  church: Church;
  route: RouteResult | null;
  loading: boolean;
  color: string;
  colors: any;
  expandedStep: number | null;
  onToggleStep: (idx: number | null) => void;
  onBack: () => void;
}) {
  return (
    <View style={{ paddingTop: 8, paddingBottom: 20 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <Text style={{ fontFamily: 'BricolageGrotesque', fontSize: 18, color: colors.onSurface }}>
          Ruta a {church.name}
        </Text>
        <Pressable onPress={onBack} style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surfaceHigh,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <X size={16} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.onSurfaceVariant }}>
            Calculando ruta...
          </Text>
        </View>
      ) : route ? (
        <>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{
              flex: 1,
              backgroundColor: colors.surfaceHigh,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: 'SpaceGrotesk',
                fontSize: 11,
                color: colors.onSurfaceVariant,
                textTransform: 'uppercase',
              }}>
                Distancia
              </Text>
              <Text style={{ fontFamily: 'BricolageGrotesque', fontSize: 20, color: colors.onSurface, marginTop: 4 }}>
                {route.distance}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.surfaceHigh,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: 'SpaceGrotesk',
                fontSize: 11,
                color: colors.onSurfaceVariant,
                textTransform: 'uppercase',
              }}>
                Duracion
              </Text>
              <Text style={{ fontFamily: 'BricolageGrotesque', fontSize: 20, color: colors.onSurface, marginTop: 4 }}>
                {route.duration}
              </Text>
            </View>
          </View>

          <Text style={{
            fontFamily: 'SpaceGrotesk',
            fontSize: 12,
            color: colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}>
            Indicaciones ({route.steps.length} pasos)
          </Text>

          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {route.steps.map((step, idx) => (
              <Pressable
                key={idx}
                onPress={() => onToggleStep(expandedStep === idx ? null : idx)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: expandedStep === idx ? colors.surfaceHigh : 'transparent',
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                <Text style={{
                  flex: 1,
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  color: colors.onSurface,
                  lineHeight: 18,
                }}>
                  {step.instruction}
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk', fontSize: 11, color: colors.onSurfaceVariant }}>
                  {step.distance}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.onSurfaceVariant }}>
            No se pudo calcular la ruta
          </Text>
        </View>
      )}
    </View>
  );
}
