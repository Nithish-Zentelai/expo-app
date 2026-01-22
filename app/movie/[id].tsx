import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import YoutubePlayer from 'react-native-youtube-iframe';

import { FullScreenLoader, MovieRow } from '../../src/components';
import {
    BORDER_RADIUS,
    COLORS,
    FONT_SIZES,
    FONT_WEIGHTS,
    SPACING,
} from '../../src/constants/theme';
import { useMovieDetails } from '../../src/hooks/useMovies';
import { useSupabaseMovieDetails } from '../../src/hooks/useSupabaseMovies';
import { Genre } from '../../src/api/tmdb';
import { getBackdropUrl, getPosterUrl } from '../../src/utils/image';
import {
    mapSupabaseMovieToTmdbDetails,
    mapSupabaseMoviesToTmdb
} from '../../src/utils/movie';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = 400;

// ============ Types ============

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============ Back Button Component ============

const BackButton = () => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.9);
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1);
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[styles.backButton, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.back()}
        >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </AnimatedPressable>
    );
};

// ============ Genre Chip Component ============

const GenreChip = ({ category }: { category: Genre }) => (
    <View style={styles.genreChip}>
        <Text style={styles.genreText}>{category.name}</Text>
    </View>
);

// ============ Cast Card Placeholder ============

const CastCardPlaceholder = ({ index }: { index: number }) => (
    <Animated.View
        style={styles.castCard}
        entering={FadeInUp.delay(index * 50).springify()}
    >
        <View style={[styles.castImage, styles.castPlaceholder]}>
            <Ionicons name="person" size={24} color={COLORS.textMuted} />
        </View>
        <Text style={styles.castName} numberOfLines={1}>
            Cast Member
        </Text>
        <Text style={styles.castCharacter} numberOfLines={1}>
            Role
        </Text>
    </Animated.View>
);

// ============ Info Row Component ============

interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

// ============ Action Button Component ============

interface ActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    primary?: boolean;
    disabled?: boolean;
}

const ActionButton = ({ icon, label, onPress, primary = false, disabled = false }: ActionButtonProps) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
        if (disabled) return;
        scale.value = withSpring(0.95);
    }, [scale, disabled]);

    const handlePressOut = useCallback(() => {
        if (disabled) return;
        scale.value = withSpring(1);
    }, [scale, disabled]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : 1,
    }));

    return (
        <AnimatedPressable
            style={[
                styles.actionButton,
                primary ? styles.primaryButton : styles.secondaryButton,
                animatedStyle,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
        >
            <Ionicons
                name={icon}
                size={24}
                color={primary ? COLORS.background : COLORS.text}
            />
            <Text
                style={[
                    styles.actionButtonText,
                    primary ? styles.primaryButtonText : styles.secondaryButtonText,
                ]}
            >
                {label}
            </Text>
        </AnimatedPressable>
    );
};

// ============ Error State ============

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <View style={styles.errorContainer}>
        <BackButton />
        <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={64} color={COLORS.primary} />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{message}</Text>
            <Pressable style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
        </View>
    </View>
);

// ============ Movie Details Screen ============

