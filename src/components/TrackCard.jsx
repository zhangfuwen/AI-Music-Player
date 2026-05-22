import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const TRACK_CARD_HEIGHT = 72;

const TrackCard = ({
  track = {
    id: '1',
    name: 'Midnight Dreams',
    artist: 'Luna Waves',
    scene: 'Late Night Chill',
    coverUrl: 'https://picsum.photos/200',
    duration: 240,
    currentTime: 75,
  },
  isLiked = false,
  isFavorite = false,
  onPress,
  onPlayPause,
  onLike,
  onFavorite,
}) => {
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
    >
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
        <View style={styles.metaRow}>
          <View style={styles.sceneTag}>
            <Text style={styles.sceneTagText}>{track.scene}</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        </View>
      </View>

      {/* Action Icons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation?.();
            triggerHaptic();
            onLike?.();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, isLiked && styles.liked]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation?.();
            triggerHaptic();
            onFavorite?.();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, isFavorite && styles.favorited]}>
            {isFavorite ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TRACK_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(20,15,35,0.8)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  coverContainer: {
    width: 48,
    height: 48,
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
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sceneTag: {
    backgroundColor: 'rgba(230,57,70,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  sceneTagText: {
    fontSize: 10,
    color: '#e63946',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  duration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  liked: {
    color: '#e63946',
  },
  favorited: {
    color: '#ffd700',
  },
});

export default TrackCard;
