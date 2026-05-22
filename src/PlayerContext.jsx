import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  // Playback state
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  
  // Track info
  currentTrack: null,
  trackQueue: [],
  queueIndex: -1,
  
  // Playback position
  position: 0,
  duration: 0,
  bufferedPosition: 0,
  
  // Repeat & shuffle
  repeatMode: 'off', // 'off' | 'track' | 'queue'
  shuffleEnabled: false,
  
  // Volume
  volume: 1.0,
  
  // Error state
  error: null,
};

// ============================================================================
// Action Types
// ============================================================================

const ActionTypes = {
  SET_TRACK: 'SET_TRACK',
  SET_QUEUE: 'SET_QUEUE',
  SET_QUEUE_INDEX: 'SET_QUEUE_INDEX',
  SET_PLAYING: 'SET_PLAYING',
  SET_LOADING: 'SET_LOADING',
  SET_BUFFERING: 'SET_BUFFERING',
  SET_POSITION: 'SET_POSITION',
  SET_DURATION: 'SET_DURATION',
  SET_BUFFERED: 'SET_BUFFERED',
  SET_REPEAT_MODE: 'SET_REPEAT_MODE',
  SET_SHUFFLE: 'SET_SHUFFLE',
  SET_VOLUME: 'SET_VOLUME',
  SET_ERROR: 'SET_ERROR',
  RESET_PLAYER: 'RESET_PLAYER',
};

// ============================================================================
// Reducer
// ============================================================================

function playerReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_TRACK:
      return {
        ...state,
        currentTrack: action.payload,
        error: null,
      };

    case ActionTypes.SET_QUEUE:
      return {
        ...state,
        trackQueue: action.payload,
      };

    case ActionTypes.SET_QUEUE_INDEX:
      return {
        ...state,
        queueIndex: action.payload,
      };

    case ActionTypes.SET_PLAYING:
      return {
        ...state,
        isPlaying: action.payload,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.SET_BUFFERING:
      return {
        ...state,
        isBuffering: action.payload,
      };

    case ActionTypes.SET_POSITION:
      return {
        ...state,
        position: action.payload,
      };

    case ActionTypes.SET_DURATION:
      return {
        ...state,
        duration: action.payload,
      };

    case ActionTypes.SET_BUFFERED:
      return {
        ...state,
        bufferedPosition: action.payload,
      };

    case ActionTypes.SET_REPEAT_MODE:
      return {
        ...state,
        repeatMode: action.payload,
      };

    case ActionTypes.SET_SHUFFLE:
      return {
        ...state,
        shuffleEnabled: action.payload,
      };

    case ActionTypes.SET_VOLUME:
      return {
        ...state,
        volume: action.payload,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isPlaying: false,
        isLoading: false,
      };

    case ActionTypes.RESET_PLAYER:
      return {
        ...initialState,
        volume: state.volume,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const PlayerContext = createContext(null);

// ============================================================================
// Provider Component
// ============================================================================

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const soundRef = useRef(null);
  const positionIntervalRef = useRef(null);

  // Initialize audio mode
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    }
    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Position tracking
  const startPositionTracking = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }
    positionIntervalRef.current = setInterval(async () => {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          dispatch({ type: ActionTypes.SET_POSITION, payload: status.positionMillis || 0 });
          dispatch({ type: ActionTypes.SET_BUFFERED, payload: status.playableDurationMillis || 0 });
        }
      }
    }, 500);
  }, []);

  const stopPositionTracking = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, []);

  // ============================================================================
  // Playback Controls
  // ============================================================================

  const loadAndPlayTrack = useCallback(async (track, audioUrl) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
      dispatch({ type: ActionTypes.SET_TRACK, payload: track });

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: state.volume },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      dispatch({ type: ActionTypes.SET_PLAYING, payload: true });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      startPositionTracking();
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.volume, startPositionTracking]);

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) {
      if (status.error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: status.error });
      }
      return;
    }

    dispatch({ type: ActionTypes.SET_DURATION, payload: status.durationMillis || 0 });
    dispatch({ type: ActionTypes.SET_BUFFERING, payload: status.isBuffering || false });
    dispatch({ type: ActionTypes.SET_PLAYING, payload: status.isPlaying || false });

    if (status.didJustFinish && !status.isLooping) {
      handleTrackEnd();
    }
  }, []);

  const handleTrackEnd = useCallback(() => {
    const { repeatMode, queueIndex, trackQueue } = state;

    if (repeatMode === 'track') {
      // Repeat current track
      soundRef.current?.setPositionAsync(0).then(() => {
        soundRef.current?.playAsync();
      });
    } else if (queueIndex < trackQueue.length - 1) {
      // Play next track
      playNext();
    } else if (repeatMode === 'queue') {
      // Loop back to first track
      playTrackAtIndex(0);
    } else {
      dispatch({ type: ActionTypes.SET_PLAYING, payload: false });
    }
  }, [state.repeatMode, state.queueIndex, state.trackQueue]);

  const play = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      startPositionTracking();
    }
  }, [startPositionTracking]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      stopPositionTracking();
    }
  }, [stopPositionTracking]);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  const seekTo = useCallback(async (positionMs) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMs);
      dispatch({ type: ActionTypes.SET_POSITION, payload: positionMs });
    }
  }, []);

  const setVolume = useCallback(async (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(clampedVolume);
    }
    dispatch({ type: ActionTypes.SET_VOLUME, payload: clampedVolume });
  }, []);

  // ============================================================================
  // Queue Management
  // ============================================================================

  const setQueue = useCallback((tracks, startIndex = 0) => {
    const queue = state.shuffleEnabled ? shuffleArray([...tracks]) : tracks;
    dispatch({ type: ActionTypes.SET_QUEUE, payload: queue });
    dispatch({ type: ActionTypes.SET_QUEUE_INDEX, payload: startIndex });
    return queue;
  }, [state.shuffleEnabled]);

  const playTrackAtIndex = useCallback(async (index) => {
    const { trackQueue } = state;
    if (index < 0 || index >= trackQueue.length) return;

    dispatch({ type: ActionTypes.SET_QUEUE_INDEX, payload: index });
    const track = trackQueue[index];
    
    if (track?.audio_url || track?.stream_url) {
      await loadAndPlayTrack(track, track.audio_url || track.stream_url);
    }
  }, [state.trackQueue, loadAndPlayTrack]);

  const playNext = useCallback(async () => {
    const nextIndex = state.queueIndex + 1;
    if (nextIndex < state.trackQueue.length) {
      await playTrackAtIndex(nextIndex);
    }
  }, [state.queueIndex, state.trackQueue.length, playTrackAtIndex]);

  const playPrevious = useCallback(async () => {
    // If more than 3 seconds in, restart current track
    if (state.position > 3000) {
      await seekTo(0);
      return;
    }

    const prevIndex = state.queueIndex - 1;
    if (prevIndex >= 0) {
      await playTrackAtIndex(prevIndex);
    }
  }, [state.position, state.queueIndex, playTrackAtIndex, seekTo]);

  // ============================================================================
  // Repeat & Shuffle
  // ============================================================================

  const cycleRepeatMode = useCallback(() => {
    const modes = ['off', 'queue', 'track'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    dispatch({ type: ActionTypes.SET_REPEAT_MODE, payload: nextMode });
  }, [state.repeatMode]);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: ActionTypes.SET_SHUFFLE, payload: !state.shuffleEnabled });
  }, [state.shuffleEnabled]);

  // ============================================================================
  // Utility
  // ============================================================================

  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const resetPlayer = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    stopPositionTracking();
    dispatch({ type: ActionTypes.RESET_PLAYER });
  }, [stopPositionTracking]);

  // ============================================================================
  // Value Object
  // ============================================================================

  const value = {
    // State
    ...state,
    
    // Playback controls
    play,
    pause,
    togglePlayPause,
    seekTo,
    setVolume,
    
    // Track & queue
    loadAndPlayTrack,
    playTrackAtIndex,
    playNext,
    playPrevious,
    setQueue,
    
    // Repeat & shuffle
    cycleRepeatMode,
    toggleShuffle,
    
    // Utility
    resetPlayer,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export default PlayerContext;
