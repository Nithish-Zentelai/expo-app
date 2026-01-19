/**
 * Search Screen
 * Animated search interface with debounced results and related suggestions
 * Now using Supabase for dynamic data fetching
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef } from 'react';
import {
    Dimensions,
    FlatList,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MovieCard, MovieCardSkeleton } from '../../src/components';
import { COLORS, FONT_SIZES, SPACING } from '../../src/constants/theme';
import { useSupabaseHomeData, useSupabaseSearchMovies } from '../../src/hooks/useSupabaseMovies';
import { Movie } from '../../src/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
    const {
        data: results = [],
        loading,
        query = '',
        search,
    } = useSupabaseSearchMovies();

    const { data: homeData } = useSupabaseHomeData();
    const inputRef = useRef<TextInput>(null);

    const handleSearch = (text: string) => {
        search(text);
    };

    const handleClear = () => {
        search('');
        inputRef.current?.clear();
        Keyboard.dismiss();
    };

    const handleSuggestionClick = (title: string) => {
        search(title);
        inputRef.current?.setNativeProps({ text: title });
        Keyboard.dismiss();
    };

    const onSearchSubmit = () => {
        Keyboard.dismiss();
    };

    // Calculate related movies (Trending but not in current results)
    const relatedMovies = useMemo(() => {
        if (!homeData.trending || homeData.trending.length === 0) return [];
        const resultIds = results?.map(r => r.id) || [];
        return homeData.trending.filter(m => !resultIds.includes(m.id)).slice(0, 6);
    }, [homeData.trending, results]);

    const renderItem = useCallback(({ item, index }: { item: Movie, index: number }) => (
        <Animated.View
            key={item.id}
            style={styles.cardWrapper}
            entering={FadeInDown.delay(index * 30)}
        >
            <MovieCard
                movie={item}
                width={SCREEN_WIDTH / 3 - 15}
                showRating={false}
            />
        </Animated.View>
    ), []);

    const ListFooterContent = useMemo(() => {
        if (query.trim().length > 0 && relatedMovies.length > 0) {
            return (
                <View style={styles.relatedSection}>
                    <Text style={styles.sectionTitle}>Related Content for "{query}"</Text>
                    <View style={styles.relatedGrid}>
                        {relatedMovies.map((item) => (
                            <View key={item.id} style={styles.cardWrapper}>
                                <MovieCard
                                    movie={item}
                                    width={SCREEN_WIDTH / 3 - 15}
                                    showRating={false}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            );
        }
        return null;
    }, [query, relatedMovies]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Search movies..."
                        placeholderTextColor={COLORS.textMuted}
                        value={query}
                        onChangeText={handleSearch}
                        onSubmitEditing={onSearchSubmit}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                    {query.length > 0 && Platform.OS !== 'ios' && (
                        <TouchableOpacity onPress={handleClear}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Default View (No Query) */}
            {query.trim().length === 0 && !loading && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.sectionTitle}>Recommended Searches</Text>
                    <View style={styles.suggestionsGrid}>
                        {['Cyber', 'Tokyo', 'Dragon', 'Silent', 'Ocean', 'Velocity'].map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                style={styles.suggestionTag}
                                onPress={() => handleSuggestionClick(tag)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.suggestionTagText}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.topSearchSection}>
                        <Text style={styles.sectionTitle}>Popular Content</Text>
                        {homeData.trending.slice(0, 4).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.topSearchItem}
                                onPress={() => handleSuggestionClick(item.title)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.topSearchLeft}>
                                    <View style={styles.thumbnailWrapper}>
                                        <MovieCard movie={item} width={100} height={60} showRating={false} />
                                    </View>
                                    <Text style={styles.topSearchTitle} numberOfLines={1}>{item.title}</Text>
                                </View>
                                <Ionicons name="play-circle-outline" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Results Grid */}
            <FlatList
                data={results || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    query.trim().length > 0 ? (
                        <Text style={styles.resultsTitle}>
                            {(results && results.length > 0) ? `Results for "${query}"` : null}
                        </Text>
                    ) : null
                }
                ListFooterComponent={ListFooterContent}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.skeletonGrid}>
                            {[...Array(9)].map((_, i) => (
                                <View key={i} style={styles.cardWrapper}>
                                    <MovieCardSkeleton
                                        index={i}
                                        width={SCREEN_WIDTH / 3 - 15}
                                        height={160}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (query.trim().length > 0 && (!results || results.length === 0) ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No matches for "{query}"</Text>
                        </View>
                    ) : null)
                }
            />
            <LinearGradient
                colors={['transparent', COLORS.background]}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    searchBarContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: SPACING.md,
        height: 52,
        borderRadius: 20,
        gap: SPACING.sm,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        paddingVertical: 10,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        zIndex: 5,
    },
    resultsList: {
        paddingHorizontal: 10,
        paddingBottom: 150,
    },
    cardWrapper: {
        padding: 4,
    },
    resultsTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: '800',
        marginVertical: SPACING.md,
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.md,
    },
    suggestionsContainer: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: 30,
    },
    suggestionTag: {
        backgroundColor: COLORS.backgroundTertiary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionTagText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
    },
    topSearchSection: {
        marginTop: 10,
    },
    topSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
        marginBottom: 10,
        paddingRight: 15,
        overflow: 'hidden',
    },
    topSearchLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    thumbnailWrapper: {
        marginRight: 15,
    },
    topSearchTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        flex: 1,
    },
    relatedSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.backgroundTertiary,
    },
    relatedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    }
});
