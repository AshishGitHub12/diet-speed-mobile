import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal,
  ActivityIndicator, RefreshControl, Dimensions, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CONTENT_BASE = '/content/';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExploreVideo {
  id: number;
  title: string;
  subtitle: string;
  thumbnail_url: string;
  video_url: string;
  duration_minutes: number;
  category: string;
}

// Turns a YouTube/Vimeo watch URL into an embeddable player URL.
const toEmbedUrl = (url: string): string | null => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?playsinline=1&autoplay=1&rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
};

// YouTube's embed player rejects playback ("Error 153") when the WebView loads
// the iframe URL directly, because there's no real parent-page origin to check
// against. Wrapping it in a tiny HTML document with a real https baseUrl gives
// YouTube a legitimate referrer/origin, which fixes the error.
const buildPlayerHtml = (embedUrl: string) => `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <style>html,body{margin:0;padding:0;background:#000;height:100%;}
      iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}</style>
    </head>
    <body>
      <iframe
        src="${embedUrl}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </body>
  </html>
`;

const VideoPlayerModal = ({ video, onClose }: { video: ExploreVideo | null; onClose: () => void }) => {
  const insets = useSafeAreaInsets();
  // Same fix as the recipe detail modal: a Modal opens in its own window on
  // Android, so SafeAreaView's insets can come back as 0 inside it and the
  // header ends up drawn under the status bar. Pad manually with a reliable
  // Android fallback instead of relying on SafeAreaView here.
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || insets.top || 24) : insets.top;

  if (!video) return null;
  const embedUrl = toEmbedUrl(video.video_url);

  return (
    <Modal visible={!!video} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[playerStyles.safe, { paddingTop: topInset }]}>
        <View style={playerStyles.header}>
          <Text style={playerStyles.title} numberOfLines={1}>{video.title}</Text>
          <TouchableOpacity onPress={onClose} style={playerStyles.closeBtn}>
            <Text style={playerStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={playerStyles.playerWrap}>
          {embedUrl ? (
            <WebView
              key={embedUrl}
              source={{ html: buildPlayerHtml(embedUrl), baseUrl: 'https://www.youtube.com' }}
              style={playerStyles.webview}
              originWhitelist={['*']}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
            />
          ) : (
            <View style={playerStyles.fallback}>
              <Text style={playerStyles.fallbackText}>This video can't be embedded.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function ExploreWorkoutsScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId?: string }>();
  const [videos, setVideos] = useState<ExploreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<ExploreVideo | null>(null);
  const autoOpenedRef = React.useRef<string | null>(null);

  const fetchVideos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await api.get<ExploreVideo[]>(`${CONTENT_BASE}explore/`);
      setVideos(data);
      // Deep-linked from Home: open the tapped video's player automatically, once.
      if (videoId && autoOpenedRef.current !== videoId) {
        const match = data.find((v) => String(v.id) === String(videoId));
        if (match) { setPlayingVideo(match); autoOpenedRef.current = videoId; }
      }
    } catch (error) {
      console.log('❌ Explore fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [videoId]);

  useFocusEffect(useCallback(() => { fetchVideos(); }, [fetchVideos]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchVideos(true)} tintColor={Colors.primary} />}
        >
          {videos.map((v) => (
            <TouchableOpacity key={v.id} style={styles.card} activeOpacity={0.85} onPress={() => setPlayingVideo(v)}>
              <View style={styles.thumbWrap}>
                {!!v.thumbnail_url && <Image source={{ uri: v.thumbnail_url }} style={styles.thumb} />}
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>⏱ {v.duration_minutes} min</Text>
                </View>
                <View style={styles.playBtn}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.videoTitle}>{v.title}</Text>
                <Text style={styles.videoSubtitle}>↔ {v.subtitle || v.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {videos.length === 0 && <Text style={styles.emptyText}>No videos yet — check back soon!</Text>}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { padding: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  thumbWrap: { width: '100%', height: 180, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  thumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  durationBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 20, color: Colors.primary, marginLeft: 3 },
  cardBody: { padding: Spacing.md, gap: 4 },
  videoTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  videoSubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});

const playerStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  title: { flex: 1, color: Colors.white, fontSize: Fonts.sizes.md, fontWeight: '700', marginRight: Spacing.sm },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  closeText: { color: Colors.white, fontSize: 16 },
  playerWrap: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.5625, backgroundColor: '#000' }, // 16:9
  webview: { flex: 1, backgroundColor: '#000' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: Colors.white },
});