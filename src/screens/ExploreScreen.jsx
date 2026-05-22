import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { TrackApi } from '../api';
import { usePlayer } from '../PlayerContext';
import SceneCard from '../components/SceneCard';
import TrackCard from '../components/TrackCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCENE_CARD_WIDTH = 160;
const PAGINATION_LIMIT = 20;

// Scene categories for the horizontal scroll
const SCENE_CATEGORIES = [
  { id: '1', name: 'Late Night Chill', count: 24, gradientColors: ['rgba(138,43,226,0.6)', 'rgba(20,10,40,0.9)'] },
  { id: '2', name: 'Morning Energy', count: 18, gradientColors: ['rgba(255,165,0,0.6)', 'rgba(40,20,10,0.9)'] },
  { id: '3', name: 'Focus Flow', count: 32, gradientColors: ['rgba(0,128,255,0.6)', 'rgba(10,20,40,0.9)'] },
  { id: '4', name: 'Workout Mode', count: 28, gradientColors: ['rgba(255,0,0,0.6)', 'rgba(40,10,10,0.9)'] },
  { id: '5', name: 'Rainy Day', count: 21, gradientColors: ['rgba(100,100,150,0.6)', 'rgba(20,20,40,0.9)'] },
  { id: '6', name: 'Sunday Brunch', count: 15, gradientColors: ['rgba(255,200,100,0.6)', 'rgba(50,40,20,0.9)'] },
  { id: '7', name: 'Deep Focus', count: 36, gradientColors: ['rgba(0,200,150,0.6)', 'rgba(10,40,30,0.9)'] },
  { id: '8', name: 'Evening Wind Down', count: 19, gradientColors: ['rgba(200,100,150,0.6)', 'rgba(40,20,30,0.9)'] },
];

