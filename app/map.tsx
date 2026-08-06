import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowLeft, Church, MapPin, Search } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadChurches, getNearestChurches, type Church as IPUCChurch } from '../services/churchService';
import ChurchMap from '../components/ChurchMap';

const IPUC_COLOR = '#449BD1';
const IPUIC_COLOR = '#F58634';

export default function MapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [churches, setChurches] = useState<IPUCChurch[]>([]);
  const [nearbyChurches, setNearbyChurches] = useState<IPUCChurch[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'IPUC' | 'IPUIC'>('all');

  const initialRegion = {
    latitude: userLocation?.lat || 4.5709,
    longitude: userLocation?.lng || -74.2973,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  useEffect(() => {
    const init = async () => {
      const data = await loadChurches();
      setChurches(data);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setNearbyChurches(getNearestChurches(loc.coords.latitude, loc.coords.longitude, data, 50));
        } else {
          setNearbyChurches(data);
        }
      } catch {
        setNearbyChurches(data);
      }

      setLoading(false);
    };
    init();
  }, []);

  const filtered = nearbyChurches.filter(c => {
    const matchesType = selectedType === 'all' ? true : c.type === selectedType;
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesType && matchesSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 10,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingHorizontal: 16,
        gap: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceLowest,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: 'rgba(0,0,0,0.12)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <ArrowLeft size={20} color={colors.onSurface} />
          </Pressable>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceLowest,
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
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
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={() => setSelectedType('all')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 5,
              borderRadius: 14,
              backgroundColor: selectedType === 'all' ? colors.primary : colors.surfaceLowest,
              shadowColor: selectedType === 'all' ? colors.primary : 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: selectedType === 'all' ? colors.onPrimary : colors.onSurface,
            }}>
              Todas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedType('IPUC')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 14,
              backgroundColor: selectedType === 'IPUC' ? IPUC_COLOR : colors.surfaceLowest,
              shadowColor: selectedType === 'IPUC' ? IPUC_COLOR : 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: selectedType === 'IPUC' ? '#FFF' : IPUC_COLOR,
            }}>
              IPUC
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedType('IPUIC')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 14,
              backgroundColor: selectedType === 'IPUIC' ? IPUIC_COLOR : colors.surfaceLowest,
              shadowColor: selectedType === 'IPUIC' ? IPUIC_COLOR : 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: selectedType === 'IPUIC' ? '#FFF' : IPUIC_COLOR,
            }}>
              IPUIC
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ChurchMap
          churches={filtered}
          userLocation={userLocation}
          initialRegion={initialRegion}
        />
      )}
    </SafeAreaView>
  );
}
