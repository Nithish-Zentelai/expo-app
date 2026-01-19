/**
 * Loader Component
 * Skeleton loaders and loading indicators for Netflix-style loading states
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { BORDER_RADIUS, CARD_DIMENSIONS, COLORS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ Skeleton Shimmer Effect ============

interface SkeletonProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: object;
}

/**
 * Animated skeleton placeholder with shimmer effect
 */
export const Skeleton = memo(({ width, height, borderRadius = BORDER_RADIUS.sm, style }: SkeletonProps) => {
    const translateX = useSharedValue(-SCREEN_WIDTH);

    useEffect(() => {
        translateX.value = withRepeat(
            withSequence(
                withTiming(SCREEN_WIDTH, { duration: 1000 }),
                withTiming(-SCREEN_WIDTH, { duration: 0 })
            ),
            -1, // Infinite repeat
            false
        );
    }, [translateX]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View
            style={[
                styles.skeletonBase,
                { width, height, borderRadius },
                style,
            ]}
        >
            <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

Skeleton.displayName = 'Skeleton';

// ============ Movie Card Skeleton ============

interface MovieCardSkeletonProps {
    index?: number;
    width?: number;
    height?: number;
}

/**
 * Skeleton loader for movie poster cards
 */
export const MovieCardSkeleton = memo(({
    index = 0,
    width = CARD_DIMENSIONS.poster.width,
    height = CARD_DIMENSIONS.poster.height
}: MovieCardSkeletonProps) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withDelay(
            index * 100,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0.3, { duration: 800 })
                ),
                -1,
                true
            )
        );
    }, [index, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.movieCardSkeleton, animatedStyle]}>
            <Skeleton
                width={width}
                height={height}
                borderRadius={BORDER_RADIUS.md}
            />
        </Animated.View>
    );
});


MovieCardSkeleton.displayName = 'MovieCardSkeleton';

// ============ Movie Row Skeleton ============

/**
 * Skeleton loader for horizontal movie row
 */
export const MovieRowSkeleton = memo(() => {
    return (
        <View style={styles.rowSkeleton}>
            {/* Title skeleton */}
            <Skeleton
                width={150}
                height={24}
                style={styles.titleSkeleton}
            />

            {/* Cards skeleton */}
            <View style={styles.cardsContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <MovieCardSkeleton key={index} index={index} />
                ))}
            </View>
        </View>
    );
});

MovieRowSkeleton.displayName = 'MovieRowSkeleton';

// ============ Hero Banner Skeleton ============

/**
 * Skeleton loader for hero banner
 */
export const HeroBannerSkeleton = memo(() => {
    return (
        <View style={styles.heroBannerSkeleton}>
            <Skeleton
                width="100%"
                height={CARD_DIMENSIONS.hero.height}
                borderRadius={0}
            />

            {/* Content overlay skeleton */}
            <View style={styles.heroContentSkeleton}>
                <Skeleton width={200} height={32} style={styles.heroTitleSkeleton} />
                <Skeleton width={280} height={16} style={styles.heroSubtitleSkeleton} />
                <View style={styles.heroButtonsContainer}>
                    <Skeleton width={100} height={40} borderRadius={BORDER_RADIUS.sm} />
                    <Skeleton width={100} height={40} borderRadius={BORDER_RADIUS.sm} />
                </View>
            </View>
        </View>
    );
});

HeroBannerSkeleton.displayName = 'HeroBannerSkeleton';

// ============ Full Screen Loader ============

interface FullScreenLoaderProps {
    message?: string;
}

/**
 * Full screen loading indicator
 */
export const FullScreenLoader = memo(({ message }: FullScreenLoaderProps) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 600 }),
                withTiming(1, { duration: 600 })
            ),
            -1,
            true
        );
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.fullScreenLoader}>
            <Animated.View style={animatedStyle}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </Animated.View>
            {message && (
                <Animated.Text style={styles.loadingMessage}>{message}</Animated.Text>
            )}
        </View>
    );
});

FullScreenLoader.displayName = 'FullScreenLoader';

// ============ Home Screen Skeleton ============

/**
 * Complete skeleton for home screen
 */
export const HomeScreenSkeleton = memo(() => {
    return (
        <View style={styles.homeScreenSkeleton}>
            <HeroBannerSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
        </View>
    );
});

HomeScreenSkeleton.displayName = 'HomeScreenSkeleton';

// ============ Styles ============

const styles = StyleSheet.create({
    skeletonBase: {
        backgroundColor: COLORS.skeletonBase,
        overflow: 'hidden',
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
    },
    movieCardSkeleton: {
        marginRight: SPACING.md,
    },
    rowSkeleton: {
        paddingVertical: SPACING.lg,
    },
    titleSkeleton: {
        marginLeft: SPACING.lg,
        marginBottom: SPACING.md,
    },
    cardsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
    },
    heroBannerSkeleton: {
        height: CARD_DIMENSIONS.hero.height,
        backgroundColor: COLORS.backgroundSecondary,
        position: 'relative',
    },
    heroContentSkeleton: {
        position: 'absolute',
        bottom: SPACING.xxl,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    heroTitleSkeleton: {
        marginBottom: SPACING.sm,
    },
    heroSubtitleSkeleton: {
        marginBottom: SPACING.lg,
    },
    heroButtonsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    fullScreenLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingMessage: {
        marginTop: SPACING.lg,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    homeScreenSkeleton: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});

export default {
    Skeleton,
    MovieCardSkeleton,
    MovieRowSkeleton,
    HeroBannerSkeleton,
    FullScreenLoader,
    HomeScreenSkeleton,
};
