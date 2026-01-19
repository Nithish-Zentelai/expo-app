/**
 * Home screen with sliding hero banner and functional category filters
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { HeroBanner, HomeScreenSkeleton, MovieRow, NumberedMovieRow } from '../../src/components';
import { COLORS, FONT_SIZES, SPACING } from '../../src/constants/theme';
import { useHomeData } from '../../src/hooks/useMovies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Category = 'Home' | 'TV Shows' | 'Movies' | 'My List';

// ============ Header Component ============

const Header = ({ activeCategory, onCategoryChange }: { activeCategory: Category, onCategoryChange: (cat: Category) => void }) => {

    const handleHomePress = () => {
        onCategoryChange('Home');
    };

    return (
        <Animated.View style={styles.header} entering={FadeIn.delay(100)}>
            <TouchableOpacity onPress={handleHomePress} activeOpacity={0.7}>
                <Text style={styles.logo}>MATRIX</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
                {(['TV Shows', 'Movies', 'My List'] as Category[]).map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onCategoryChange(cat)}
                        style={styles.headerButton}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.headerText,
                            activeCategory === cat && styles.activeHeaderText
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
};

// ============ Footer Component ============

const Footer = () => (
    <View style={styles.footer}>
        <Text style={styles.footerText}>
            This product uses high-quality static assets for demonstration.
        </Text>
        <Text style={styles.footerCopyright}>© 2025 Matrix • All Rights Reserved</Text>
    </View>
);

// ============ Home Screen Component ============

export default function HomeScreen() {
    const { data, loading, error, refetch } = useHomeData();
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>('Home');

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const renderedContent = useMemo(() => {
        if (loading) return null;

        if (activeCategory === 'TV Shows') {
            return (
                <Animated.View entering={FadeInDown}>
                    <MovieRow title="New Releases" movies={data.tvShows} loading={loading} />
                    <MovieRow title="Bingeworthy Stories" movies={data.tvShows.slice().reverse()} loading={loading} variant="backdrop" />
                    <MovieRow title="Top Sci-Fi" movies={data.tvShows.filter(m => m.genre_ids.includes(878))} loading={loading} />
                </Animated.View>
            );
        }

        if (activeCategory === 'Movies') {
            return (
                <Animated.View entering={FadeInDown}>
                    <MovieRow title="Blockbusters" movies={data.popular} loading={loading} />
                    <MovieRow title="Critically Acclaimed" movies={data.topRated} loading={loading} variant="backdrop" />
                    <MovieRow title="Upcoming" movies={data.upcoming} loading={loading} />
                    <MovieRow title="Thriller & Mystery" movies={data.popular.slice().reverse()} loading={loading} />
                </Animated.View>
            );
        }

        if (activeCategory === 'My List') {
            return (
                <Animated.View entering={FadeInDown}>
                    {data.myList.length > 0 ? (
                        <MovieRow title="Your Watchlist" movies={data.myList} loading={loading} />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="add-circle-outline" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Your list is empty.</Text>
                            <TouchableOpacity style={styles.browseButton} onPress={() => setActiveCategory('Home')}>
                                <Text style={styles.browseButtonText}>Browse Projects</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            );
        }

        // Home View - Default
        return (
            <>
                <Animated.View entering={FadeInDown.delay(200)}>
                    <NumberedMovieRow title="Top 10 Today" movies={data.trending} loading={loading} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)}>
                    <MovieRow title="Popular on Matrix" movies={data.popular} loading={loading} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400)}>
                    <MovieRow title="Trending Now" movies={data.nowPlaying} loading={loading} variant="backdrop" />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500)}>
                    <MovieRow title="Critically Acclaimed" movies={data.topRated} loading={loading} />
                </Animated.View>
            </>
        );
    }, [data, loading, activeCategory]);

    if (loading && !refreshing) {
        return <View style={styles.container}><HomeScreenSkeleton /></View>;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                <View style={styles.headerContainer}>
                    <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
                </View>

                {/* Sliding Hero Banner */}
                {activeCategory === 'Home' && (
                    <HeroBanner movies={data.trending} loading={loading} />
                )}

                {/* Content with conditional margin if hero is hidden */}
                <View style={activeCategory !== 'Home' ? { marginTop: 110 } : null}>
                    {renderedContent}
                </View>

                <Footer />
                <View style={styles.tabBarSpacer} />
            </ScrollView>

            <LinearGradient colors={[COLORS.background, 'transparent']} style={styles.topGradient} pointerEvents="none" />
            <LinearGradient
                colors={['transparent', COLORS.background]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </View>
    );
}

import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: SPACING.xl },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 10,
        paddingBottom: 10,
    },
    logo: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.lg,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerRight: { flexDirection: 'row', gap: SPACING.md },
    headerButton: { padding: 5 },
    headerText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
    },
    activeHeaderText: {
        color: COLORS.text,
        fontWeight: '700',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        zIndex: 5,
    },
    footer: { padding: SPACING.xxl, alignItems: 'center', opacity: 0.6 },
    footerText: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm, textAlign: 'center' },
    footerCopyright: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    tabBarSpacer: { height: 100 },
    emptyContainer: { padding: 80, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, marginTop: 20, marginBottom: 30 },
    browseButton: {
        backgroundColor: COLORS.text,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 4,
    },
    browseButtonText: { color: COLORS.background, fontWeight: '700' }
});
