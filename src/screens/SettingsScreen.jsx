import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

import { AuthApi, TokenStorage } from '../api';
import { usePlayer } from '../PlayerContext';

// ============================================================================
// Auth Session Configuration
// ============================================================================

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: 'freemusic',
  path: 'auth',
});

// Google OAuth Discovery Document
const discoveryGoogle = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ============================================================================
// Helper Functions
// ============================================================================

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const APP_VERSION = '1.0.0';
const PRIVACY_POLICY_URL = 'https://freemusic.top/privacy';

// ============================================================================
// Sign In Button Component
// ============================================================================

const SignInButton = ({ onPress, loading }) => {
  if (loading) {
    return (
      <View style={styles.signInButton}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.signInButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#4285F4', '#357ABD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonGradient}
      >
        <View style={styles.googleIconContainer}>
          <Text style={styles.googleIcon}>G</Text>
        </View>
        <Text style={styles.signInButtonText}>Sign in with Google</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ============================================================================
// User Info Section Component
// ============================================================================

const UserInfoSection = ({ user, onLogout }) => {
  const avatarUri = user?.avatar_url || user?.picture || null;

  return (
    <View style={styles.userInfoContainer}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.userName} numberOfLines={1}>
        {user?.name || 'User'}
      </Text>

      {/* Email */}
      <Text style={styles.userEmail} numberOfLines={1}>
        {user?.email || ''}
      </Text>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// About Section Component
// ============================================================================

const AboutSection = () => {
  const handlePrivacyPolicy = useCallback(async () => {
    triggerHaptic();
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (error) {
      Alert.alert('Error', 'Could not open privacy policy link.');
    }
  }, []);

  return (
    <View style={styles.aboutSection}>
      <Text style={styles.sectionTitle}>About</Text>

      {/* App Version */}
      <View style={styles.aboutRow}>
        <Text style={styles.aboutLabel}>Version</Text>
        <Text style={styles.aboutValue}>{APP_VERSION}</Text>
      </View>

      {/* Privacy Policy */}
      <TouchableOpacity
        style={[styles.aboutRow, styles.linkRow]}
        onPress={handlePrivacyPolicy}
        activeOpacity={0.7}
      >
        <Text style={styles.aboutLabel}>Privacy Policy</Text>
        <Text style={styles.linkText}>View →</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// Main Settings Screen Component
// ============================================================================

export default function SettingsScreen() {
  const { resetPlayer } = usePlayer();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // Auth Request for Google Sign-In
  const [authRequest, response, promptAsync] = useAuthRequest(
    {
      clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
    },
    discoveryGoogle
  );

  // Check existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response);
    } else if (response?.type === 'error') {
      handleAuthError(response);
    }
  }, [response]);

  const checkExistingSession = async () => {
    try {
      const token = await TokenStorage.get();
      if (token) {
        const profile = await AuthApi.getProfile();
        setUser(profile);
      }
    } catch (error) {
      // Token invalid or expired, clear it
      await TokenStorage.remove();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (response) => {
    setSigningIn(true);
    try {
      const { code } = response.params;
      // Verify with backend using the auth code
      const userData = await AuthApi.verify(code);
      setUser(userData);
      triggerHaptic();
    } catch (error) {
      Alert.alert('Sign In Failed', error.message || 'Could not complete sign in.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleAuthError = (response) => {
    const errorDescription = response.params?.error_description || 'Authentication failed.';
    Alert.alert('Sign In Error', errorDescription);
  };

  const handleSignIn = useCallback(() => {
    triggerHaptic();
    if (authRequest) {
      promptAsync({ usePKCE: true });
    } else {
      Alert.alert('Error', 'Authentication is not configured.');
    }
  }, [authRequest, promptAsync]);

  const handleLogout = useCallback(async () => {
    triggerHaptic();
    try {
      await TokenStorage.remove();
      setUser(null);
      resetPlayer();
    } catch (error) {
      Alert.alert('Error', 'Could not sign out. Please try again.');
    }
  }, [resetPlayer]);

  // Loading state
  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <UserInfoSection user={user} onLogout={handleLogout} />
          ) : (
            <View style={styles.signInContainer}>
              <Text style={styles.signInDescription}>
                Sign in to sync your preferences and access premium features.
              </Text>
              <SignInButton onPress={handleSignIn} loading={signingIn} />
            </View>
          )}
        </View>

        {/* About Section */}
        <AboutSection />
      </ScrollView>
    </LinearGradient>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  signInContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  signInDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userInfoContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#e63946',
  },
  avatarFallback: {
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(230, 57, 70, 0.2)',
    borderWidth: 1,
    borderColor: '#e63946',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e63946',
  },
  aboutSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  aboutRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkRow: {
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#fff',
  },
  aboutValue: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  linkText: {
    fontSize: 16,
    color: '#4285F4',
  },
});
