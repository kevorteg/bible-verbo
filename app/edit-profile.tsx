import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { biblicalAvatars, AvatarOption } from '../services/avatarData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_KEY = 'verbo_avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('david');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then(saved => {
      if (saved) setSelectedAvatar(saved);
    });
    AsyncStorage.getItem('verbo_description').then(saved => {
      if (saved) setDescription(saved);
    });
  }, []);

  const { updateProfile } = useAuth();

  const handleSave = async () => {
    setSaving(true);
    await AsyncStorage.setItem(AVATAR_KEY, selectedAvatar);
    await AsyncStorage.setItem('verbo_description', description);
    await AsyncStorage.setItem('verbo_name', name);
    await updateProfile({ name, avatar: selectedAvatar });
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 300);
  };

  const currentAvatar = biblicalAvatars.find(a => a.id === selectedAvatar);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Editar Perfil</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
        >
          {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Save size={20} color={colors.onPrimary} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {currentAvatar && (
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: currentAvatar.color, alignItems: 'center', justifyContent: 'center', shadowColor: currentAvatar.color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 10, borderWidth: 4, borderColor: colors.surfaceLowest }}>
              <Text style={{ fontSize: 36, fontFamily: 'BricolageGrotesque', color: '#FFFFFF' }}>{currentAvatar.icon}</Text>
            </View>
            <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 12 }}>{currentAvatar.name}</Text>
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{currentAvatar.description}</Text>
          </View>
        )}

        <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={colors.onSurfaceVariant}
          style={{ backgroundColor: colors.surfaceLowest, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 20, shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
        />

        <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Descripcion</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Una breve descripcion..."
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
          numberOfLines={3}
          style={{ backgroundColor: colors.surfaceLowest, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 24, minHeight: 80, shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
        />

        <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Avatar - Personajes Biblicos</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {biblicalAvatars.map((av) => (
            <Pressable
              key={av.id}
              onPress={() => setSelectedAvatar(av.id)}
              style={{ alignItems: 'center', width: '30%', padding: 8, borderRadius: 16, backgroundColor: selectedAvatar === av.id ? av.color + '22' : 'transparent' }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: av.color, alignItems: 'center', justifyContent: 'center', borderWidth: selectedAvatar === av.id ? 3 : 0, borderColor: av.color, shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: '#FFFFFF' }}>{av.icon}</Text>
              </View>
              <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.onSurface, marginTop: 4, textAlign: 'center' }}>{av.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
