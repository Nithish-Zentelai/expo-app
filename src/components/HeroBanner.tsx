/**
 * HeroBanner Component
 * Full-width hero banner showcasing featured movies in a slider - Netflix style
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo, useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useSharedValue
} from 'react-native-reanimated';
import {
    CARD_DIMENSIONS,
    COLORS,
    FONT_SIZES,
    SPACING
} from '../constants/theme';
import { Movie } from '../types/database.types';
import { getBackdropUrl } from '../utils/image';
import { HeroBannerSkeleton } from './Loader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroBannerProps {
    movies: Movie[];
    loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HeroItem = memo(({ movie }: { movie: Movie }) => {
    const playScale = useSharedValue(1);
    const backdropUrl = getBackdropUrl(movie.backdrop_url, 'large');

    const handlePress = useCallback(() => {
        router.push(`/movie/${movie.id}`);
    }, [movie.id]);

    return (
        <View style={styles.itemContainer}>
            <View style={styles.imageContainer}>
                {backdropUrl && (
                    <Image
                        source={{ uri: backdropUrl }}
                        style={styles.backdropImage}
                        contentFit="cover"
                        transition={500}
                    />
                )}
                <LinearGradient
                    colors={[
                        'rgba(20, 20, 20, 0.1)',
                        'rgba(20, 20, 20, 0)',
                        'rgba(20, 20, 20, 0.6)',
                        COLORS.background,
                    ]}
                    locations={[0, 0.3, 0.7, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <View style={styles.contentContainer}>
                <Animated.Text style={styles.title} numberOfLines={2}>
                    {movie.title}
                </Animated.Text>

                <View style={styles.metaContainer}>
                    <Text style={styles.rating}>★ {(movie.rating || 0).toFixed(1)}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.year}>{movie.release_year}</Text>
                </View>

                <Text style={styles.overview} numberOfLines={2}>
                    {movie.description}
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePress}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="play" size={20} color={COLORS.background} />
                        <Text style={styles.playButtonText}>Play</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.infoButton}
                        onPress={handlePress}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.text} />
                        <Text style={styles.infoButtonText}>Info</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

import { TouchableOpacity } from 'react-native';

export const HeroBanner = memo(({ movies, loading = false }: HeroBannerProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (loading || !movies || movies.length === 0) {
        return <HeroBannerSkeleton />;
    }

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container}>
            <FlatList
                data={movies.slice(0, 5)}
                renderItem={({ item }) => <HeroItem movie={item} />}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                keyExtractor={(item) => item.id.toString()}
            />
            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {movies.slice(0, 5).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            activeIndex === i && styles.activeDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
});

export const CompactHero = memo(({ backdropPath, title, onBackPress }: any) => {
    const backdropUrl = getBackdropUrl(backdropPath, 'large');
    return (
        <View style={styles.compactContainer}>
            {backdropUrl && (
                <Image
                    source={{ uri: backdropUrl }}
                    style={styles.compactBackdrop}
                    contentFit="cover"
                />
            )}
            <LinearGradient
                colors={['rgba(20, 20, 20, 0.5)', 'transparent', COLORS.background]}
                style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => onBackPress ? onBackPress() : router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { height: CARD_DIMENSIONS.hero.height, width: SCREEN_WIDTH },
    itemContainer: { width: SCREEN_WIDTH, height: CARD_DIMENSIONS.hero.height },
    imageContainer: { ...StyleSheet.absoluteFillObject },
    backdropImage: { width: '100%', height: '100%' },
    contentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: '900',
        marginBottom: 8,
        textShadowColor: 'black',
        textShadowRadius: 10,
    },
    metaContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rating: { color: COLORS.success, fontWeight: '700', fontSize: FONT_SIZES.sm },
    separator: { color: COLORS.textMuted, marginHorizontal: 8 },
    year: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    overview: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        lineHeight: 18,
        marginBottom: 15,
    },
    buttonContainer: { flexDirection: 'row', gap: 10 },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.text,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 4,
        gap: 5,
    },
    playButtonText: { color: COLORS.background, fontWeight: '700' },
    infoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(109, 109, 110, 0.7)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 4,
        gap: 5,
    },
    infoButtonText: { color: COLORS.text, fontWeight: '700' },
    pagination: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { backgroundColor: COLORS.primary, width: 20 },
    compactContainer: { width: SCREEN_WIDTH, height: 280 },
    compactBackdrop: { width: '100%', height: '100%' },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default HeroBanner;
