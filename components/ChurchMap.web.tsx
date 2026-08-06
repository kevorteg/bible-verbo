import { useState, useCallback } from 'react';
import { View, Text, Pressable, Linking, ScrollView, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, Search } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getRoute, RouteResult } from '../services/routingService';
import { Church } from '../services/churchService';

const IPUC_COLOR = '#449BD1';
const IPUIC_COLOR = '#F58634';

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

export default function ChurchMap({ churches, userLocation }: ChurchMapProps) {
  const { colors } = useTheme();
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
