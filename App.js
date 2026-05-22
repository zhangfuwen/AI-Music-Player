import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PlayerProvider, usePlayer } from './src/PlayerContext';
import ExploreScreen from './src/screens/ExploreScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MiniPlayer from './src/components/MiniPlayer';
import ImmersivePlayer from './src/components/ImmersivePlayer';

const TAB_BAR_HEIGHT = 64;

const TAB_ICONS = {
  Explore: '🎵',
  Library: '❤️',
  Settings: '⚙️',
};

function TabBarIcon({ routeName, focused }) {
  return (
    <Text style={{ fontSize: 22 }}>
      {TAB_ICONS[routeName]}
    </Text>
  );
}

function AppNavigator() {
  const player = usePlayer();
  const [immersiveVisible, setImmersiveVisible] = useState(false);

  const hasTrack = !!player.currentTrack;
  const progress = player.duration > 0 ? player.position / player.duration : 0;

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0f0f1a',
              borderTopColor: '#1a1a2e',
              borderTopWidth: 1,
              height: TAB_BAR_HEIGHT,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              paddingTop: 8,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
            },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: '#666',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ focused }) => (
              <TabBarIcon routeName={route.name} focused={focused} />
            ),
          })}
        >
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="Library" component={LibraryScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>

        {/* Mini Player — sits above tab bar when track is loaded */}
        {hasTrack && (
          <View style={[styles.miniPlayerWrapper, { bottom: TAB_BAR_HEIGHT }]}>
            <MiniPlayer
              visible={true}
              track={{
                id: player.currentTrack?.id,
                name: player.currentTrack?.name || player.currentTrack?.title || '',
                artist: player.currentTrack?.artist || player.currentTrack?.category || 'FreeMusic',
                scene: player.currentTrack?.scene || '',
                coverUrl: player.currentTrack?.coverUrl || player.currentTrack?.cover_url || null,
                duration: player.duration,
                currentTime: player.position,
              }}
              isPlaying={player.isPlaying}
              isLiked={false}
              progress={progress}
              onPlayPause={() => player.togglePlayPause?.()}
              onExpand={() => setImmersiveVisible(true)}
            />
          </View>
        )}
      </NavigationContainer>

      {/* Immersive Full-Screen Player */}
      {immersiveVisible && hasTrack && (
        <ImmersivePlayer
          visible={true}
          track={{
            id: player.currentTrack?.id,
            name: player.currentTrack?.name || player.currentTrack?.title || '',
            artist: player.currentTrack?.artist || player.currentTrack?.category || 'FreeMusic',
            scene: player.currentTrack?.scene || '',
            coverUrl: player.currentTrack?.coverUrl || player.currentTrack?.cover_url || null,
            duration: player.duration,
            currentTime: player.position,
          }}
          isPlaying={player.isPlaying}
          isLiked={false}
          isFavorite={false}
          isDisliked={false}
          onPlayPause={() => player.togglePlayPause?.()}
          onNext={() => player.playNext?.()}
          onPrev={() => player.playPrevious?.()}
          onSeek={(pos) => player.seekTo?.(pos)}
          onLike={() => {}}
          onFavorite={() => {}}
          onDislike={() => {}}
          onSwipeUp={() => player.playNext?.()}
          onSwipeDown={() => player.playPrevious?.()}
          onClose={() => setImmersiveVisible(false)}
        />
      )}

      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <AppNavigator />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
