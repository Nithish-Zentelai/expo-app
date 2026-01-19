/**
 * 404 Not Found Screen
 * Displayed when navigating to a non-existent route
 */

import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../src/constants/theme';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Page Not Found',
                    headerStyle: { backgroundColor: COLORS.background },
                    headerTintColor: COLORS.text,
                }}
            />
            <View style={styles.container}>
                {/* Animated Icon */}
                <Animated.View entering={FadeIn.delay(100)} style={styles.iconContainer}>
                    <Ionicons name="film-outline" size={100} color={COLORS.primary} />
                </Animated.View>

                {/* Error Code */}
                <Animated.Text style={styles.errorCode} entering={FadeInDown.delay(200)}>
                    404
                </Animated.Text>

                {/* Error Title */}
                <Animated.Text style={styles.title} entering={FadeInDown.delay(300)}>
                    Lost in the Stream
                </Animated.Text>

                {/* Error Description */}
                <Animated.Text style={styles.description} entering={FadeInDown.delay(400)}>
                    The page you're looking for doesn't exist or has been moved.
                </Animated.Text>

                {/* Home Button */}
                <Animated.View entering={FadeInUp.delay(500)}>
                    <Link href="/" asChild>
                        <Pressable style={styles.homeButton}>
                            <Ionicons name="home" size={20} color={COLORS.background} />
                            <Text style={styles.homeButtonText}>Back to Home</Text>
                        </Pressable>
                    </Link>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={styles.footer} entering={FadeIn.delay(600)}>
                    <Text style={styles.footerText}>
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </Text>
                </Animated.View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xxl,
    },
    iconContainer: {
        marginBottom: SPACING.lg,
        opacity: 0.7,
    },
    errorCode: {
        color: COLORS.primary,
        fontSize: 80,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: SPACING.sm,
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: '700',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        lineHeight: 22,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.text,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
    },
    homeButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: SPACING.xxl,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        textAlign: 'center',
    },
});
