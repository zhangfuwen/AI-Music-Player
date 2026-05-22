import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://freemusic.top';
const TOKEN_KEY = 'auth_token';
const SESSION_KEY = 'session_id';

// ============================================================================
// Token Storage
// ============================================================================

export const TokenStorage = {
  async save(token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async get() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async remove() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// ============================================================================
// Session Storage (AsyncStorage for non-sensitive data)
// ============================================================================

export const SessionStorage = {
  async save(sessionId) {
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
  },

  async get() {
    return await AsyncStorage.getItem(SESSION_KEY);
  },

  async remove() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};

// ============================================================================
// Internal Fetch Wrapper
// ============================================================================

async function fetchWithAuth(url, options = {}) {
  const token = await TokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(error.message || 'Request failed', response.status);
  }

  return response.json();
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ============================================================================
// Auth API
// ============================================================================

export const AuthApi = {
  /**
   * Verify authentication with Google credential or similar
   * @param {string} credential - The auth credential token
   */
  async verify(credential) {
    const data = await fetchWithAuth(`${BASE_URL}/api/auth/verify`, {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    if (data.token) {
      await TokenStorage.save(data.token);
    }

    return data;
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return await fetchWithAuth(`${BASE_URL}/api/user/profile`);
  },
};

// ============================================================================
// Track API
// ============================================================================

export const TrackApi = {
  /**
   * Get track details by ID
   * @param {string|number} trackId
   */
  async getById(trackId) {
    return await fetchWithAuth(`${BASE_URL}/api/tracks/${trackId}`);
  },

  /**
   * Get personalized recommendations feed
   * @param {Object} params - Query parameters
   * @param {number} params.offset - Pagination offset
   * @param {number} params.limit - Number of results
   * @param {string} [params.session_id] - Session ID for tracking
   */
  async getRecommendations({ offset = 0, limit = 20, session_id } = {}) {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });

    if (session_id) {
      params.append('session_id', session_id);
    }

    return await fetchWithAuth(`${BASE_URL}/api/recommendations/feed?${params}`);
  },
};

// ============================================================================
// Playlist API
// ============================================================================

export const PlaylistApi = {
  /**
   * Get liked tracks playlist
   */
  async getLiked() {
    return await fetchWithAuth(`${BASE_URL}/api/playlists/liked`);
  },

  /**
   * Get favorite tracks playlist
   */
  async getFavorites() {
    return await fetchWithAuth(`${BASE_URL}/api/playlists/favorites`);
  },
};

// ============================================================================
// Actions API
// ============================================================================

export const ActionsApi = {
  /**
   * Perform an action on a track (e.g., like, unlike, play, download)
   * @param {string|number} trackId
   * @param {string} action - Action type (e.g., 'like', 'unlike', 'play', 'download')
   */
  async performAction(trackId, action) {
    return await fetchWithAuth(`${BASE_URL}/api/actions/${trackId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

// ============================================================================
// Convenience Exports
// ============================================================================

export default {
  Auth: AuthApi,
  Track: TrackApi,
  Playlist: PlaylistApi,
  Actions: ActionsApi,
  TokenStorage,
  SessionStorage,
  ApiError,
};
