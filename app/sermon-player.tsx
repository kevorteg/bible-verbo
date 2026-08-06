import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ExternalLink, Calendar, User, Clock, Eye } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../contexts/ThemeContext';
import { getEmbedUrl, getWatchUrl, getThumbnail } from '../services/sermonDataService';
import { useEffect, useState } from 'react';
import { Sermon } from '../services/sermonDataService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_HEIGHT = (SCREEN_WIDTH * 9) / 16;

export default function SermonPlayerScreen() {
  const router = useRouter();
  const { sermon: sermonJson } = useLocalSearchParams<{ sermon: string }>();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sermon, setSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    if (!sermonJson) {
      router.back();
      return;
    }
    try {
      const parsed: Sermon = JSON.parse(sermonJson);
      setSermon(parsed);
    } catch {
      router.back();
    }
  }, [sermonJson]);

  if (!sermon) return null;

  const embedUrl = getEmbedUrl(sermon);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: 'BricolageGrotesque',
            fontSize: 18,
            color: colors.onSurface,
          }}
        >
          {sermon.title}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{
          width: SCREEN_WIDTH,
          height: PLAYER_HEIGHT,
          backgroundColor: '#000',
        }}>
          {loading && (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              zIndex: 10,
            }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setLoading(false)}
          />
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{
            fontFamily: 'BricolageGrotesque',
            fontSize: 22,
            color: colors.onSurface,
            marginBottom: 4,
          }}>
            {sermon.title}
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <User size={14} color={colors.onSurfaceVariant} />
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: colors.onSurfaceVariant,
              }}>
                {sermon.preacher}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={14} color={colors.onSurfaceVariant} />
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: colors.onSurfaceVariant,
              }}>
                {new Date(sermon.date).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={14} color={colors.onSurfaceVariant} />
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: colors.onSurfaceVariant,
              }}>
                {sermon.duration}
              </Text>
            </View>
            {sermon.views && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Eye size={14} color={colors.onSurfaceVariant} />
                <Text style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                }}>
                  {sermon.views.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {sermon.verse && (
            <View style={{
              backgroundColor: `${colors.primary}12`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}>
              <Text style={{
                fontFamily: 'SpaceGrotesk',
                fontSize: 13,
                color: colors.primary,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Versiculos Clave
              </Text>
              <Text style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 14,
                color: colors.onSurface,
                lineHeight: 20,
              }}>
                {sermon.verse}
              </Text>
            </View>
          )}

          <Text style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 15,
            color: colors.onSurfaceVariant,
            lineHeight: 24,
            marginBottom: 24,
          }}>
            {sermon.description}
          </Text>

          <Pressable
            onPress={() => router.navigate(getWatchUrl(sermon))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#FF0000',
              borderRadius: 12,
              paddingVertical: 14,
            }}
          >
            <ExternalLink size={18} color="#FFF" />
            <Text style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 15,
              fontWeight: '700',
              color: '#FFF',
            }}>
              Abrir en YouTube
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
