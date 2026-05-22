import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 64;

const MiniPlayer = ({
  visible = true,
  track = {
    id: '1',
    name: 'Midnight Dreams',
    artist: 'Luna Waves',
    scene: 'Late Night Chill',
    coverUrl: 'https://picsum.photos/200',
    duration: 240,
    currentTime: 75,
  },
  isPlaying = false,
  isLiked = false,
  progress = 0,
  onPlayPause,
  onExpand,
  onPress,
}) => {
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(30,20,50,0.95)', 'rgba(20,15,35,0.98)']}
        style={styles.gradient}
      >
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${progress * 100}%` }]}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Cover Art */}
          <View style={styles.coverContainer}>
            <View style={[styles.coverFallback, { backgroundColor: '#2a1f4e' }]}>
              <Text style={styles.coverIcon}>♪</Text>
            </View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>
              {track.name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={(e) => {
              e.stopPropagation?.();
              triggerHaptic();
              onPlayPause?.();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* Expand Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={(e) => {
              e.stopPropagation?.();
              triggerHaptic();
              onExpand?.();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.expandIcon}>⬆</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e63946',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  coverContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  playIcon: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 1,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#fff',
  },
});

export default MiniPlayer;