export default function MovieDetailsScreen() {
    // Get movie ID from route params (TMDB numeric string)
    const { id: movieId } = useLocalSearchParams<{ id: string }>();
    const isDbMovie = Boolean(movieId && movieId.startsWith('db_'));
    const dbMovieId = isDbMovie ? movieId!.replace('db_', '') : null;
    const movieIdNumber = !isDbMovie && movieId ? Number(movieId) : null;

    // Fetch movie details from TMDB
    const { movie, similar, loading, error, refetch, trailer } = useMovieDetails(
        Number.isFinite(movieIdNumber) ? movieIdNumber : null
    );
    const {
        movie: dbMovie,
        similar: dbSimilar,
        loading: dbLoading,
        error: dbError,
        refetch: dbRefetch
    } = useSupabaseMovieDetails(dbMovieId);

    const resolvedMovie = isDbMovie
        ? (dbMovie ? mapSupabaseMovieToTmdbDetails(dbMovie, dbMovie.categories) : null)
        : movie;
    const resolvedSimilar = isDbMovie ? mapSupabaseMoviesToTmdb(dbSimilar) : similar;
    const resolvedLoading = isDbMovie ? dbLoading : loading;
    const resolvedError = isDbMovie ? dbError : error;
    const resolvedRefetch = isDbMovie ? dbRefetch : refetch;

    // Trailer modal state
    const [showTrailer, setShowTrailer] = useState(false);
    const trailerKey = isDbMovie
        ? (dbMovie?.trailer_youtube_id ?? undefined)
        : (trailer?.site === 'YouTube' ? trailer.key : undefined);

    // Handle play trailer
    const handlePlayTrailer = useCallback(() => {
        if (trailerKey) {
            setShowTrailer(true);
        }
    }, [trailerKey]);

    // Handle add to My List
    const handleAddToList = useCallback(() => {
        // TODO: Implement My List functionality
        console.log('Add to My List:', movie?.title);
    }, [resolvedMovie]);

    // Format duration
    const formattedRuntime = useMemo(() => {
        if (!resolvedMovie?.runtime) return null;
        const hours = Math.floor(resolvedMovie.runtime / 60);
        const minutes = resolvedMovie.runtime % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }, [resolvedMovie?.runtime]);

    const backdropUrl = getBackdropUrl(resolvedMovie?.backdrop_path ?? resolvedMovie?.poster_path, 'original');
    const posterUrl = getPosterUrl(resolvedMovie?.poster_path, 'large');
    const releaseYear = resolvedMovie?.release_date ? resolvedMovie.release_date.split('-')[0] : '—';

    // Show loading state
    if (resolvedLoading) {
        return (
            <View style={styles.container}>
                <FullScreenLoader message="Loading movie details..." />
            </View>
        );
    }

    // Show error state
    if (resolvedError || !resolvedMovie) {
        return (
            <ErrorState
                message={resolvedError || 'Movie not found'}
                onRetry={resolvedRefetch}
            />
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Backdrop Image */}
                <View style={styles.backdropContainer}>
                    {backdropUrl && (
                        <Image
                            source={{ uri: backdropUrl }}
                            style={styles.backdropImage}
                            contentFit="cover"
                            transition={500}
                        />
                    )}

                    {/* Gradient Overlays */}
                    <LinearGradient
                        colors={['rgba(20, 20, 20, 0.5)', 'transparent', 'transparent', COLORS.background]}
                        locations={[0, 0.3, 0.5, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Back Button */}
                    <BackButton />
                </View>

                {/* Movie Info Section */}
                <View style={styles.infoSection}>
                    {/* Poster and Title Row */}
                    <Animated.View style={styles.titleRow} entering={FadeInUp.delay(100)}>
                        {posterUrl && (
                            <Image
                                source={{ uri: posterUrl }}
                                style={styles.poster}
                                contentFit="cover"
                                transition={300}
                            />
                        )}
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{resolvedMovie.title}</Text>

                            {/* Meta Info */}
                            <View style={styles.metaRow}>
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="star" size={16} color={COLORS.accentGold} />
                                    <Text style={styles.rating}>{(resolvedMovie.vote_average || 0).toFixed(1)}</Text>
                                </View>
                                <Text style={styles.metaSeparator}>•</Text>
                                <Text style={styles.year}>{releaseYear}</Text>
                                {formattedRuntime && (
                                    <>
                                        <Text style={styles.metaSeparator}>•</Text>
                                        <Text style={styles.runtime}>{formattedRuntime}</Text>
                                    </>
                                )}
                            </View>

                            {/* Genres / Categories */}
                            <View style={styles.genresContainer}>
                                {resolvedMovie.genres?.map((category) => (
                                    <GenreChip key={category.id} category={category} />
                                ))}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Action Buttons */}
                    <Animated.View style={styles.actionsRow} entering={FadeInUp.delay(200)}>
                        <ActionButton
                            icon="play"
                            label={trailerKey ? 'Play Trailer' : 'No Trailer'}
                            onPress={handlePlayTrailer}
                            primary
                            disabled={!trailerKey}
                        />
                        <ActionButton
                            icon="add"
                            label="My List"
                            onPress={handleAddToList}
                        />
                    </Animated.View>

                    {/* Overview */}
                    <Animated.View entering={FadeInDown.delay(300)}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <Text style={styles.overview}>{resolvedMovie.overview || 'No overview available.'}</Text>
                    </Animated.View>

                    {/* Additional Info */}
                    <Animated.View style={styles.additionalInfo} entering={FadeInDown.delay(350)}>
                        <InfoRow icon="calendar-outline" label="Release Date" value={resolvedMovie.release_date || '—'} />
                        <InfoRow icon="film-outline" label="Format" value="4K Ultra HD" />
                        <InfoRow icon="information-circle-outline" label="Availability" value="Streaming Now" />
                    </Animated.View>

                    {/* Cast Section (Placeholder for now) */}
                    <Animated.View entering={FadeInDown.delay(400)}>
                        <Text style={styles.sectionTitle}>Cast</Text>
                        <View style={styles.castContainer}>
                            <Text style={styles.footerText}>Cast information coming soon.</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* Similar Movies */}
                {resolvedSimilar.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(500)}>
                        <MovieRow
                            title="More Like This"
                            movies={resolvedSimilar}
                        />
                    </Animated.View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Exclusively on MatrixFlix
                    </Text>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Trailer Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showTrailer}
                onRequestClose={() => setShowTrailer(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Trailer</Text>
                            <Pressable
                                onPress={() => setShowTrailer(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </Pressable>
                        </View>

                        <View style={styles.videoContainer}>
                            <YoutubePlayer
                                height={240}
                                play={true}
                                videoId={trailerKey}
                                onChangeState={(state: string) => {
                                    if (state === 'ended') {
                                        setShowTrailer(false);
                                    }
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============ Styles ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    backdropContainer: {
        height: BACKDROP_HEIGHT,
        width: SCREEN_WIDTH,
        position: 'relative',
    },
    backdropImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 40,
        left: SPACING.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    infoSection: {
        paddingHorizontal: SPACING.lg,
        marginTop: -80,
    },
    titleRow: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: BORDER_RADIUS.md,
        marginRight: SPACING.lg,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        marginBottom: SPACING.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
    },
    metaSeparator: {
        color: COLORS.textMuted,
        marginHorizontal: SPACING.sm,
    },
    year: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    runtime: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    genreChip: {
        backgroundColor: COLORS.backgroundTertiary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    genreText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.medium,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.sm,
        gap: SPACING.sm,
    },
    primaryButton: {
        backgroundColor: COLORS.text,
    },
    secondaryButton: {
        backgroundColor: COLORS.backgroundTertiary,
    },
    actionButtonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.bold,
    },
    primaryButtonText: {
        color: COLORS.background,
    },
    secondaryButtonText: {
        color: COLORS.text,
    },
    tagline: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        marginBottom: SPACING.md,
        marginTop: SPACING.lg,
    },
    overview: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        lineHeight: 24,
    },
    additionalInfo: {
        marginTop: SPACING.lg,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    infoLabel: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
    },
    infoValue: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
        flex: 1,
    },
    castContainer: {
        height: 180,
    },
    castList: {
        paddingRight: SPACING.lg,
    },
    castCard: {
        width: 100,
        marginRight: SPACING.md,
        alignItems: 'center',
    },
    castImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: SPACING.sm,
    },
    castPlaceholder: {
        backgroundColor: COLORS.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    castName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
        textAlign: 'center',
        marginBottom: 2,
    },
    castCharacter: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xxl,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: 20,
    },
    // Error state
    errorContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    errorContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    errorTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    errorMessage: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.md,
    },
    retryButtonText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.bold,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.backgroundSecondary,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
});
