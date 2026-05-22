import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VINYL_SIZE = 280;
const SWIPE_THRESHOLD = 60;

const ImmersivePlayer = ({
  visible = true,
  track = {
    id: '1',
    name: 'Midnight Dreams',
    artist: 'Luna Waves',
    scene: 'Late Night Chill',
    coverUrl: 'https://picsum.photos/800',
    duration: 240,
    currentTime: 75,
  },
  isPlaying = false,
  isLiked = false,
  isFavorite = false,
  isDisliked = false,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onLike,
  onFavorite,
  onDislike,
  onSwipeUp,
  onSwipeDown,
  onClose,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef(null);
  const panY = useRef(new Animated.Value(0)).current;

  // Start/stop vinyl spin based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      spinRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      spinRef.current.start();
    } else {
      if (spinRef.current) {
        spinRef.current.stop();
      }
    }
    return () => {
      if (spinRef.current) {
        spinRef.current.stop();
      }
    };
  }, [isPlaying]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Haptic feedback helper
  const triggerHaptic = useCallback((type = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(type);
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeUp?.();
        } else if (gestureState.dy > SWIPE_THRESHOLD) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeDown?.();
        }
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleSeek = useCallback((locationX) => {
    const progressBarWidth = SCREEN_WIDTH - 48;
    const progress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    onSeek?.(progress * track.duration);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  }, [track.duration, onSeek, triggerHaptic]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = track.duration > 0 ? track.currentTime / track.duration : 0;

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: panY }] }]}
      {...panResponder.panHandlers}
    >
      {/* Background: Blur cover + dark overlay */}
      <View style={styles.backgroundContainer}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.coverContainer}>
            {/* Use a colored view as fallback since we don't have actual image loading */}
            <View style={[styles.coverFallback, { backgroundColor: '#2a1f4e' }]} />
          </View>
        </BlurView>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.sceneText}>{track.scene}</Text>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.artistText}>{track.artist}</Text>
        </View>

        {/* Vinyl Record */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onPlayPause?.();
          }}
        >
          <Animated.View
            style={[
              styles.vinylContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            {/* Vinyl disc */}
            <View style={styles.vinyl}>
              {/* Grooves */}
              <View style={styles.vinylGroove} />
              <View style={[styles.vinylGroove, styles.vinylGroove2]} />
              <View style={[styles.vinylGroove, styles.vinylGroove3]} />

              {/* Center label */}
              <View style={styles.vinylCenter}>
                <View style={styles.vinylHole} />
                <View style={styles.vinylLabel}>
                  <Text style={styles.vinylLabelText}>♪</Text>
                </View>
              </View>
            </View>

            {/* Tonearm */}
            <View style={styles.tonearmContainer}>
              <View style={styles.tonearm} />
              <View style={styles.tonearmBase} />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Progress Bar */}
        <Pressable
          style={styles.progressContainer}
          onPress={(e) => handleSeek(e.nativeEvent.locationX)}
        >
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(track.currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(track.duration)}</Text>
          </View>
        </Pressable>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              onPrev?.();
            }}
          >
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
              onPlayPause?.();
            }}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              onNext?.();
            }}
          >
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Interaction Buttons */}
        <View style={styles.interactionControls}>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              onDislike?.();
            }}
          >
            <Text style={[styles.interactionIcon, isDisliked && styles.disliked]}>
              👎
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              onLike?.();
            }}
          >
            <Text style={[styles.interactionIcon, isLiked && styles.liked]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              onFavorite?.();
            }}
          >
            <Text style={[styles.interactionIcon, isFavorite && styles.favorited]}>
              {isFavorite ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Close hint */}
        <Text style={styles.swipeHint}>↑↓ Swipe to change track</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  coverContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sceneText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  trackName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  vinylContainer: {
    width: VINYL_SIZE,
    height: VINYL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  vinyl: {
    width: VINYL_SIZE,
    height: VINYL_SIZE,
    borderRadius: VINYL_SIZE / 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 3,
    borderColor: '#333',
  },
  vinylGroove: {
    position: 'absolute',
    width: VINYL_SIZE - 40,
    height: VINYL_SIZE - 40,
    borderRadius: (VINYL_SIZE - 40) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vinylGroove2: {
    width: VINYL_SIZE - 80,
    height: VINYL_SIZE - 80,
    borderRadius: (VINYL_SIZE - 80) / 2,
  },
  vinylGroove3: {
    width: VINYL_SIZE - 120,
    height: VINYL_SIZE - 120,
    borderRadius: (VINYL_SIZE - 120) / 2,
  },
  vinylCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  vinylHole: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  vinylLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylLabelText: {
    fontSize: 32,
    color: '#fff',
  },
  tonearmContainer: {
    position: 'absolute',
    top: 20,
    right: 10,
    transform: [{ rotate: '25deg' }],
  },
  tonearm: {
    width: 100,
    height: 4,
    backgroundColor: '#c0c0c0',
    borderRadius: 2,
    transformOrigin: 'right center',
  },
  tonearmBase: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#a0a0a0',
  },
  progressContainer: {
    width: SCREEN_WIDTH - 48,
    marginBottom: 24,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e63946',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e63946',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    fontSize: 28,
    color: '#fff',
    marginLeft: 2,
  },
  interactionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
  },
  interactionButton: {
    padding: 8,
  },
  interactionIcon: {
    fontSize: 28,
  },
  liked: {
    color: '#e63946',
  },
  favorited: {
    color: '#ffd700',
  },
  disliked: {
    opacity: 0.5,
  },
  swipeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
});

export default ImmersivePlayer;
