import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Video, Play, Mic, Search, Clock, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { loadSermons, Sermon } from '../../services/sermonDataService';

const CATEGORIES = ['Arrepentimiento', 'Mayordomia', 'Espiritu Santo', 'Fe', 'Amor', 'Agradecimiento', 'Caminar con Dios', 'Bautismo'];

const catColors: Record<string, string> = {
  Arrepentimiento: '#e74c3c',
  Mayordomia: '#449BD1',
  'Espiritu Santo': '#F58634',
  Fe: '#2E7D32',
  Amor: '#e84393',
  Agradecimiento: '#fdcb6e',
  'Caminar con Dios': '#6c5ce7',
  Bautismo: '#00b894',
};

export default function SermonesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    const init = async () => {
      const data = await loadSermons();
      setSermons(data);
      setLoading(false);
    };
    init();
  }, []);

  const filtered = sermons.filter(s => {
    const matchesCategory = activeFilter ? s.category === activeFilter : true;
    const matchesSearch = searchQuery
      ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.preacher.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handlePlay = (sermon: Sermon) => {
    router.push({
      pathname: '/sermon-player',
      params: { sermon: JSON.stringify(sermon) },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Video size={28} color={colors.primary} />
        <Text style={{ fontSize: 28, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Sermones</Text>
      </View>

      <View style={{ marginHorizontal: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}>
        <Search size={18} color={colors.onSurfaceVariant} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar sermones..."
          placeholderTextColor={colors.onSurfaceVariant}
          style={{ flex: 1, marginLeft: 8, fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 6, marginBottom: 16 }}>
        <Pressable
          onPress={() => setActiveFilter(null)}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === null ? colors.primary : colors.surfaceLow }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: activeFilter === null ? colors.onPrimary : colors.onSurface }}>Todos</Text>
        </Pressable>
        {CATEGORIES.map(cat => {
          const catColor = catColors[cat] || colors.primary;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveFilter(cat)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === cat ? catColor : catColor + '18' }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: activeFilter === cat ? '#FFFFFF' : catColor }}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, gap: 16 }}>
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 40, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
            <Mic size={48} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant, marginTop: 12 }}>No hay resultados</Text>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>Intenta con otros terminos de busqueda</Text>
          </View>
        ) : (
          filtered.map((sermon) => {
            const catColor = catColors[sermon.category] || colors.primary;
            return (
              <Pressable
                key={sermon.id}
                onPress={() => handlePlay(sermon)}
                style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
              >
                <View style={{ flexDirection: 'row', gap: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: catColor, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: catColor + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={28} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }} numberOfLines={2}>{sermon.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <User size={11} color={colors.onSurfaceVariant} />
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{sermon.preacher}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} color={colors.onSurfaceVariant} />
                        <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{sermon.duration}</Text>
                      </View>
                      <View style={{ backgroundColor: catColor + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: catColor }}>{sermon.category}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handlePlay(sermon)}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: catColor, alignItems: 'center', justifyContent: 'center', shadowColor: catColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 6 }}
                  >
                    <Play size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
