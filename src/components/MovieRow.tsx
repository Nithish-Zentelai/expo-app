/**
 * MovieRow Component
 * Horizontal scrollable row of movie cards - Netflix style
 */

import React, { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeInRight
} from 'react-native-reanimated';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { Movie } from '../api/tmdb';
import { MovieCardSkeleton } from './Loader';
import { LargeMovieCard, MovieCard } from './MovieCard';

// ============ Types ============

interface MovieRowProps {
    title: string;
    movies: Movie[];
    loading?: boolean;
    onSeeAllPress?: () => void;
    variant?: 'poster' | 'backdrop';
}

// ============ MovieRow Component ============

export const MovieRow = memo(({
    title,
    movies,
    loading = false,
    onSeeAllPress,
    variant = 'poster',
}: MovieRowProps) => {

    const renderMovieCard = useCallback(({ item, index }: { item: Movie; index: number }) => {
        if (variant === 'backdrop') {
            return (
                <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                    <LargeMovieCard movie={item} />
                </Animated.View>
            );
        }

        return (
            <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                <MovieCard movie={item} index={index} showTitle />
            </Animated.View>
        );
    }, [variant]);

    const keyExtractor = useCallback((item: Movie) => item.id.toString(), []);

    if (!loading && movies.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAllPress && (
                    <Pressable onPress={onSeeAllPress} style={styles.seeAllButton}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </Pressable>
                )}
            </View>

            {loading ? (
                <View style={styles.skeletonContainer}>
                    {[0, 1, 2, 3].map((index) => (
                        <MovieCardSkeleton key={index} index={index} />
                    ))}
                </View>
            ) : (
                <View style={variant === 'backdrop' ? styles.backdropListContainer : styles.listContainer}>
                    <FlatList
                        data={movies}
                        renderItem={renderMovieCard}
                        keyExtractor={keyExtractor}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        snapToAlignment="start"
                        decelerationRate="fast"
                    />
                </View>
            )}
        </View>
    );
});

// ============ Numbered Movie Row (Top 10 Style) ============

interface NumberedMovieRowProps {
    title: string;
    movies: Movie[];
    loading?: boolean;
}

export const NumberedMovieRow = memo(({
    title,
    movies,
    loading = false,
}: NumberedMovieRowProps) => {

    const renderNumberedCard = useCallback(({ item, index }: { item: Movie; index: number }) => {
        return (
            <Animated.View
                style={styles.numberedCard}
                entering={FadeInRight.delay(index * 50).springify()}
            >
                <Text style={styles.numberText}>{index + 1}</Text>
                <View style={styles.numberedCardContainer}>
                    <MovieCard
                        movie={item}
                        width={110}
                        height={160}
                        showRating={false}
                        showTitle
                    />
                </View>
            </Animated.View>
        );
    }, []);

    const keyExtractor = useCallback((item: Movie) => item.id.toString(), []);

    if (!loading && movies.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
            </View>

            {loading ? (
                <View style={styles.skeletonContainer}>
                    {[0, 1, 2, 3].map((index) => (
                        <MovieCardSkeleton key={index} index={index} />
                    ))}
                </View>
            ) : (
                <View style={styles.numberedListContainer}>
                    <FlatList
                        data={movies.slice(0, 10)}
                        renderItem={renderNumberedCard}
                        keyExtractor={keyExtractor}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: { paddingVertical: SPACING.lg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    title: { color: COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: '700' },
    seeAllText: { color: COLORS.primary, fontSize: FONT_SIZES.sm },
    seeAllButton: { padding: 5 },
    listContainer: { height: 190 },
    backdropListContainer: { height: 210 },
    listContent: { paddingHorizontal: SPACING.lg },
    skeletonContainer: { flexDirection: 'row', paddingHorizontal: SPACING.lg },
    numberedListContainer: { height: 180 },
    numberedCard: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginRight: SPACING.sm,
    },
    numberText: {
        fontSize: 120,
        fontWeight: '900',
        color: COLORS.background,
        lineHeight: 120,
        marginRight: -25,
        zIndex: 1,
        textShadowColor: COLORS.textMuted,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    numberedCardContainer: { marginBottom: 10 },
});

export default MovieRow;
