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
const SCENE_CARD_WIDTH = 160;
const SCENE_CARD_HEIGHT = 100;

const SceneCard = ({
  scene = {
    id: '1',
    name: 'Late Night Chill',
    count: 24,
    coverUrl: 'https://picsum.photos/400/250',
    gradientColors: ['rgba(138,43,226,0.6)', 'rgba(20,10,40,0.9)'],
  },
  onPress,
  style,
}) => {
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const defaultGradientColors = scene.gradientColors || [
    'rgba(138,43,226,0.6)',
    'rgba(20,10,40,0.9)',
  ];

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.85}
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
    >
      {/* Background with Gradient Overlay */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.backgroundFallback, { backgroundColor: '#2a1f4e' }]} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sceneName} numberOfLines={2}>
          {scene.name}
        </Text>
        <View style={styles.countContainer}>
          <Text style={styles.countIcon}>🎵</Text>
          <Text style={styles.countText}>{scene.count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCENE_CARD_WIDTH,
    height: SCENE_CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  sceneName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  countText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});

export default SceneCard;
