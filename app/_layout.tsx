/**
 * Root Layout
 * Main app layout with dark theme and navigation configuration
 * Handles automatic authentication flow
 */

import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Auth0Provider, useAuth0 } from "react-native-auth0";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { COLORS } from "../src/constants/theme";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Navigation component that handles auth state
function RootLayoutNav() {
  const { user, isLoading } = useAuth0();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Hide splash screen after layout is ready
    SplashScreen.hideAsync();
    setIsNavigationReady(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("[Layout] Auth state:", {
      user: user?.email || user?.sub || "none",
      isLoading,
      isNavigationReady,
      currentSegment: segments[0],
    });
  }, [user, isLoading, isNavigationReady, segments]);

  useEffect(() => {
    if (!isNavigationReady || isLoading) return;

    const inAuthGroup = segments[0] === "login";
    const isAuthenticated = !!user;

    console.log("[Layout] Navigation check:", { isAuthenticated, inAuthGroup });

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, redirect to login
      console.log("[Layout] Redirecting to login...");
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on login screen, redirect to home
      console.log("[Layout] Redirecting to home...");
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading, isNavigationReady]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      {/* Force dark status bar */}
      <StatusBar style="light" backgroundColor={COLORS.background} />

      {/* Navigation Stack */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: "slide_from_right",
        }}
      >
        {/* Login Screen */}
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />

        {/* Tab Navigator */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Movie Details Screen */}
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_bottom",
          }}
        />

        {/* Not Found Screen */}
        <Stack.Screen
          name="+not-found"
          options={{
            title: "Page Not Found",
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Auth0Provider
      domain={"dev-wsherv2c1s00n8pa.us.auth0.com"}
      clientId={"tIy58ClruMMBEXwn4bfvtP5cGvWPa1Y1"}
    >
      <GestureHandlerRootView style={styles.container}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </Auth0Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
