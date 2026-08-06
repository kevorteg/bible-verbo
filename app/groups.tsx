import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Users, Trophy, Plus, Target, LogOut, KeyRound, TrendingUp, CheckCircle2, Flag } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMyGroup, createOrJoinGroup, joinGroupByCode, leaveGroup, Group } from '../services/groupService';
import { getActiveChallenges, createChallenge, getChallengeLeaderboard, Challenge, ChallengeContribution, getCurrentChallengeUserName } from '../services/challengeService';

const green = '#2E7D32';
const gold = '#FFD700';
const silver = '#C0C0C0';
const bronze = '#CD7F32';

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, ChallengeContribution[]>>({});

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [targetChapters, setTargetChapters] = useState('100');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async () => {
    const g = await getMyGroup();
    setGroup(g);
    const active = await getActiveChallenges();
    setChallenges(active);
    const userName = await getCurrentChallengeUserName();
    const boards: Record<string, ChallengeContribution[]> = {};
    for (const c of active) {
      boards[c.id] = await getChallengeLeaderboard(c.id, userName);
    }
    setLeaderboards(boards);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    await createOrJoinGroup(groupName.trim(), groupDesc.trim());
    setGroupName('');
    setGroupDesc('');
    setShowCreateGroup(false);
    await loadData();
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    if (!user) {
      Alert.alert('Necesitas una cuenta', 'Inicia sesion para unirte a un grupo por codigo');
      return;
    }
    const joined = await joinGroupByCode(joinCode.trim());
    if (!joined) {
      Alert.alert('Codigo invalido', 'No se encontro ningun grupo con ese codigo');
      return;
    }
    setJoinCode('');
    setShowJoin(false);
    await loadData();
  };

  const handleLeave = () => {
    Alert.alert('Salir del grupo', 'Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await leaveGroup(); setGroup(null); setChallenges([]); } },
    ]);
  };

  const handleCreateChallenge = async () => {
    if (!challengeTitle.trim() || !targetChapters) return;
    const parsedTarget = parseInt(targetChapters);
    if (isNaN(parsedTarget) || parsedTarget < 1) return;
    const endStr = endDate.trim() || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    await createChallenge({
      title: challengeTitle.trim(),
      description: challengeDesc.trim(),
      targetChapters: parsedTarget,
      endDate: endStr,
    });
    setChallengeTitle('');
    setChallengeDesc('');
    setTargetChapters('100');
    setEndDate('');
    setShowCreateChallenge(false);
    await loadData();
  };

  const progressPercent = (c: Challenge) =>
    c.targetChapters > 0 ? Math.min((c.currentChapters / c.targetChapters) * 100, 100) : 0;

  const daysLeft = (c: Challenge) => {
    const end = new Date(c.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const podium = (i: number) => [gold, silver, bronze][i];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Grupos y Retos</Text>
        </View>
        {group && (
          <Pressable onPress={handleLeave} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {!group ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Users size={80} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>No tienes grupo aun</Text>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 20 }}>
              Crea tu grupo o unete por codigo para participar en retos de lectura
            </Text>
            <Pressable
              onPress={() => setShowCreateGroup(true)}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear grupo</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowJoin(true)}
              style={{ borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1.5, borderColor: colors.primary }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary }}>Unirme por codigo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{group.name}</Text>
              {group.description ? <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 4 }}>{group.description}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <Pressable onPress={() => { Alert.alert('Codigo del grupo', `Comparte este codigo para invitar:\n\n${group.code}`); }} style={{ backgroundColor: colors.surfaceHigh, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Codigo: {group.code}</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Users size={14} color={colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{group.members.length} miembros</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }}>Retos activos</Text>
              <Pressable
                onPress={() => setShowCreateChallenge(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4 }}
              >
                <Plus size={16} color={colors.onPrimary} />
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Nuevo reto</Text>
              </Pressable>
            </View>

            {challenges.length === 0 ? (
              <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                <Flag size={48} color={colors.onSurfaceVariant} />
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 12 }}>
                  No hay retos activos. Crea uno para motivar a tu grupo!
                </Text>
              </View>
            ) : (
              challenges.map(c => {
                const board = leaderboards[c.id] || [];
                return (
                  <View key={c.id} style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8, borderLeftWidth: 4, borderLeftColor: progressPercent(c) >= 100 ? green : colors.tertiary }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{c.title}</Text>
                        {c.description ? (
                          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 4 }}>{c.description}</Text>
                        ) : null}
                      </View>
                      {progressPercent(c) >= 100 && (
                        <View style={{ backgroundColor: green, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: '#FFFFFF' }}>COMPLETADO</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ height: 12, backgroundColor: colors.surfaceHigh, borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ width: `${progressPercent(c)}%`, height: '100%', backgroundColor: progressPercent(c) >= 100 ? green : colors.tertiary, borderRadius: 6 }} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.tertiary }}>{c.currentChapters}/{c.targetChapters} capitulos</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{progressPercent(c).toFixed(0)}%</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <TrendingUp size={14} color={colors.onSurfaceVariant} />
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{daysLeft(c)} dias restantes</Text>
                    </View>

                    {board.length > 0 && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Top lectores</Text>
                        {board.slice(0, 3).map((entry, i) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i < 3 ? podium(i) + '30' : colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', color: i < 3 ? podium(i) : colors.onSurfaceVariant }}>{i + 1}</Text>
                            </View>
                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: entry.isMe ? colors.primary : colors.tertiary, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>
                                {entry.userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>
                              {entry.isMe ? 'Tu' : entry.userName}
                            </Text>
                            <Text style={{ fontSize: 14, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{entry.chapters}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showCreateGroup} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Nuevo grupo</Text>
              <Pressable onPress={() => setShowCreateGroup(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Nombre del grupo</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ej: Jovenes IPUC"
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Descripcion (opcional)</Text>
            <TextInput
              value={groupDesc}
              onChangeText={setGroupDesc}
              placeholder="Describe tu grupo..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 24, minHeight: 60 }}
            />

            <Pressable
              onPress={handleCreateGroup}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear grupo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showJoin} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Unirse por codigo</Text>
              <Pressable onPress={() => setShowJoin(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <KeyRound size={18} color={colors.onSurfaceVariant} />
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="VERBO-XXXXX"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="characters"
                style={{ flex: 1, fontSize: 16, fontFamily: 'SpaceGrotesk', color: colors.onSurface }}
              />
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginBottom: 24 }}>
              Pide el codigo al lider de tu grupo e ingresalo aqui.
            </Text>

            <Pressable
              onPress={handleJoin}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Unirme</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showCreateChallenge} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Nuevo reto</Text>
              <Pressable onPress={() => setShowCreateChallenge(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Titulo</Text>
            <TextInput
              value={challengeTitle}
              onChangeText={setChallengeTitle}
              placeholder="Ej: Leer los Salmos en 30 dias"
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Descripcion (opcional)</Text>
            <TextInput
              value={challengeDesc}
              onChangeText={setChallengeDesc}
              placeholder="Describe el reto..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16, minHeight: 60 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Capitulos objetivo</Text>
            <TextInput
              value={targetChapters}
              onChangeText={setTargetChapters}
              placeholder="100"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="number-pad"
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Fecha limite (YYYY-MM-DD, opcional)</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 24 }}
            />

            <Pressable
              onPress={handleCreateChallenge}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear reto</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
