import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrackCard from '../components/TrackCard';
import { usePlayer } from '../PlayerContext';
import { PlaylistApi, ActionsApi } from '../api';

const TABS = [
  { key: 'liked', label: 'Liked' },
  { key: 'favorites', label: 'Favorites' },
];

const EmptyState = ({ message, icon }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

const LibraryScreen = () => {
  const [activeTab, setActiveTab] = useState('liked');
  const [likedTracks, setLikedTracks] = useState([]);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const {
    currentTrack,
    isPlaying,
    trackQueue,
    setQueue,
    playTrackAtIndex,
    togglePlayPause,
  } = usePlayer();

  const fetchLikedTracks = useCallback(async () => {
    try {
      setError(null);
      const data = await PlaylistApi.getLiked();
      // Handle both { tracks: [] } and [] response formats
      setLikedTracks(data.tracks || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load liked tracks');
      console.error('Error fetching liked tracks:', err);
    }
  }, []);

  const fetchFavoriteTracks = useCallback(async () => {
    try {
      setError(null);
      const data = await PlaylistApi.getFavorites();
      // Handle both { tracks: [] } and [] response formats
      setFavoriteTracks(data.tracks || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load favorite tracks');
      console.error('Error fetching favorite tracks:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchLikedTracks(), fetchFavoriteTracks()]);
    setIsLoading(false);
  }, [fetchLikedTracks, fetchFavoriteTracks]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchLikedTracks(), fetchFavoriteTracks()]);
    setIsRefreshing(false);
  }, [fetchLikedTracks, fetchFavoriteTracks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentTracks = activeTab === 'liked' ? likedTracks : favoriteTracks;

  const handleTrackPress = useCallback(
    (track, index) => {
      const tracksWithSource = currentTracks.map((t) => ({
        ...t,
        isLiked: t.is_liked ?? t.isLiked ?? likedTracks.some((lt) => lt.id === t.id),
        isFavorite: t.is_favorite ?? t.isFavorite ?? favoriteTracks.some((ft) => ft.id === t.id),
      }));
      setQueue(tracksWithSource, index);
      playTrackAtIndex(index);
    },
    [currentTracks, likedTracks, favoriteTracks, setQueue, playTrackAtIndex]
  );

  const handlePlayPause = useCallback(
    (track) => {
      if (currentTrack?.id === track.id) {
        togglePlayPause();
      } else {
        const index = currentTracks.findIndex((t) => t.id === track.id);
        if (index !== -1) {
          handleTrackPress(track, index);
        }
      }
    },
    [currentTrack, currentTracks, handleTrackPress, togglePlayPause]
  );

  const handleLike = useCallback(async (track) => {
    try {
      const action = track.is_liked || track.isLiked ? 'unlike' : 'like';
      await ActionsApi.performAction(track.id, action);

      // Update local state optimistically
      setLikedTracks((prev) => {
        if (action === 'like') {
          const exists = prev.some((t) => t.id === track.id);
          if (exists) return prev;
          return [...prev, { ...track, is_liked: true, isLiked: true }];
        } else {
          return prev.filter((t) => t.id !== track.id);
        }
      });

      // Also update favorites if applicable
      if (track.is_favorite || track.isFavorite) {
        setFavoriteTracks((prev) =>
          prev.map((t) =>
            t.id === track.id ? { ...t, is_liked: action === 'like', isLiked: action === 'like' } : t
          )
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, []);

  const handleFavorite = useCallback(async (track) => {
    try {
      // Note: The API may not have a separate favorite action
      // This assumes the action API handles favorites or we need to use a different endpoint
      const isFav = track.is_favorite || track.isFavorite;
      
      // Optimistically update local state
      setFavoriteTracks((prev) => {
        if (isFav) {
          return prev.filter((t) => t.id !== track.id);
        } else {
          const exists = prev.some((t) => t.id === track.id);
          if (exists) return prev;
          return [...prev, { ...track, is_favorite: true, isFavorite: true }];
        }
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, []);

  const renderTrack = useCallback(
    ({ item, index }) => {
      const isCurrentTrack = currentTrack?.id === item.id;
      const isCurrentlyPlaying = isCurrentTrack && isPlaying;

      return (
        <TrackCard
          track={item}
          isLiked={item.is_liked || item.isLiked}
          isFavorite={item.is_favorite || item.isFavorite}
          onPress={() => handleTrackPress(item, index)}
          onPlayPause={() => handlePlayPause(item)}
          onLike={() => handleLike(item)}
          onFavorite={() => handleFavorite(item)}
        />
      );
    },
    [currentTrack, isPlaying, handleTrackPress, handlePlayPause, handleLike, handleFavorite]
  );

  const renderTab = (tab) => {
    const isActive = activeTab === tab.key;
    const count = tab.key === 'liked' ? likedTracks.length : favoriteTracks.length;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tab, isActive && styles.tabActive]}
        onPress={() => setActiveTab(tab.key)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {tab.label}
        </Text>
        {count > 0 && (
          <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'liked') {
      return (
        <EmptyState
          icon="❤️"
          message="No liked tracks yet.\nTap the heart on any track to add it here."
        />
      );
    }
    return (
      <EmptyState
        icon="⭐"
        message="No favorite tracks yet.\nTap the star on any track to add it here."
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
        </View>
        <View style={styles.tabsContainer}>{TABS.map(renderTab)}</View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.loadingText}>Loading your library...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(renderTab)}
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Track List */}
      <FlatList
        data={currentTracks}
        renderItem={renderTrack}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          currentTracks.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#e63946"
            colors={['#e63946']}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10,8,20,1)',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#e63946',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  errorBanner: {
    backgroundColor: 'rgba(230,57,70,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#e63946',
    flex: 1,
  },
  errorRetry: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LibraryScreen;
