// /**
//  * Login Screen
//  * Automatically triggers Auth0 login when mounted
//  */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";

export default function LoginScreen() {
  const { authorize, user, isLoading } = useAuth0();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasTriedLogin = useRef(false);

  // Automatically trigger login on mount (only once)
  useEffect(() => {
    const autoLogin = async () => {
      // Only attempt login once, and only if not already authenticated
      if (hasTriedLogin.current || user || isAuthenticating) return;
      hasTriedLogin.current = true;
      setIsAuthenticating(true);

      try {
        console.log("[Auth] Starting automatic login...");

        const credentials = await authorize();
        console.log("[Auth] Authorize completed, credentials:", !!credentials);

        if (credentials) {
          console.log("[Auth] Login successful, navigating to home...");
          // Force navigation after successful auth
          router.replace("/(tabs)");
        }
      } catch (e: any) {
        console.log("[Auth] Login error:", e);
        // User cancelled or error occurred
        if (
          e?.message?.includes("cancelled") ||
          e?.message?.includes("canceled")
        ) {
          setAuthError("Login was cancelled. Please try again.");
        } else {
          setAuthError(e?.message || "Authentication failed");
        }
      } finally {
        setIsAuthenticating(false);
      }
    };

    // Small delay to ensure Auth0Provider is ready
    const timer = setTimeout(autoLogin, 500);
    return () => clearTimeout(timer);
  }, []); // Empty deps - only run once on mount

  const handleRetry = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      console.log("[Auth] Retrying login...");
      const credentials = await authorize();
      console.log("[Auth] Retry completed, credentials:", !!credentials);
      if (credentials) {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      console.log("[Auth] Retry error:", e);
      setAuthError(e?.message || "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // If user is authenticated, show loading (layout will redirect)
  if (user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, "#1a1a2e", COLORS.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Welcome back!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, "#1a1a2e", COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={styles.content} entering={FadeIn.delay(200)}>
        {/* Logo */}
        <Animated.Text style={styles.logo} entering={FadeInDown.delay(300)}>
          MATRIX
        </Animated.Text>
        <Text style={styles.tagline}>Unlimited movies, TV shows, and more</Text>

        {/* Loading State */}
        {(isLoading || isAuthenticating) && !authError && (
          <Animated.View style={styles.loadingContainer} entering={FadeIn}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Signing you in...</Text>
          </Animated.View>
        )}

        {/* Error State */}
        {authError && !isLoading && !isAuthenticating && (
          <Animated.View style={styles.errorContainer} entering={FadeIn}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={COLORS.error}
            />
            <Text style={styles.errorText}>{authError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Waiting state - before auth popup appears */}
        {!isLoading && !isAuthenticating && !authError && (
          <Animated.View style={styles.loadingContainer} entering={FadeIn}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Preparing login...</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xxl,
  },
  logo: {
    color: COLORS.primary,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xxl * 2,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.lg,
  },
  errorContainer: {
    alignItems: "center",
    padding: SPACING.xl,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 4,
  },
  retryButtonText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: FONT_SIZES.md,
  },
});
// import { useRouter } from "expo-router";
// import React, { useEffect } from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useAuth0 } from "react-native-auth0";

// export default function LoginScreen() {
//   const { authorize, user } = useAuth0();
//   const router = useRouter();

//   useEffect(() => {
//     if (user) {
//       router.replace("/home" as any);
//     }
//   }, [user]);

//   const handleLogin = async () => {
//     try {
//       await authorize();
//     } catch (err) {
//       console.error("Login failed:", err);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Auth0 Login</Text>
//       <Text style={styles.subtitle}>Welcome to Auth Login App</Text>

//       <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
//         <Text style={styles.loginButtonText}>Login with Auth0</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     backgroundColor: "#fff",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 10,
//     color: "#000",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     marginBottom: 40,
//     textAlign: "center",
//   },
//   loginButton: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 15,
//     paddingHorizontal: 40,
//     borderRadius: 8,
//   },
//   loginButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });
