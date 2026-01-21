/**
 * Search Screen
 * Animated search interface with debounced results and related suggestions
 * Uses TMDB search for real movie data
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Keyboard,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Movie } from '../../src/api/tmdb';
import { MovieCard, MovieCardSkeleton } from '../../src/components';
import { COLORS, FONT_SIZES, SPACING } from '../../src/constants/theme';
import { useHomeData, useSearchMovies } from '../../src/hooks/useMovies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const Voice = Platform.OS === 'web' ? null : require('@react-native-voice/voice').default;

export default function SearchScreen() {
    const {
        data: results = [],
        loading,
        query = '',
        search,
    } = useSearchMovies();

    const { data: homeData } = useHomeData();
    const inputRef = useRef<TextInput>(null);
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceSupported, setIsVoiceSupported] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognitionImpl) return;

            const recognition = new SpeechRecognitionImpl();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
                if (transcript.trim()) {
                    search(transcript);
                    syncInputText(transcript);
                }
            };
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);

            recognitionRef.current = recognition;
            setIsVoiceSupported(true);

            return () => {
                recognition.stop?.();
            };
        }

        if (!Voice) return;

        Voice.onSpeechResults = (event: { value?: string[] }) => {
            const transcript = event?.value?.[0] ?? '';
            if (transcript.trim()) {
                search(transcript);
                syncInputText(transcript);
            }
        };
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = () => setIsListening(false);

        const checkAvailability = async () => {
            try {
                const available = await Voice.isAvailable();
                setIsVoiceSupported(Boolean(available));
            } catch {
                setIsVoiceSupported(false);
            }
        };

        checkAvailability();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, [search]);

    const syncInputText = (text: string) => {
        const input = inputRef.current as { setNativeProps?: (args: { text: string }) => void } | null;
        if (input && typeof input.setNativeProps === 'function') {
            input.setNativeProps({ text });
        }
    };

    const handleSearch = (text: string) => {
        search(text);
    };

    const handleClear = () => {
        search('');
        if (typeof inputRef.current?.clear === 'function') {
            inputRef.current.clear();
        }
        Keyboard.dismiss();
    };

    const handleSuggestionClick = (title: string) => {
        search(title);
        syncInputText(title);
        Keyboard.dismiss();
    };

    const onSearchSubmit = () => {
        Keyboard.dismiss();
    };

    const requestAudioPermission = async () => {
        if (Platform.OS !== 'android') return true;
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone permission',
                message: 'We need access to your microphone for voice search.',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    };

    const handleVoicePress = async () => {
        if (!isVoiceSupported) {
            if (Platform.OS === 'web') {
                Alert.alert('Voice search unavailable', 'Your browser does not support speech recognition.');
            } else {
                Alert.alert('Voice search unavailable', 'Speech recognition is not available on this device.');
            }
            return;
        }

        if (Platform.OS === 'web') {
            if (isListening) {
                recognitionRef.current?.stop?.();
                setIsListening(false);
                return;
            }
            try {
                recognitionRef.current?.start?.();
                setIsListening(true);
            } catch {
                setIsListening(false);
            }
            return;
        }

        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Microphone permission denied', 'Enable microphone access to use voice search.');
                return;
            }

            if (isListening) {
                await Voice.stop();
                setIsListening(false);
                return;
            }

            await Voice.start('en-US');
            setIsListening(true);
        } catch {
            setIsListening(false);
        }
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
                showTitle
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
                                    showTitle
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
                    <TouchableOpacity
                        onPress={handleVoicePress}
                        style={styles.voiceButton}
                        accessibilityLabel="Voice search"
                    >
                        <Ionicons
                            name={isListening ? 'mic' : 'mic-outline'}
                            size={20}
                            color={isListening ? COLORS.accent : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
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
                                onPress={() => handleSuggestionClick(item.title || item.name || 'Untitled')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.topSearchLeft}>
                                    <View style={styles.thumbnailWrapper}>
                                        <MovieCard movie={item} width={100} height={60} showRating={false} />
                                    </View>
                                    <Text style={styles.topSearchTitle} numberOfLines={1}>{item.title || item.name || 'Untitled'}</Text>
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
    voiceButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