const ExploreScreen = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [likedTracks, setLikedTracks] = useState({});
  const [favoriteTracks, setFavoriteTracks] = useState({});

  // Refs
  const offsetRef = useRef(0);
  const flatListRef = useRef(null);

  // Player context
  const { currentTrack, isPlaying, playTrackAtIndex, trackQueue, setQueue, togglePlayPause } = usePlayer();

  // Fetch tracks from API
  const fetchTracks = useCallback(async (offset = 0, reset = false) => {
    try {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await TrackApi.getRecommendations({
        offset,
        limit: PAGINATION_LIMIT,
      });

      const newTracks = response.tracks || response.data || [];

      if (reset) {
        setTracks(newTracks);
        offsetRef.current = newTracks.length;
      } else {
        setTracks(prev => [...prev, ...newTracks]);
        offsetRef.current += newTracks.length;
      }

      // Check if there are more tracks to load
      setHasMoreData(newTracks.length === PAGINATION_LIMIT);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      setError(err.message || 'Failed to load tracks');
      // Use mock data as fallback for demo
      if (offset === 0) {
        const mockTracks = generateMockTracks(PAGINATION_LIMIT);
        setTracks(mockTracks);
        offsetRef.current = mockTracks.length;
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, []);

  // Generate mock tracks for demo/fallback
  const generateMockTracks = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-${Date.now()}-${i}`,
      name: `Track ${i + 1}`,
      artist: `Artist ${i + 1}`,
      scene: SCENE_CATEGORIES[i % SCENE_CATEGORIES.length]?.name || 'Chill',
      duration: 180 + Math.floor(Math.random() * 120),
      coverUrl: `https://picsum.photos/200?t=${Date.now() + i}`,
    }));
  };

  // Initial load
  useEffect(() => {
    fetchTracks(0, true);
  }, [fetchTracks]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    offsetRef.current = 0;
    fetchTracks(0, true);
  }, [fetchTracks]);

  // Load more (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreData && !isLoading) {
      fetchTracks(offsetRef.current, false);
    }
  }, [isLoadingMore, hasMoreData, isLoading, fetchTracks]);

  // Handle scene selection
  const handleScenePress = useCallback((scene) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedScene(scene.id === selectedScene?.id ? null : scene);
  }, [selectedScene]);

  // Handle track press - play track
  const handleTrackPress = useCallback((track, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Set the queue and play the selected track
    const tracksToPlay = tracks;
    setQueue(tracksToPlay, index);
  }, [tracks, setQueue]);

  // Handle like toggle
  const handleLike = useCallback((trackId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  }, []);

  // Handle favorite toggle
  const handleFavorite = useCallback((trackId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavoriteTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  }, []);

  // Filter tracks based on search query
  const filteredTracks = tracks.filter(track => {
    const query = searchQuery.toLowerCase();
    return (
      track.name?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.scene?.toLowerCase().includes(query)
    );
  });

  // Render scene card
  const renderSceneCard = useCallback(({ item }) => (
    <View style={styles.sceneCardWrapper}>
      <SceneCard
        scene={item}
        onPress={() => handleScenePress(item)}
        style={[
          styles.sceneCard,
          selectedScene?.id === item.id && styles.sceneCardSelected
        ]}
      />
    </View>
  ), [selectedScene, handleScenePress]);

  // Render track card
  const renderTrackCard = useCallback(({ item, index }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    return (
      <TrackCard
        track={item}
        isLiked={likedTracks[item.id]}
        isFavorite={favoriteTracks[item.id]}
        onPress={() => handleTrackPress(item, index)}
        onLike={() => handleLike(item.id)}
        onFavorite={() => handleFavorite(item.id)}
        isPlaying={isCurrentTrack && isPlaying}
      />
    );
  }, [currentTrack, isPlaying, likedTracks, favoriteTracks, handleTrackPress, handleLike, handleFavorite]);

  // Render footer loader
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#e63946" />
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>🎵</Text>
        <Text style={styles.emptyStateTitle}>No tracks found</Text>
        <Text style={styles.emptyStateSubtitle}>
          {searchQuery ? 'Try a different search term' : 'Pull to refresh and load tracks'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a14" />
      
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks, artists, scenes..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Scene Categories - Horizontal Scroll */}
        <View style={styles.sceneSection}>
          <Text style={styles.sectionTitle}>Browse by Mood</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneScrollContent}
          >
            {SCENE_CATEGORIES.map(scene => (
              <View key={scene.id} style={styles.sceneCardWrapper}>
                <SceneCard
                  scene={scene}
                  onPress={() => handleScenePress(scene)}
                  style={[
                    styles.sceneCard,
                    selectedScene?.id === scene.id && styles.sceneCardSelected
                  ]}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Tracks Feed - Vertical FlatList */}
        <View style={styles.tracksSection}>
          <View style={styles.tracksHeader}>
            <Text style={styles.sectionTitle}>
              {selectedScene ? `${selectedScene.name} Tracks` : 'Recommended For You'}
            </Text>
            <Text style={styles.trackCount}>
              {filteredTracks.length} tracks
            </Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchTracks(0, true)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={filteredTracks}
            renderItem={renderTrackCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tracksList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#e63946"
                colors={['#e63946']}
                progressBackgroundColor="rgba(230,57,70,0.2)"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>
      </View>

      {/* Loading Overlay for Initial Load */}
      {isLoading && tracks.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.loadingText}>Loading tracks...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  searchIconContainer: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#fff',
    paddingRight: 8,
  },
  clearButton: {
    padding: 12,
    marginRight: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  content: {
    flex: 1,
  },
  sceneSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sceneScrollContent: {
    paddingHorizontal: 12,
  },
  sceneCardWrapper: {
    marginHorizontal: 4,
  },
  sceneCard: {
    opacity: 1,
  },
  sceneCardSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#e63946',
  },
  tracksSection: {
    flex: 1,
  },
  tracksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  trackCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  tracksList: {
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(230,57,70,0.15)',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.3)',
  },
  errorText: {
    fontSize: 13,
    color: '#e63946',
    flex: 1,
  },
  retryText: {
    fontSize: 13,
    color: '#e63946',
    fontWeight: '600',
    marginLeft: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,20,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default ExploreScreen;
