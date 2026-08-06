import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Heart, Share2, Flame, Sun, Bookmark, Sparkles, ChevronRight, CheckCircle2, Quote, Lightbulb, Menu, Zap, ArrowLeft, Volume2, User, Search } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../hooks/useGamification';
import { getFavorites } from '../../services/favoritesService';
import { playCompletionSound } from '../../services/audioUtils';

interface Devocional {
  id: string;
  title: string;
  text: string;
  verse: string;
  author: string;
  date: string;
  readTime: string;
  theme: string;
}

const DEVOCIONALES_SEED: Devocional[] = [
  {
    id: '1',
    title: 'La Fidelidad de Dios en Tiempos Dificiles',
    text: 'En medio de las tormentas de la vida, la fidelidad de Dios permanece inquebrantable. Cuando todo parece derrumbarse a nuestro alrededor, podemos encontrar consuelo en saber que El nunca nos abandona. Su amor es constante, Su misericordia es nueva cada manana, y Sus promesas son siempre fieles. No importa cuan grande sea la prueba, Dios es mas grande. No importa cuan oscura sea la noche, Su luz brilla con mas intensidad. Confia en El, porque El es fiel.',
    verse: 'Lamentaciones 3:22-23',
    author: 'Devocional Verbo',
    date: '2026-07-04',
    readTime: '3 min',
    theme: 'Fe',
  },
  {
    id: '2',
    title: 'El Poder de la Oracion Constante',
    text: 'La oracion no es solo un ritual religioso, es la conexion viva con el Dios vivo. A traves de la oracion, no solo presentamos nuestras peticiones, sino que alineamos nuestro corazon con la voluntad de Dios. La oracion constante nos mantiene en comunion con El, nos fortalece en la debilidad, y nos da paz en medio del caos. No subestimes el poder de una oracion sincera. Dios escucha, Dios responde, Dios transforma.',
    verse: '1 Tesalonicenses 5:16-18',
    author: 'Devocional Verbo',
    date: '2026-07-03',
    readTime: '4 min',
    theme: 'Oracion',
  },
  {
    id: '3',
    title: 'Caminando en Humildad',
    text: 'La humildad no es pensar menos de ti mismo, es pensar en ti mismo menos. Es reconocer que todo lo que somos y tenemos viene de Dios. Jesus, siendo Dios, se humillo a si mismo tomando forma de siervo. Que ejemplo tan poderoso! Cuando caminamos en humildad, Dios nos exalta. Cuando nos sujetamos unos a otros, el cuerpo de Cristo funciona en armonia. La humildad abre puertas que el orgullo mantiene cerradas.',
    verse: 'Filipenses 2:3-4',
    author: 'Devocional Verbo',
    date: '2026-07-02',
    readTime: '3 min',
    theme: 'Humildad',
  },
  {
    id: '4',
    title: 'Esperanza en Medio de la Prueba',
    text: 'Las pruebas no son senales de que Dios nos haya abandonado, sino oportunidades para que Su poder se manifieste en nuestras vidas. El proposito de Dios no es hacernos sufrir, sino formarnos, pulirnos, y prepararnos para algo mayor. La esperanza cristiana no es un optimismo ciego, sino la confianza segura en que Dios esta obrando aun cuando no podemos verlo. Manten firme tu esperanza, porque el que prometio es fiel.',
    verse: 'Romanos 5:3-5',
    author: 'Devocional Verbo',
    date: '2026-07-01',
    readTime: '4 min',
    theme: 'Esperanza',
  },
  {
    id: '5',
    title: 'El Amor Que Transforma',
    text: 'El amor de Dios no es un sentimiento pasajero, es una decision eterna. Nos amo primero, mientras aun eramos pecadores. Ese amor transformador es el mismo que nos llama hoy a amar a los demas. No con un amor condicional o interesado, sino con el amor agape que busca el bien del otro sin esperar nada a cambio. Cuando permitimos que el amor de Dios fluya a traves de nosotros, nos convertimos en canales de bendicion para quienes nos rodean.',
    verse: '1 Juan 4:19-21',
    author: 'Devocional Verbo',
    date: '2026-06-30',
    readTime: '3 min',
    theme: 'Amor',
  },
  {
    id: '6',
    title: 'La Paz que Sobrepasa el Entendimiento',
    text: 'En un mundo lleno de ansiedad y preocupacion, Dios nos ofrece una paz que no depende de las circunstancias. Esta paz no es la ausencia de problemas, sino la presencia de Cristo en medio de ellos. Cuando entregamos nuestras cargas al Senor, El nos sostiene. Cuando confiamos en Su soberania, nuestro corazon encuentra descanso. La paz de Dios guardara nuestros corazones y pensamientos en Cristo Jesus.',
    verse: 'Filipenses 4:6-7',
    author: 'Devocional Verbo',
    date: '2026-06-29',
    readTime: '3 min',
    theme: 'Paz',
  },
];

const ALL_THEMES = ['Todos', 'Fe', 'Oracion', 'Humildad', 'Esperanza', 'Amor', 'Paz'];

function seriesColor(name: string, idx: number): string {
  const colors = ['#449BD1', '#473458', '#F58634', '#2E7D32', '#E8A0C8', '#D4A574'];
  return colors[idx % colors.length];
}

export default function DevocionesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data, doClaimDailyReward } = useGamification();
  const [search, setSearch] = useState('');
  const [activeTheme, setActiveTheme] = useState('Todos');
  const [selected, setSelected] = useState<Devocional | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [completed, setCompleted] = useState(false);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    getFavorites().then(list => setFavCount(list.length));
  }, []);

  const filtered = DEVOCIONALES_SEED.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.verse.toLowerCase().includes(search.toLowerCase());
    const matchesTheme = activeTheme === 'Todos' || d.theme === activeTheme;
    return matchesSearch && matchesTheme;
  });

  if (selected) {
    const accentColor = seriesColor(selected.theme, DEVOCIONALES_SEED.indexOf(selected));
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 4, borderBottomColor: colors.surfaceContainerHigh }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable onPress={() => { setSelected(null); setReflectionText(''); setCompleted(false); }} style={{ padding: 8, borderRadius: 99 }}>
                <ArrowLeft size={24} color={colors.primary} />
              </Pressable>
              <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Verbo</Text>
            </View>
            <Pressable style={{ padding: 8, borderRadius: 99 }}>
              <Zap size={22} color={colors.tertiary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 24, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1 }}>DEVOCIONAL DIARIO</Text>
            </View>
            <Text style={{ fontSize: 32, fontFamily: 'BricolageGrotesque', color: colors.onSurface, textAlign: 'center', lineHeight: 40 }}>{selected.title}</Text>
          </View>

          <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.secondaryContainer, borderRadius: 16, padding: 24, borderWidth: 4, borderColor: colors.secondary, shadowColor: '#005278', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 10 }}>
            <View style={{ position: 'absolute', top: -16, left: -8, backgroundColor: colors.secondary, width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#001e2f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}>
              <Quote size={24} color={'#FFFFFF'} />
            </View>
            <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSecondaryContainer, lineHeight: 30, marginBottom: 16, marginTop: 8, fontStyle: 'italic' }}>{selected.verse}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSecondaryFixedVariant }}>{selected.verse}</Text>
              <Pressable style={{ padding: 4 }}>
                <Volume2 size={20} color={colors.onSecondaryContainer} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 24, borderWidth: 2, borderColor: colors.surfaceVariant }}>
            <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, lineHeight: 28, marginBottom: 16 }}>{selected.text}</Text>
            <View style={{ backgroundColor: colors.surfaceBright, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.outlineVariant, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, lineHeight: 24, fontStyle: 'italic' }}>
                La esperanza verdadera se encuentra en la espera. Es la confianza silenciosa de que el amanecer viene, aun cuando la noche se siente mas larga.
              </Text>
            </View>
          </View>

          <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.tertiaryContainer, borderRadius: 16, padding: 24, borderWidth: 4, borderColor: colors.tertiary, shadowColor: colors.tertiaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Lightbulb size={24} color={colors.onTertiaryContainer} />
              <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onTertiaryContainer }}>Reflexion</Text>
            </View>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onTertiaryFixedVariant, marginBottom: 16 }}>
              Piensa en una situacion donde has estado confiando en tu propia fuerza. Como puedes poner tu esperanza en Dios hoy?
            </Text>
            <TextInput
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="Escribe tu reflexion aqui..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: colors.surfaceBright, borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'PlusJakartaSans', color: colors.onSurface, borderWidth: 1, borderColor: colors.outlineVariant, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View style={{ alignItems: 'center', paddingTop: 16, gap: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 8 }}>
                <User size={40} color={colors.primary} />
              </View>
            </View>
            <Pressable
              onPress={() => {
                if (!completed) {
                  setCompleted(true);
                  playCompletionSound();
                }
              }}
              style={{
                backgroundColor: completed ? '#2E7D32' : colors.primary,
                borderRadius: 99,
                paddingHorizontal: 48,
                paddingVertical: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: completed ? 'rgba(46,125,50,0.6)' : colors.primaryShadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 12,
              }}
            >
              <CheckCircle2 size={28} color={'#FFFFFF'} />
              <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: '#FFFFFF' }}>{completed ? 'Completado' : 'Marcar como leido'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyClaimed = data.dailyRewardClaimed && data.lastDailyRewardDate === todayStr;
  const todaysDev = DEVOCIONALES_SEED[0];
  const series = [
    { title: 'Encontrando Paz', days: 7, progress: 40, icon: 'spa', color: colors.secondaryContainer },
    { title: 'Viviendo con Proposito', days: 12, progress: 0, icon: 'explore', color: colors.tertiaryContainer },
    { title: 'Nuevos Comienzos', days: 5, progress: 80, icon: 'eco', color: colors.primaryContainer },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable style={{ padding: 8, borderRadius: 99 }}>
              <Menu size={24} color={colors.primary} />
            </Pressable>
            <Text style={{ fontSize: 28, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Verbo</Text>
          </View>
          <Pressable
            onPress={async () => {
              if (!isDailyClaimed) {
                await doClaimDailyReward();
              }
            }}
            style={{ padding: 8, borderRadius: 99, backgroundColor: isDailyClaimed ? '#2E7D32' : colors.tertiaryContainer, shadowColor: isDailyClaimed ? 'rgba(46,125,50,0.4)' : colors.tertiaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
          >
            <Zap size={22} color={isDailyClaimed ? '#FFFFFF' : colors.onTertiary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1, marginBottom: 4 }}>DEVOCIONAL DIARIO</Text>
          <Text style={{ fontSize: 32, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Hola, {user?.name || 'Alma'}</Text>
        </View>

        <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 24, borderWidth: 2, borderColor: colors.surfaceVariant, shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.primary, lineHeight: 30, marginBottom: 8 }}>{todaysDev.title}</Text>
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, lineHeight: 22 }}>Descubre como la espera no es tiempo perdido, sino una etapa de crecimiento profundo.</Text>
            </View>
            <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 12, padding: 12, transform: [{ rotate: '12deg' }], shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 6 }}>
              <BookOpen size={32} color={colors.onPrimaryContainer} />
            </View>
          </View>
          <Pressable
            onPress={() => setSelected(todaysDev)}
            style={{ marginTop: 16, backgroundColor: colors.primaryContainer, borderRadius: 99, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 8 }}
          >
            <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onPrimaryContainer }}>Comenzar Lectura</Text>
            <ChevronRight size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        </View>

        <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.outlineVariant }}>
          <Search size={20} color={colors.outline} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Explora series devocionales..."
            placeholderTextColor={colors.outline}
            style={{ flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Devocionales</Text>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' }}>Ver todos</Text>
          </View>
          {filtered.map((dev, idx) => {
            const accent = seriesColor(dev.title, idx);
            return (
              <Pressable
                key={dev.id}
                onPress={() => setSelected(dev)}
                style={{ marginBottom: 16, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.surfaceVariant, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: accent + '30', alignItems: 'center', justifyContent: 'center', shadowColor: accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 0, elevation: 4 }}>
                    <BookOpen size={24} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{dev.title}</Text>
                    <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{dev.readTime} • {dev.theme}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.onSurfaceVariant} />
                </View>
                <View style={{ height: 8, backgroundColor: colors.surfaceHigh, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${((idx + 1) * 20) % 100}%`, height: '100%', backgroundColor: accent, borderRadius: 4 }} />
                </View>
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: colors.surfaceVariant }}>
              <BookOpen size={48} color={colors.outlineVariant} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 8 }}>No se encontraron devocionales</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
