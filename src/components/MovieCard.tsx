/**
 * MovieCard Component
 * Netflix-style movie poster card with press animations
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo, useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Movie } from '../api/tmdb';
import { BORDER_RADIUS, CARD_DIMENSIONS, COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { getPosterUrl } from '../utils/image';

// ============ Types ============

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
    showTitle?: boolean;
    showRating?: boolean;
    index?: number;
}

// Animated Pressable for smooth press effects
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============ MovieCard Component ============

/**
 * Movie poster card with animated press effects
 * Navigates to movie details on press
 */
export const MovieCard = memo(({
    movie,
    width = CARD_DIMENSIONS.poster.width,
    height = CARD_DIMENSIONS.poster.height,
    showTitle = false,
    showRating = true,
    index = 0,
}: MovieCardProps) => {
    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Get poster URL
    const posterUrl = getPosterUrl(movie.poster_path, 'medium');

    // Handle press animations
    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(0.8, { duration: 100 });
    }, [scale, opacity]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 100 });
    }, [scale, opacity]);

    // Navigate to movie details
    const handlePress = useCallback(() => {
        router.push(`/movie/${movie.id}`);
    }, [movie.id]);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Format rating
    const rating = movie.vote_average.toFixed(1);
    const ratingColor = movie.vote_average >= 7
        ? COLORS.success
        : movie.vote_average >= 5
            ? COLORS.warning
            : COLORS.error;

    return (
        <AnimatedPressable
            style={[styles.container, { width }, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            {/* Poster Image */}
            <View style={[styles.imageContainer, { width, height }]}>
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.poster}
                        contentFit="cover"
                        transition={300}
                        placeholder={require('../../assets/images/react-logo.png')}
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="film-outline" size={32} color={COLORS.textMuted} />
                        <Text style={styles.placeholderText}>NO IMAGE</Text>
                    </View>
                )}

                {/* Rating Badge */}
                {showRating && movie.vote_average > 0 && (
                    <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                )}

                {/* Gradient overlay at bottom */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />
            </View>

            {/* Movie Title */}
            {showTitle && (
                <Text style={styles.title} numberOfLines={2}>
                    {movie.title}
                </Text>
            )}
        </AnimatedPressable>
    );
});

MovieCard.displayName = 'MovieCard';

// ============ Large Movie Card (Backdrop Style) ============

interface LargeMovieCardProps {
    movie: Movie;
    onPress?: () => void;
}

/**
 * Larger movie card showing backdrop image
 * Used for featured content and recommendations
 */
export const LargeMovieCard = memo(({ movie, onPress }: LargeMovieCardProps) => {
    const scale = useSharedValue(1);

    const posterUrl = getPosterUrl(movie.backdrop_path || movie.poster_path, 'large');

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, [scale]);

    const handlePress = useCallback(() => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/movie/${movie.id}`);
        }
    }, [movie.id, onPress]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[styles.largeContainer, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            <View style={styles.largeImageContainer}>
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.largePoster}
                        contentFit="cover"
                        transition={300}
                    />
                ) : (
                    <View style={[styles.placeholder, styles.largePoster]}>
                        <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                )}

                {/* Gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />

                {/* Movie info at bottom */}
                <View style={styles.largeCardInfo}>
                    <Text style={styles.largeTitle} numberOfLines={1}>
                        {movie.title}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.releaseDate}>
                            {new Date(movie.release_date).getFullYear()}
                        </Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.star}>★</Text>
                            <Text style={styles.largeRating}>
                                {movie.vote_average.toFixed(1)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </AnimatedPressable>
    );
});

LargeMovieCard.displayName = 'LargeMovieCard';

// ============ Styles ============

const styles = StyleSheet.create({
    container: {
        marginRight: SPACING.md,
    },
    imageContainer: {
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        backgroundColor: COLORS.backgroundSecondary,
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
    },
    ratingBadge: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    ratingText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xs,
        fontWeight: '700',
    },
    title: {
        marginTop: SPACING.sm,
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
    },
    // Large card styles
    largeContainer: {
        marginRight: SPACING.md,
        width: CARD_DIMENSIONS.backdrop.width,
    },
    largeImageContainer: {
        width: CARD_DIMENSIONS.backdrop.width,
        height: CARD_DIMENSIONS.backdrop.height,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        backgroundColor: COLORS.backgroundSecondary,
    },
    largePoster: {
        width: '100%',
        height: '100%',
    },
    largeCardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.md,
    },
    largeTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    releaseDate: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        color: COLORS.accentGold,
        fontSize: FONT_SIZES.sm,
        marginRight: 2,
    },
    largeRating: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
    },
});

export default MovieCard;
